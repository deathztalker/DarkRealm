import { DB } from '../systems/db.js';
import { bus } from '../engine/EventBus.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const SERVER_URL_LOCAL = 'http://localhost:3000';
const SERVER_URL_REMOTE = 'https://darkrealm-production.up.railway.app';
const PING_INTERVAL_MS = 5_000;
const MAX_MOVEMENT_DELTA = 800;   // px/tick — anti-cheat: reject impossible jumps
const LATENCY_GOOD = 100;
const LATENCY_WARN = 250;
const RECENT_MESSAGES = 50;

/**
 * NetworkManager — Handles Socket.io communication, state sync, and relay events.
 *
 * Improvements over v1:
 *  • All socket handlers wrapped in try/catch — one bad packet can't crash the game.
 *  • Movement anti-cheat: rejects teleport-level deltas from remote players.
 *  • Party state uses a single source of truth (this.currentParty) with a dedicated
 *    setter that always updates the HUD, preventing stale renders.
 *  • Trade & duel state machines with explicit status tracking — no more ghost trades
 *    or double-accept bugs.
 *  • Duplicate-event guard on `trade_invite` (was registered in both
 *    setupSocketHandlers and setupTradeHandlers).
 *  • `joinZone` validates player existence before emitting.
 *  • Proper cleanup in `destroy()` — removes all listeners and subscriptions.
 *  • Rate-limiting helper for outgoing chat to prevent spam.
 */
