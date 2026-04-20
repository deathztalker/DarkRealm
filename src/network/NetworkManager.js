import { DB } from '../systems/db.js';
import { bus } from '../engine/EventBus.js';

/**
 * NetworkManager — Handles Socket.io communication, state sync, and relay events.
 */
export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.otherPlayers = new Map(); // socketId -> { x, y, animState, facingDir, classId, name }
        this.isConnected = false;
        this.isHost = false; // Is this client the 'Host' responsible for enemy AI sync?
        this.chatSubscription = null;
        this.currentParty = null; // { id, leader_id, members: [] }
    }

    initEvents() {
        // --- LOCAL EVENTS -> NETWORK ---
        
        // Sincronizar lanzamiento de proyectiles
        bus.on('combat:spawnProjectile', ({ proj }) => {
            if (this.isConnected) {
                this.socket.emit('projectile_fire', {
                    x: proj.x,
                    y: proj.y,
                    targetX: proj.targetX,
                    targetY: proj.targetY,
                    type: proj.type,
                    speed: proj.speed,
                    icon: proj.icon,
                    skillId: proj.skillId
                });
            }
        });

        // Sincronizar efectos de área (AoE)
        bus.on('combat:spawnAoE', ({ aoe }) => {
            if (this.isConnected) {
                this.socket.emit('skill_use', {
                    skillId: aoe.skillId,
                    x: aoe.x,
                    y: aoe.y,
                    type: aoe.type,
                    radius: aoe.radius
                });
            }
        });
    }

    async init() {
        // --- Socket.io for High-Speed Movement Sync ---
        if (typeof io !== 'undefined') {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const serverUrl = isLocal ? 'http://localhost:3000' : 'https://darkrealm-production.up.railway.app'; 
            
            console.log(`Connecting to socket server at: ${serverUrl}`);
            this.socket = io(serverUrl);
            this.setupSocketHandlers();
            this.setupTradeHandlers();
            this.setupDuelHandlers();
        } else {
            console.warn('Socket.io client not found. Running movement in offline mode.');
        }

        // --- Supabase for Persistent Chat & Social ---
        if (DB.isLoggedIn()) {
            this.chatSubscription = DB.subscribeToChat((payload) => {
                this.handleIncomingDbMessage(payload);
            });
            
            // Cargar mensajes recientes al iniciar
            try {
                const { data: recent, error } = await DB.client
                    .from('messages')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);
                
                if (recent) {
                    recent.reverse().forEach(msg => this.handleIncomingDbMessage(msg, true));
                }
            } catch (e) {
                console.error('Error loading recent messages:', e);
            }

            // Party Realtime Subscription
            this.setupPartyRealtime();
        }
    }

    setupSocketHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to game server. ID:', this.socket.id);
            this.isConnected = true;
            if (this.game.player) {
                this.socket.emit('join', {
                    x: this.game.player.x,
                    y: this.game.player.y,
                    classId: this.game.player.classId,
                    name: this.game.player.charName
                });
            }
        });

        this.socket.on('current_players', (players) => {
            for (const id in players) {
                if (id !== this.socket.id) {
                    const pData = players[id];
                    this.otherPlayers.set(id, {
                        ...pData,
                        charName: pData.name || 'Other Player'
                    });
                }
            }
            if (this.otherPlayers.size === 0) {
                this.isHost = true;
                console.log('No other players. You are now the Zone Host.');
            }
        });

        this.socket.on('player_joined', (player) => {
            player.charName = player.name || 'Other Player';
            this.otherPlayers.set(player.id, player);
            this.game.onChatMessage?.({ sender: 'System', text: `${player.charName} has entered the realm.`, isSystem: true });
        });

        // --- MMO: Portals & Synced Objects ---
        this.socket.on('portal_spawn', (data) => {
            // Check if portal already exists locally
            const existing = this.game.gameObjects?.find(o => o.id === data.id);
            if (!existing) {
                const tp = new this.game.GameObjectClass('portal', data.x, data.y, 'obj_portal', data.id);
                tp.targetZone = data.targetZone;
                tp.name = data.name || 'Town Portal';
                this.game.gameObjects?.push(tp);
                if (window.fx) window.fx.emitBurst(tp.x, tp.y, '#30ccff', 40, 3);
            }
        });

        // --- Social Invites ---
        this.socket.on('party_invite', (data) => {
            console.log('[Network] Party invite received:', data);
            window.addSocialRequest?.(data.fromId, data.from, 'party');
            this.game.onChatMessage?.({ 
                sender: 'System', 
                text: `${data.from} has invited you to a party!`, 
                time: new Date().toLocaleTimeString(),
                isSystem: true 
            });
        });

        this.socket.on('party_joined', (party) => {
            console.log('[Network] Party joined:', party);
            this.currentParty = party;
            window.addCombatLog?.(`Joined party led by ${party.members.find(m => m.id === party.leaderId)?.name || 'Leader'}`, 'log-info');
            window.updatePartyHUD?.(party.members);
        });

        this.socket.on('trade_invite', (data) => {
            window.addSocialRequest?.(data.fromId, data.from, 'trade');
            this.game.onChatMessage?.({ sender: 'System', text: `${data.from} wants to trade.`, isSystem: true });
        });

        this.socket.on('player_moved', (data) => {
            const player = this.otherPlayers.get(data.id);
            if (player) {
                Object.assign(player, data);
                if (data.name) player.charName = data.name;
                
                // If in party, update HUD stats
                if (this.currentParty && this.currentParty.members.some(m => m.id === player.id)) {
                    const member = this.currentParty.members.find(m => m.id === player.id);
                    member.x = data.x;
                    member.y = data.y;
                    window.updatePartyHUD?.(this.currentParty.members);
                }
            }
        });

        this.socket.on('player_skill', (data) => {
            const player = this.otherPlayers.get(data.id);
            if (player) {
                // Trigger visual effect for the skill on other player's position
                // (This requires a hook into the FX system)
                window.fx?.triggerSkillEffect?.(data.skillId, data.x, data.y, data.targetX, data.targetY);
            }
        });

        this.socket.on('player_minions_sync', (data) => {
            const player = this.otherPlayers.get(data.id);
            if (player) player.minions = data.minions;
        });

        this.socket.on('player_merc_sync', (data) => {
            const player = this.otherPlayers.get(data.id);
            if (player) player.mercenary = data.mercenary;
        });

        this.socket.on('player_left', (id) => {
            this.otherPlayers.delete(id);
        });

        this.socket.on('host_assignment', (status) => {
            this.isHost = status;
            console.log('Host Assignment:', status ? 'You are now the Zone Host' : 'You are a Guest');
        });

        this.socket.on('enemy_damaged', (data) => {
            const enemy = this.game.enemies?.find(e => e.syncId === data.enemyId);
            if (enemy) enemy.hp -= data.damage;
        });

        this.socket.on('enemy_death', (enemyId) => {
            const enemy = this.game.enemies?.find(e => e.syncId === enemyId);
            if (enemy) enemy.hp = 0;
        });

        this.socket.on('enemy_sync', (data) => {
            if (!this.isHost) {
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
            }
        });

        this.socket.on('npc_sync', (data) => {
            if (!this.isHost) {
                data.forEach(nd => {
                    const npc = this.game.npcs?.find(n => n.id === nd.id);
                    if (npc) {
                        npc.x = nd.x;
                        npc.y = nd.y;
                    }
                });
            }
        });

        // --- MMO TOTAL SYNC: Objects, Projectiles & Loot ---
        this.socket.on('object_update', (data) => {
            const obj = this.game.gameObjects?.find(o => o.id === data.id);
            if (obj) {
                obj.isOpen = data.isOpen;
                if (obj.isOpen) obj.icon = (obj.type === 'shrine') ? 'obj_shrine_used' : 'obj_chest_open';
            }
        });

        this.socket.on('projectile_spawn', (data) => {
            // Trigger a visual-only projectile for other players
            if (this.game.spawnRemoteProjectile) {
                this.game.spawnRemoteProjectile(data);
            }
        });

        this.socket.on('loot_spawn', (data) => {
            // Add item to global dropped items list
            if (this.game.onRemoteLootSpawn) {
                this.game.onRemoteLootSpawn(data);
            }
        });

        this.socket.on('loot_pickup', (lootId) => {
            // Remove item from global dropped items list
            if (this.game.onRemoteLootPickup) {
                this.game.onRemoteLootPickup(lootId);
            }
        });

        this.socket.on('zone_theme_sync', (theme) => {
            if (!this.isHost) {
                console.log(`[MMO] Syncing zone theme to: ${theme}`);
                window.currentTheme = theme;
                // Note: Changing theme visually might require a redraw/re-emit of particles
            }
        });

        this.socket.on('chat_message', (msg) => {
            console.log('[Network] Socket chat:', msg);
            this.game.onChatMessage?.({
                sender: msg.sender || 'Stranger',
                text: msg.text || msg.content || '',
                time: msg.time || new Date().toLocaleTimeString()
            });
        });

        this.socket.on('whisper', (msg) => {
            console.log('[Network] Socket whisper:', msg);
            this.game.onChatMessage?.({
                sender: msg.sender || 'Stranger',
                text: msg.text || msg.content || '',
                time: msg.time || new Date().toLocaleTimeString(),
                isWhisper: true
            });
        });

        this.socket.on('system_message', (text) => {
            this.game.onChatMessage?.({
                sender: 'System',
                text: text,
                time: new Date().toLocaleTimeString(),
                isSystem: true
            });
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.otherPlayers.clear();
        });
    }

    setupPartyRealtime() {
        // Subscribe to party_members changes for the current user
        DB.client
            .channel('party-sync')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'party_members' 
            }, async (payload) => {
                const userId = DB.session?.user.id;
                if (payload.new.user_id === userId || payload.old?.user_id === userId) {
                    await this.refreshPartyState();
                }
            })
            .subscribe();
    }

    async refreshPartyState() {
        const userId = DB.session?.user.id;
        const { data: memberRecord } = await DB.client
            .from('party_members')
            .select('party_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (memberRecord) {
            const { data: party } = await DB.client
                .from('parties')
                .select('*, party_members(user_id)')
                .eq('id', memberRecord.party_id)
                .single();
            
            this.currentParty = party;
            // Fetch names for members (simplified: in real app use profiles table)
            this.currentParty.members = party.party_members.map(m => ({
                id: m.user_id,
                name: m.user_id === userId ? this.game.player.charName : 'Party Member',
                hp: 100, maxHp: 100, mp: 80, maxMp: 80 // Placeholders
            }));
        } else {
            this.currentParty = null;
        }
        window.updatePartyHUD?.(this.currentParty?.members || []);
    }

    async handleIncomingDbMessage(msg, isHistory = false) {
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Determinar el nombre del remitente real
        const isMe = msg.sender_id === DB.session?.user.id;
        const senderName = isMe ? (this.game.player?.charName || 'Me') : (msg.sender_name || 'Other Player');

        if (msg.is_whisper) {
            if (isMe || msg.receiver_id === DB.session?.user.id) {
                const targetName = msg.receiver_name || 'Recipient';
                this.game.onWhisper?.({
                    sender: senderName,
                    target: targetName,
                    text: msg.content,
                    time: time
                });
            }
        } else {
            this.game.onChatMessage?.({
                sender: senderName,
                text: msg.content,
                time: time
            });
        }
    }

    sendMovement(x, y, animState, facingDir) {
        if (this.isConnected) this.socket.emit('move', { x, y, animState, facingDir });
    }

    sendEnemyDamaged(enemyId, damage) {
        if (this.isConnected) this.socket.emit('enemy_damaged', { enemyId, damage, dealerId: this.socket.id });
    }

    sendEnemyDeath(enemyId) {
        if (this.isConnected) this.socket.emit('enemy_death', enemyId);
    }

    sendEnemySync(enemyData) {
        if (this.isConnected && this.isHost) this.socket.emit('enemy_sync', enemyData);
    }

    async sendChat(text) {
        if (this.isConnected) this.socket.emit('chat_message', text);
        await DB.sendMessage(text);
    }

    async sendWhisper(targetName, text) {
        const target = await DB.findUserByName(targetName);
        if (target) {
            await DB.sendMessage(text, target.user_id, true);
        } else {
            this.game.onChatMessage?.({ 
                sender: 'System', text: `Player "${targetName}" not found.`, 
                time: new Date().toLocaleTimeString(), isSystem: true 
            });
        }
    }

    async addFriend(name) {
        const target = await DB.findUserByName(name);
        if (target) {
            await DB.addFriend(target.user_id);
            this.game.onChatMessage?.({ 
                sender: 'System', text: `Friend request sent to ${name}.`, 
                time: new Date().toLocaleTimeString(), isSystem: true 
            });
        }
    }

    async sendPartyInvite(name) {
        if (this.isConnected) this.socket.emit('party_invite', name);

        // Backup to DB
        const target = await DB.findUserByName(name);
        if (target) {
            if (!this.currentParty) {
                const newParty = await DB.createParty();
                if (newParty) await DB.joinParty(target.user_id);
            } else {
                await DB.joinParty(target.user_id);
            }
        }

        this.game.onChatMessage?.({
            sender: 'System', text: `Invited ${name} to party.`,
            time: new Date().toLocaleTimeString(), isSystem: true
        });
    }

    acceptPartyInvite(fromId) {
        if (this.isConnected) {
            this.socket.emit('party_accept', fromId);
            this.refreshPartyState();
        }
    }
    // --- Inspect Logic ---
    async inspectPlayer(name) {
        const data = await DB.findUserByName(name);
        if (data && data.player) {
            this.game.onInspectData?.(data.player);
        } else {
            this.game.onChatMessage?.({ 
                sender: 'System', text: `Player "${name}" not found.`, 
                time: new Date().toLocaleTimeString(), isSystem: true 
            });
        }
    }

    // --- Trade Socket Handlers ---
    setupTradeHandlers() {
        this.socket.on('trade_invite', (data) => {
            this.game.onChatMessage?.({
                sender: 'System',
                text: `${data.from} wants to trade. Type "/trade accept" to begin.`,
                time: new Date().toLocaleTimeString(),
                isSystem: true,
                onSelect: () => this.socket.emit('trade_accept', data.fromId)
            });
            this.pendingTradeFrom = data.fromId;
        });

        this.socket.on('trade_start', (data) => {
            this.currentTradeId = data.tradeId;
            this.game.onTradeStart?.(data.partner);
        });

        this.socket.on('trade_update', (data) => {
            this.game.onTradePartnerUpdate?.(data.offer);
        });

        this.socket.on('trade_status', (data) => {
            this.game.onTradeStatusUpdate?.(data);
        });

        this.socket.on('trade_execute', (data) => {
            this.game.onTradeExecute?.(data.receive, data.give);
            this.currentTradeId = null;
        });
    }

    setupDuelHandlers() {
        this.socket.on('duel_invite', (data) => {
            this.game.onChatMessage?.({
                sender: 'System',
                text: `${data.from} challenges you to a duel! Type "/duel accept" to fight.`,
                time: new Date().toLocaleTimeString(),
                isSystem: true
            });
            this.pendingDuelFrom = data.fromId;
        });

        this.socket.on('duel_start', (data) => {
            this.duelOpponentId = data.opponentId;
            this.game.onDuelStart?.(data.opponentName);
        });

        this.socket.on('duel_end', (data) => {
            this.duelOpponentId = null;
            this.game.onDuelEnd?.(data.winner);
        });
    }

    sendDuelInvite(name) {
        if (this.isConnected) this.socket.emit('duel_invite', name);
    }

    acceptDuel() {
        if (this.isConnected && this.pendingDuelFrom) {
            this.socket.emit('duel_accept', this.pendingDuelFrom);
            this.pendingDuelFrom = null;
        }
    }

    sendTradeInvite(name) {
        if (this.isConnected) this.socket.emit('trade_invite', name);
    }

    acceptTrade() {
        if (this.isConnected && this.pendingTradeFrom) {
            this.socket.emit('trade_accept', this.pendingTradeFrom);
            this.pendingTradeFrom = null;
        }
    }

    updateTradeOffer(offer) {
        if (this.isConnected && this.currentTradeId) {
            this.socket.emit('trade_update', { tradeId: this.currentTradeId, offer });
        }
    }

    lockTrade() {
        if (this.isConnected && this.currentTradeId) {
            this.socket.emit('trade_lock', { tradeId: this.currentTradeId });
        }
    }

    confirmTrade() {
        if (this.isConnected && this.currentTradeId) {
            this.socket.emit('trade_confirm', { tradeId: this.currentTradeId });
        }
    }
}