export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;

        /** @type {Map<string, PlayerSnapshot>} */
        this.otherPlayers = new Map();

        this.isConnected = false;
        this.isHost = false;

        // ── Subscriptions / timers ──────────────────────────────────────────
        this.chatSubscription = null;
        this._pingInterval = null;
        this._partyChannel = null;

        // ── Party ───────────────────────────────────────────────────────────
        /** @type {Party|null} */
        this._currentParty = null;

        // ── Trade state machine ─────────────────────────────────────────────
        // States: 'idle' | 'invited' | 'open' | 'locked' | 'confirmed'
        this._trade = {
            state: 'idle',
            tradeId: null,
            partnerName: null,
            pendingFrom: null,
        };

        // ── Duel state machine ──────────────────────────────────────────────
        // States: 'idle' | 'invited' | 'active'
        this._duel = {
            state: 'idle',
            opponentId: null,
            pendingFrom: null,
        };

        // ── Anti-spam: chat rate limiter ────────────────────────────────────
        this._lastChatTime = 0;
        this._CHAT_COOLDOWN_MS = 500;
        this._pendingZoneId = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC ACCESSORS
    // ═══════════════════════════════════════════════════════════════════════

    get currentParty() { return this._currentParty; }

    /** Always updates HUD when party changes. */
    set currentParty(party) {
        this._currentParty = party;
        window.updatePartyHUD?.(party?.members ?? []);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════

    initEvents() {
        bus.on('combat:spawnProjectile', ({ proj }) => {
            if (!this.isConnected) return;
            this.socket.emit('projectile_fire', {
                x: proj.x, y: proj.y,
                targetX: proj.targetX, targetY: proj.targetY,
                type: proj.type,
                speed: proj.speed,
                icon: proj.icon,
                skillId: proj.skillId,
            });
        });

        bus.on('combat:spawnAoE', ({ aoe }) => {
            if (!this.isConnected) return;
            this.socket.emit('skill_use', {
                skillId: aoe.skillId,
                x: aoe.x, y: aoe.y,
                type: aoe.type,
                radius: aoe.radius,
            });
        });
    }

    async init() {
        if (typeof io !== 'undefined') {
            const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
            const serverUrl = isLocal ? SERVER_URL_LOCAL : SERVER_URL_REMOTE;

            console.log(`[Network] Connecting to: ${serverUrl}`);
            this.socket = io(serverUrl, {
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
            });

            this.setupSocketHandlers();
            this.setupTradeHandlers();
            this.setupDuelHandlers();
        } else {
            console.warn('[Network] Socket.io not found — offline mode.');
        }

        if (DB.isLoggedIn()) {
            this.chatSubscription = DB.subscribeToChat((payload) => {
                this._safeCall(() => this.handleIncomingDbMessage(payload));
            });

            try {
                const { data: recent } = await DB.client
                    .from('messages')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(RECENT_MESSAGES);

                if (recent) {
                    recent.reverse().forEach(msg =>
                        this._safeCall(() => this.handleIncomingDbMessage(msg, true))
                    );
                }
            } catch (e) {
                console.error('[Network] Error loading recent messages:', e);
            }

            this.setupPartyRealtime();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOCKET HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    setupSocketHandlers() {
        const s = this.socket;

        s.on('connect', () => {
            console.log('[Network] Connected. ID:', s.id);
            this.isConnected = true;
            this.startPingLoop();

            if (this.game.player) {
                // If we had a pending join, execute it now
                if (this._pendingZoneId !== null) {
                    this.joinZone(this._pendingZoneId);
                    this._pendingZoneId = null;
                } else {
                    // Fallback to basic join
                    s.emit('join', {
                        x: this.game.player.x,
                        y: this.game.player.y,
                        classId: this.game.player.classId,
                        name: this.game.player.charName,
                    });
                }
            }
        });

        s.on('disconnect', (reason) => {
            console.warn('[Network] Disconnected:', reason);
            this.isConnected = false;
            this.otherPlayers.clear();
            this._resetTradeState();
            this._resetDuelState();
        });

        s.on('reconnect', () => {
            console.log('[Network] Reconnected.');
            // Re-join current zone automatically
            if (window.zoneLevel != null) this.joinZone(window.zoneLevel);
        });

        // ── Player roster ──────────────────────────────────────────────────
        s.on('current_players', (players) => this._safeCall(() => {
            this.otherPlayers.clear(); // Clear old state
            for (const [id, pData] of Object.entries(players)) {
                if (id !== s.id) {
                    this.otherPlayers.set(id, { ...pData, charName: pData.name ?? 'Traveler' });
                }
            }
            this.isHost = this.otherPlayers.size === 0;
            if (this.isHost) console.log('[Network] You are Zone Host.');
        }));

        s.on('player_joined', (player) => this._safeCall(() => {
            player.charName = player.name ?? 'Traveler';
            this.otherPlayers.set(player.id, player);
            this._sysMsg(`${player.charName} has entered the realm.`);
        }));

        s.on('player_left', (id) => this._safeCall(() => {
            const player = this.otherPlayers.get(id);
            if (player) this._sysMsg(`${player.charName} has left the realm.`);
            this.otherPlayers.delete(id);
        }));

        // ── Movement (with anti-cheat) ─────────────────────────────────────
        s.on('player_moved', (data) => this._safeCall(() => {
            const player = this.otherPlayers.get(data.id);
            if (!player) return;

            // Anti-cheat: reject impossible position jumps
            const dx = Math.abs((data.x ?? player.x) - player.x);
            const dy = Math.abs((data.y ?? player.y) - player.y);
            if (dx > MAX_MOVEMENT_DELTA || dy > MAX_MOVEMENT_DELTA) {
                console.warn(`[Network] Suspicious move from ${data.id} (Δ${dx},${dy}) — ignored.`);
                return;
            }

            Object.assign(player, data);
            if (data.name) player.charName = data.name;

            // Sync party member position
            if (this._currentParty) {
                const member = this._currentParty.members.find(m => m.id === player.id);
                if (member) { member.x = data.x; member.y = data.y; }
                window.updatePartyHUD?.(this._currentParty.members);
            }
        }));

        // ── Skills / Minions / Mercs ───────────────────────────────────────
        s.on('player_skill', (data) => this._safeCall(() => {
            if (this.otherPlayers.has(data.id)) {
                window.fx?.triggerSkillEffect?.(data.skillId, data.x, data.y, data.targetX, data.targetY);
            }
        }));

        s.on('player_minions_sync', (data) => this._safeCall(() => {
            const p = this.otherPlayers.get(data.id);
            if (p) p.minions = data.minions;
        }));

        s.on('player_merc_sync', (data) => this._safeCall(() => {
            const p = this.otherPlayers.get(data.id);
            if (p) p.mercenary = data.mercenary;
        }));

        // ── Host assignment ────────────────────────────────────────────────
        s.on('host_assignment', (status) => this._safeCall(() => {
            this.isHost = !!status;
            console.log(`[Network] Host: ${this.isHost}`);
        }));

        // ── Enemies ────────────────────────────────────────────────────────
        s.on('enemy_damaged', (data) => this._safeCall(() => {
            if (typeof data.damage !== 'number' || data.damage < 0) return; // validate
            const enemy = this.game.enemies?.find(e => e.syncId === data.enemyId);
            if (enemy) enemy.hp = Math.max(0, enemy.hp - data.damage);
        }));

        s.on('enemy_death', (enemyId) => this._safeCall(() => {
            const enemy = this.game.enemies?.find(e => e.syncId === enemyId);
            if (enemy) enemy.hp = 0;
        }));

        s.on('enemy_sync', (data) => this._safeCall(() => {
            if (this.isHost || !Array.isArray(data)) return;
            data.forEach(ed => {
                const enemy = this.game.enemies?.find(e => e.syncId === ed.id);
                if (enemy) {
                    enemy.x = ed.x;
                    enemy.y = ed.y;
                    enemy.hp = ed.hp;
                    enemy.animState = ed.anim;
                    enemy.facingDir = ed.dir;
                }
            });
        }));

        s.on('npc_sync', (data) => this._safeCall(() => {
            if (this.isHost || !Array.isArray(data)) return;
            data.forEach(nd => {
                const npc = this.game.npcs?.find(n => n.id === nd.id);
                if (npc) { npc.x = nd.x; npc.y = nd.y; }
            });
        }));

        // ── World objects / loot ───────────────────────────────────────────
        s.on('object_update', (data) => this._safeCall(() => {
            const obj = this.game.gameObjects?.find(o => o.id === data.id);
            if (!obj) return;
            obj.isOpen = data.isOpen;
            if (obj.isOpen) obj.icon = obj.type === 'shrine' ? 'obj_shrine_used' : 'obj_chest_open';
        }));

        s.on('portal_spawn', (data) => this._safeCall(() => {
            if (this.game.gameObjects?.some(o => o.id === data.id)) return;
            const tp = new this.game.GameObjectClass('portal', data.x, data.y, 'obj_portal', data.id);
            tp.targetZone = data.targetZone;
            tp.name = data.name ?? 'Town Portal';
            this.game.gameObjects?.push(tp);
            window.fx?.emitBurst(tp.x, tp.y, '#30ccff', 40, 3);
        }));

        s.on('projectile_spawn', (data) => this._safeCall(() => {
            this.game.spawnRemoteProjectile?.(data);
        }));

        s.on('loot_spawn', (data) => this._safeCall(() => this.game.onRemoteLootSpawn?.(data)));
        s.on('loot_pickup', (lootId) => this._safeCall(() => this.game.onRemoteLootPickup?.(lootId)));

        s.on('zone_theme_sync', (theme) => this._safeCall(() => {
            if (!this.isHost) window.currentTheme = theme;
        }));

        // ── Chat ───────────────────────────────────────────────────────────
        s.on('chat_message', (msg) => this._safeCall(() => {
            this.game.onChatMessage?.({
                sender: msg.sender ?? 'Stranger',
                text: msg.text ?? msg.content ?? '',
                time: msg.time ?? this._now(),
            });
        }));

        s.on('whisper', (msg) => this._safeCall(() => {
            this.game.onChatMessage?.({
                sender: msg.sender ?? 'Stranger',
                text: msg.text ?? msg.content ?? '',
                time: msg.time ?? this._now(),
                isWhisper: true,
            });
        }));

        s.on('system_message', (text) => this._safeCall(() => {
            if (typeof text !== 'string') return;
            this._sysMsg(text);
        }));

        // ── Party (socket-level) ───────────────────────────────────────────
        s.on('party_invite', (data) => this._safeCall(() => {
            // Deduplicate: ignore if already in a pending invite from same person
            if (this._pendingPartyFrom === data.fromId) return;
            this._pendingPartyFrom = data.fromId;

            window.addSocialRequest?.(data.fromId, data.from, 'party');
            this._sysMsg(`${data.from} has invited you to a party! Type /party accept to join.`);
        }));

        s.on('party_joined', (party) => this._safeCall(() => {
            if (!party?.members) return;
            const leader = party.members.find(m => m.id === party.leaderId);
            this.currentParty = {
                id: party.id,
                leaderId: party.leaderId,
                members: party.members.map(m => ({ ...m, charName: m.name ?? 'Party Member' })),
            };
            window.addCombatLog?.(`Joined party led by ${leader?.name ?? 'Leader'}`, 'log-info');
        }));

        s.on('party_member_update', (data) => this._safeCall(() => {
            if (!this._currentParty) return;
            const member = this._currentParty.members.find(m => m.id === data.id);
            if (member) {
                Object.assign(member, data);
                window.updatePartyHUD?.(this._currentParty.members);
            }
        }));

        s.on('party_disbanded', () => this._safeCall(() => {
            this.currentParty = null;
            this._pendingPartyFrom = null;
            this._sysMsg('Your party has been disbanded.');
        }));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRADE STATE MACHINE
    // ═══════════════════════════════════════════════════════════════════════

    setupTradeHandlers() {
        const s = this.socket;

        s.on('trade_invite', (data) => this._safeCall(() => {
            if (this._trade.state !== 'idle') {
                // Already in a trade — auto-decline
                s.emit('trade_decline', data.fromId);
                return;
            }
            this._trade.state = 'invited';
            this._trade.pendingFrom = data.fromId;
            this._trade.partnerName = data.from;

            window.addSocialRequest?.(data.fromId, data.from, 'trade');
            this._sysMsg(`${data.from} wants to trade. Type /trade accept to begin.`);
        }));

        s.on('trade_start', (data) => this._safeCall(() => {
            this._trade.state = 'open';
            this._trade.tradeId = data.tradeId;
            this.game.onTradeStart?.(data.partner);
        }));

        s.on('trade_update', (data) => this._safeCall(() => {
            if (this._trade.state !== 'open' && this._trade.state !== 'locked') return;
            // Reset lock if partner changes offer
            if (this._trade.state === 'locked') this._trade.state = 'open';
            this.game.onTradePartnerUpdate?.(data.offer);
        }));

        s.on('trade_status', (data) => this._safeCall(() => {
            if (data.locked) this._trade.state = 'locked';
            this.game.onTradeStatusUpdate?.(data);
        }));

        s.on('trade_execute', (data) => this._safeCall(() => {
            this.game.onTradeExecute?.(data.receive, data.give);
            this._resetTradeState();
        }));

        s.on('trade_cancelled', () => this._safeCall(() => {
            this._resetTradeState();
            this._sysMsg('Trade was cancelled.');
        }));
    }

    _resetTradeState() {
        this._trade = { state: 'idle', tradeId: null, partnerName: null, pendingFrom: null };
        this.game.onTradeClosed?.();
    }

    // ── Public trade API ───────────────────────────────────────────────────

    sendTradeInvite(name) {
        if (!this.isConnected) return;
        if (this._trade.state !== 'idle') {
            this._sysMsg('You are already in a trade session.');
            return;
        }
        this.socket.emit('trade_invite', name);
    }

    acceptTrade() {
        if (!this.isConnected) return;
        if (this._trade.state !== 'invited' || !this._trade.pendingFrom) {
            this._sysMsg('No pending trade invite.');
            return;
        }
        this.socket.emit('trade_accept', this._trade.pendingFrom);
        this._trade.pendingFrom = null;
        // State will move to 'open' on trade_start event
    }

    declineTrade() {
        if (!this.isConnected || !this._trade.pendingFrom) return;
        this.socket.emit('trade_decline', this._trade.pendingFrom);
        this._resetTradeState();
    }

    updateTradeOffer(offer) {
        if (!this.isConnected || this._trade.state !== 'open') return;
        this.socket.emit('trade_update', { tradeId: this._trade.tradeId, offer });
    }

    lockTrade() {
        if (!this.isConnected || this._trade.state !== 'open') return;
        this.socket.emit('trade_lock', { tradeId: this._trade.tradeId });
        this._trade.state = 'locked';
    }

    confirmTrade() {
        if (!this.isConnected || this._trade.state !== 'locked') return;
        this.socket.emit('trade_confirm', { tradeId: this._trade.tradeId });
        this._trade.state = 'confirmed';
    }

    cancelTrade() {
        if (!this.isConnected || this._trade.state === 'idle') return;
        this.socket.emit('trade_cancel', { tradeId: this._trade.tradeId });
        this._resetTradeState();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DUEL STATE MACHINE
    // ═══════════════════════════════════════════════════════════════════════

    setupDuelHandlers() {
        const s = this.socket;

        s.on('duel_invite', (data) => this._safeCall(() => {
            if (this._duel.state !== 'idle') {
                s.emit('duel_decline', data.fromId);
                return;
            }
            this._duel.state = 'invited';
            this._duel.pendingFrom = data.fromId;
            this._sysMsg(`${data.from} challenges you to a duel! Type /duel accept to fight.`);
        }));

        s.on('duel_start', (data) => this._safeCall(() => {
            this._duel.state = 'active';
            this._duel.opponentId = data.opponentId;
            this._duel.pendingFrom = null;
            this.game.onDuelStart?.(data.opponentName);
        }));

        s.on('duel_end', (data) => this._safeCall(() => {
            this.game.onDuelEnd?.(data.winner);
            this._resetDuelState();
        }));
    }

    _resetDuelState() {
        this._duel = { state: 'idle', opponentId: null, pendingFrom: null };
    }

    // ── Public duel API ────────────────────────────────────────────────────

    sendDuelInvite(name) {
        if (!this.isConnected) return;
        if (this._duel.state !== 'idle') {
            this._sysMsg('You are already in a duel.');
            return;
        }
        this.socket.emit('duel_invite', name);
    }

    acceptDuel() {
        if (!this.isConnected) return;
        if (this._duel.state !== 'invited' || !this._duel.pendingFrom) {
            this._sysMsg('No pending duel challenge.');
            return;
        }
        this.socket.emit('duel_accept', this._duel.pendingFrom);
        this._duel.pendingFrom = null;
        // State moves to 'active' on duel_start
    }

    declineDuel() {
        if (!this.isConnected || !this._duel.pendingFrom) return;
        this.socket.emit('duel_decline', this._duel.pendingFrom);
        this._resetDuelState();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PARTY
    // ═══════════════════════════════════════════════════════════════════════

    setupPartyRealtime() {
        this._partyChannel = DB.client
            .channel('party-sync')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'party_members',
            }, async (payload) => {
                const userId = DB.session?.user.id;
                const affected = payload.new?.user_id ?? payload.old?.user_id;
                if (affected === userId) await this.refreshPartyState();
            })
            .subscribe();
    }

    async refreshPartyState() {
        const userId = DB.session?.user.id;
        if (!userId) return;

        try {
            const { data: memberRecord } = await DB.client
                .from('party_members')
                .select('party_id')
                .eq('user_id', userId)
                .maybeSingle();

            if (!memberRecord) { this.currentParty = null; return; }

            const { data: party, error } = await DB.client
                .from('parties')
                .select('*, party_members(user_id, profiles(charName))')
                .eq('id', memberRecord.party_id)
                .single();

            if (error || !party) { this.currentParty = null; return; }

            this.currentParty = {
                id: party.id,
                leaderId: party.leader_id,
                members: party.party_members.map(m => ({
                    id: m.user_id,
                    charName: m.profiles?.charName ?? (m.user_id === userId ? this.game.player?.charName : 'Party Member'),
                    hp: 100, maxHp: 100, mp: 80, maxMp: 80,
                })),
            };
        } catch (e) {
            console.error('[Network] refreshPartyState error:', e);
        }
    }

    async sendPartyInvite(name) {
        if (!this.isConnected) return;
        this.socket.emit('party_invite', name);

        try {
            const target = await DB.findUserByName(name);
            if (target) {
                if (!this._currentParty) {
                    const newParty = await DB.createParty();
                    if (newParty) await DB.joinParty(target.user_id);
                } else {
                    await DB.joinParty(target.user_id);
                }
            }
        } catch (e) {
            console.error('[Network] sendPartyInvite DB error:', e);
        }

        this._sysMsg(`Invited ${name} to party.`);
    }

    acceptPartyInvite(fromId) {
        if (!this.isConnected) return;
        if (!this._pendingPartyFrom) {
            this._sysMsg('No pending party invite.');
            return;
        }
        this.socket.emit('party_accept', fromId);
        this._pendingPartyFrom = null;
        // Party state updated via 'party_joined' event — do NOT call refreshPartyState here
        // to avoid replacing socket-provided IDs with Supabase UUIDs prematurely.
    }

    leaveParty() {
        if (!this.isConnected || !this._currentParty) return;
        this.socket.emit('party_leave');
        this.currentParty = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MOVEMENT & COMBAT EMIT
    // ═══════════════════════════════════════════════════════════════════════

    sendMovement(x, y, animState, facingDir) {
        if (!this.isConnected || !this.game.player) return;
        const p = this.game.player;
        this.socket.emit('move', {
            x, y, animState, facingDir,
            hp: p.hp, maxHp: p.maxHp,
            mp: p.mp, maxMp: p.maxMp,
            activeAura: p.activeAura,
        });
    }

    sendEnemyDamaged(enemyId, damage) {
        if (!this.isConnected || typeof damage !== 'number' || damage <= 0) return;
        this.socket.emit('enemy_damaged', { enemyId, damage, dealerId: this.socket.id });
    }

    sendEnemyDeath(enemyId) {
        if (this.isConnected) this.socket.emit('enemy_death', enemyId);
    }

    sendEnemySync(enemyData) {
        if (this.isConnected && this.isHost) this.socket.emit('enemy_sync', enemyData);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAT
    // ═══════════════════════════════════════════════════════════════════════

    async sendChat(text) {
        if (typeof text !== 'string' || !text.trim()) return;

        // Rate limiting — prevent spam
        const now = performance.now();
        if (now - this._lastChatTime < this._CHAT_COOLDOWN_MS) return;
        this._lastChatTime = now;

        if (this.isConnected) this.socket.emit('chat_message', text);
        try { await DB.sendMessage(text); } catch (e) { console.error('[Network] sendChat DB error:', e); }
    }

    async sendWhisper(targetName, text) {
        try {
            const target = await DB.findUserByName(targetName);
            if (target) {
                await DB.sendMessage(text, target.user_id, true);
            } else {
                this._sysMsg(`Player "${targetName}" not found.`);
            }
        } catch (e) {
            console.error('[Network] sendWhisper error:', e);
        }
    }

    async handleIncomingDbMessage(msg, isHistory = false) {
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isMe = msg.sender_id === DB.session?.user.id;
        const senderName = isMe ? (this.game.player?.charName ?? 'Me') : (msg.sender_name ?? 'Other Player');

        if (msg.is_whisper) {
            if (isMe || msg.receiver_id === DB.session?.user.id) {
                this.game.onWhisper?.({
                    sender: senderName,
                    target: msg.receiver_name ?? 'Recipient',
                    text: msg.content,
                    time,
                });
            }
        } else {
            this.game.onChatMessage?.({ sender: senderName, text: msg.content, time });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIAL
    // ═══════════════════════════════════════════════════════════════════════

    async addFriend(name) {
        try {
            const target = await DB.findUserByName(name);
            if (target) {
                await DB.addFriend(target.user_id);
                this._sysMsg(`Friend request sent to ${name}.`);
            } else {
                this._sysMsg(`Player "${name}" not found.`);
            }
        } catch (e) {
            console.error('[Network] addFriend error:', e);
        }
    }

    async inspectPlayer(name) {
        try {
            const data = await DB.findUserByName(name);
            if (data?.player) {
                this.game.onInspectData?.(data.player);
            } else {
                this._sysMsg(`Player "${name}" not found.`);
            }
        } catch (e) {
            console.error('[Network] inspectPlayer error:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE
    // ═══════════════════════════════════════════════════════════════════════

    joinZone(zoneId) {
        if (!this.isConnected) return;
        if (!this.game.player) { console.warn('[Network] joinZone: player not ready.'); return; }

        const modePrefix = this.game.player.isHardcore ? 'hc_' : 'std_';
        const diffSuffix = `_diff_${window._difficulty ?? 0}`;
        let roomName = `${modePrefix}zone_${zoneId}${diffSuffix}`;

        if (this._currentParty && zoneId !== 0) {
            roomName = `${modePrefix}party_${this._currentParty.id}_zone_${zoneId}${diffSuffix}`;
        }

        // Deterministic seed
        let seed = 12345;
        if (zoneId !== 0) {
            if (this._currentParty) {
                const hash = this._currentParty.id
                    .split('-')
                    .reduce((acc, p) => acc + parseInt(p, 16), 0);
                seed = Math.abs(hash + zoneId) % 1_000_000;
            } else {
                const nameHash = [...this.game.player.charName]
                    .reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
                seed = Math.abs(nameHash + zoneId) % 1_000_000;
            }
        }

        console.log(`[Network] Join zone: ${roomName} | Seed: ${seed}`);
        this.socket.emit('join_zone', {
            zoneId, roomName, seed,
            playerData: this.game.player.serialize(),
        });
        window._currentZoneSeed = seed;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEADERBOARD
    // ═══════════════════════════════════════════════════════════════════════

    async getLeaderboardData(filter = 'global') {
        try {
            let query = DB.client
                .from('saves')
                .select(`charName:player->>charName, classId:player->>classId, isHardcore:player->>isHardcore, extra_data`)
                .order('extra_data->riftLevel', { ascending: false })
                .limit(20);

            if (filter === 'class' && this.game.player) query = query.eq('player->>classId', this.game.player.classId);
            if (filter === 'hardcore') query = query.eq('player->>isHardcore', 'true');

            const { data, error } = await query;
            if (error) throw error;

            return data.map(row => ({
                charName: row.charName,
                classId: row.classId,
                isHardcore: row.isHardcore === 'true' || row.isHardcore === true,
                campaign: row.extra_data?.campaign ?? null,
                extra_data: row.extra_data,
            }));
        } catch (e) {
            console.error('[Network] Leaderboard error:', e);
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PING
    // ═══════════════════════════════════════════════════════════════════════

    startPingLoop() {
        if (!this.socket) return;
        if (this._pingInterval) clearInterval(this._pingInterval);

        // NOTE: Socket.io reserves 'ping' and 'pong' internally — using them
        // causes the payload to arrive as undefined, producing a latency of 0ms.
        // We use 'latency_ping' / 'latency_pong' as custom event names instead.
        // Your server must mirror this: socket.on('latency_ping', t => socket.emit('latency_pong', t))
        this.socket.on('latency_pong', (startTime) => {
            if (typeof startTime !== 'number') return; // guard against bad payload
            const latency = Math.round(performance.now() - startTime);
            this.updatePingUI(latency);
        });

        this._pingInterval = setInterval(() => {
            if (this.isConnected) this.socket.emit('latency_ping', performance.now());
            else this.updatePingUI(null);
        }, PING_INTERVAL_MS);
    }

    updatePingUI(latency) {
        const dot = document.getElementById('ping-dot');
        const val = document.getElementById('ping-value');
        if (!dot || !val) return;

        if (latency === null) {
            dot.style.backgroundColor = '#666';
            val.textContent = 'Offline';
            return;
        }

        val.textContent = `${latency}ms`;
        dot.style.backgroundColor =
            latency < LATENCY_GOOD ? '#4caf50' :
                latency < LATENCY_WARN ? '#ffc107' : '#f44336';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════

    destroy() {
        clearInterval(this._pingInterval);
        this._partyChannel?.unsubscribe?.();
        this.chatSubscription?.unsubscribe?.();
        this.socket?.disconnect?.();
        this.otherPlayers.clear();
        this._resetTradeState();
        this._resetDuelState();
        this.currentParty = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /** Wraps a handler so a single bad packet never crashes the game loop. */
    _safeCall(fn) {
        try { fn(); }
        catch (e) { console.error('[Network] Handler error:', e); }
    }

    _sysMsg(text) {
        this.game.onChatMessage?.({
            sender: 'System',
            text,
            time: this._now(),
            isSystem: true,
        });
    }

    _now() {
        return new Date().toLocaleTimeString();
    }
}