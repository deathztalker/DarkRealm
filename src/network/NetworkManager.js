import { DB } from '../systems/db.js';
import { bus } from '../engine/EventBus.js';

/**
 * NetworkManager — Handles WebSocket communication, state sync, and relay events.
 */
export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.otherPlayers = new Map(); // playerID -> { x, y, animState, facingDir, classId, charName }
        this.isConnected = false;
        this.isHost = false; 
        this.chatSubscription = null;
        this.currentParty = null; 
        this.pendingZoneJoin = null;
        this.partyStateLoaded = false;
        this.initEvents();
    }

    initEvents() {
        bus.on('combat:spawnProjectile', ({ proj }) => {
            if (this.isConnected) {
                this.socket.emit('projectile_fire', {
                    x: proj.x, y: proj.y,
                    targetX: proj.targetX, targetY: proj.targetY,
                    type: proj.type, speed: proj.speed,
                    icon: proj.icon, skillId: proj.skillId
                });
            }
        });

        bus.on('combat:spawnAoE', ({ aoe }) => {
            if (this.isConnected) {
                this.socket.emit('skill_use', {
                    skillId: aoe.skillId, x: aoe.x, y: aoe.y,
                    type: aoe.type, radius: aoe.radius
                });
            }
        });
    }

    async init() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const serverUrl = isLocal ? 'ws://localhost:8080' : 'wss://darkrealm-production.up.railway.app';

        console.log(`[Network] Connecting to game server at: ${serverUrl}`);
        this.setupWebSocket(serverUrl);

        if (DB.isLoggedIn()) {
            this.chatSubscription = DB.subscribeToChat((payload) => {
                this.handleIncomingDbMessage(payload);
            });

            try {
                const { data: recent } = await DB.client
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
            this.setupPartyRealtime();
            await this.refreshPartyState();
        }
    }

    setupWebSocket(url) {
        const charName = this.game.player?.charName || 'guest';
        this.socket = {
            listeners: {},
            on: (event, callback) => { this.socket.listeners[event] = callback; },
            emit: (event, payload) => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ 
                        type: event, 
                        player_id: charName, 
                        payload, 
                        ts: Date.now() 
                    }));
                }
            },
            id: charName 
        };

        this.setupSocketHandlers();
        this.connectWS(url);
    }

    connectWS(url) {
        const charName = this.game.player?.charName || 'guest';
        const fullUrl = `${url}/ws/${encodeURIComponent(charName)}/${window.zoneLevel || 0}`;
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = async () => {
            console.log('[Network] Connected to game server.');
            
            if (DB.isLoggedIn() && !this.partyStateLoaded) {
                await this.refreshPartyState();
            }

            this.isConnected = true;
            this.startPingLoop();
            if (this.socket.listeners['connect']) this.socket.listeners['connect']();
            if (this.pendingZoneJoin) {
                this.joinZone(this.pendingZoneJoin.zoneId);
                this.pendingZoneJoin = null;
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type !== 'player_moved' && data.type !== 'enemy_sync') {
                    console.log(`[Network Incoming] Type: ${data.type}`, data.payload || data);
                }
                const handler = this.socket.listeners[data.type];
                if (handler) handler(data.payload || data);
                else if (data.type !== 'player_moved' && data.type !== 'enemy_sync') {
                    console.warn(`[Network] No handler for event type: ${data.type}`);
                }
            } catch (e) {
                console.error('[Network] WS parse error:', e);
            }
        };

        this.ws.onclose = () => {
            console.warn('[Network] WS disconnected. Reconnecting in 3s...');
            this.isConnected = false;
            this.otherPlayers.clear();
            setTimeout(() => this.connectWS(url), 3000);
        };
    }

    setupSocketHandlers() {
        this.socket.on('current_players', (players) => {
            console.log('[Network] Received current_players list:', players);
            for (const id in players) {
                if (id !== this.socket.id) {
                    const pData = players[id];
                    const charName = pData.charName || pData.name || id;
                    console.log(`[Network] Registered existing player: ${charName} (ID: ${id}) at (${pData.x}, ${pData.y})`);
                    this.otherPlayers.set(id, { ...pData, charName });
                }
            }
            if (this.otherPlayers.size === 0) {
                this.isHost = true;
                console.log('[Network] Zone is empty. You are the Zone Host.');
            }
        });

        this.socket.on('player_joined', (player) => {
            const charName = player.charName || player.name || player.id || 'Other Player';
            const pID = player.id || charName;
            console.log(`[Network] Player entered: ${charName} (ID: ${pID}) Coords: (${player.x}, ${player.y})`);
            player.charName = charName;
            this.otherPlayers.set(pID, player);
            this.game.onChatMessage?.({ sender: 'System', text: `${charName} has entered the realm.`, isSystem: true });
        });

        this.socket.on('portal_spawn', (data) => {
            const existing = this.game.gameObjects?.find(o => o.id === data.id);
            if (!existing) {
                const tp = new this.game.GameObjectClass('portal', data.x, data.y, 'obj_portal', data.id);
                tp.targetZone = data.targetZone;
                tp.name = data.name || 'Town Portal';
                this.game.gameObjects?.push(tp);
                if (window.fx) window.fx.emitBurst(tp.x, tp.y, '#30ccff', 40, 3);
            }
        });

        this.socket.on('party_invite', (data) => {
            const myName = this.game.player?.charName || 'guest';
            if (data && data.to === myName) {
                window.addSocialRequest?.(data.fromId, data.from, 'party');
                this.game.onChatMessage?.({
                    sender: 'System', text: `${data.from} has invited you to a party!`,
                    time: new Date().toLocaleTimeString(), isSystem: true
                });
            }
        });

        this.socket.on('party_accept', (data) => {
            const myName = this.game.player?.charName || 'guest';
            if (data && data.to === myName) {
                const partyId = `party_${Date.now()}`;
                const partyData = {
                    id: partyId,
                    leaderId: myName,
                    members: [
                        { id: myName, name: myName },
                        { id: data.fromId, name: data.from }
                    ]
                };
                this.currentParty = partyData;
                window.addCombatLog?.(`${data.from} joined your party!`, 'log-info');
            }
        });

        this.socket.on('trade_invite', (data) => {
            const myName = this.game.player?.charName || 'guest';
            if (data && data.to === myName) {
                window.addSocialRequest?.(data.fromId, data.from, 'trade');
                this.game.onChatMessage?.({
                    sender: 'System', text: `${data.from} has invited you to trade!`,
                    time: new Date().toLocaleTimeString(), isSystem: true
                });
            }
        });

        this.socket.on('trade_accept', (data) => {
            const myName = this.game.player?.charName || 'guest';
            if (data && data.to === myName) {
                const tradeId = `trade_${data.fromId}_${myName}`;
                this.game.onTradeStart?.({ tradeId, partner: data.from });
                window.addCombatLog?.(`${data.from} accepted trade!`, 'log-info');
            }
        });

        this.socket.on('party_joined', (party) => {
            this.currentParty = party;
            window.addCombatLog?.(`Joined party led by ${party.members.find(m => m.id === party.leaderId)?.name || 'Leader'}`, 'log-info');
            window.updatePartyHUD?.(party.members);
        });

        this.socket.on('party_left', () => {
            this.currentParty = null;
            window.updatePartyHUD?.([]);
        });

        this.socket.on('player_moved', (data) => {
            const pID = data.id || data.player_id || data.charName;
            const player = this.otherPlayers.get(pID);
            if (player) {
                Object.assign(player, data);
                player.charName = data.charName || data.name || player.charName;

                if (this.currentParty && this.currentParty.members.some(m => m.id === pID)) {
                    const member = this.currentParty.members.find(m => m.id === pID);
                    member.x = data.x; member.y = data.y;
                    window.updatePartyHUD?.(this.currentParty.members);
                }
            } else {
                const charName = data.charName || data.name || pID;
                this.otherPlayers.set(pID, { ...data, charName });
            }
        });

        this.socket.on('player_skill', (data) => {
            const player = this.otherPlayers.get(data.id);
            if (player) {
                window.fx?.triggerSkillEffect?.(data.skillId, data.x, data.y, data.targetX, data.targetY);
            }
        });

        this.socket.on('player_left', (id) => {
            console.log(`[Network] Player left: ${id}`);
            this.otherPlayers.delete(id);
        });

        this.socket.on('host_assignment', (status) => {
            this.isHost = status;
            console.log('[Network] Host Assignment:', status ? 'ZONE HOST' : 'GUEST');
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
                        enemy.x = ed.x; enemy.y = ed.y;
                        enemy.hp = ed.hp; enemy.animState = ed.anim;
                        enemy.facingDir = ed.dir;
                    }
                });
            }
        });

        this.socket.on('npc_sync', (data) => {
            if (!this.isHost) {
                data.forEach(nd => {
                    const npc = this.game.npcs?.find(n => n.id === nd.id);
                    if (npc) { npc.x = nd.x; npc.y = nd.y; }
                });
            }
        });

        this.socket.on('object_update', (data) => {
            const obj = this.game.gameObjects?.find(o => o.id === data.id);
            if (obj) {
                obj.isOpen = data.isOpen;
                if (obj.isOpen) obj.icon = (obj.type === 'shrine') ? 'obj_shrine_used' : 'obj_chest_open';
            }
        });

        this.socket.on('projectile_spawn', (data) => {
            if (this.game.spawnRemoteProjectile) this.game.spawnRemoteProjectile(data);
        });

        this.socket.on('loot_spawn', (data) => {
            if (this.game.onRemoteLootSpawn) this.game.onRemoteLootSpawn(data);
        });

        this.socket.on('loot_pickup', (lootId) => {
            if (this.game.onRemoteLootPickup) this.game.onRemoteLootPickup(lootId);
        });

        this.socket.on('gold_spawn', (data) => {
            if (this.game.onGoldSpawn) this.game.onGoldSpawn(data);
        });

        this.socket.on('gold_pickup', (goldId) => {
            if (this.game.onGoldPickup) this.game.onGoldPickup(goldId);
        });

        this.socket.on('merc_sync', (data) => {
            const pID = data.player_id || data.id;
            const player = this.otherPlayers.get(pID);
            if (player) player.mercenary = data;
        });

        this.socket.on('minion_sync', (data) => {
            const pID = data.player_id || data.id;
            const player = this.otherPlayers.get(pID);
            if (player) player.minions = data.minions || data;
        });

        this.socket.on('dungeon_init', (data) => {
            console.log(`[Network] Dungeon Init Request: Seed=${data.seed}`);
            if (this.onDungeonInit) this.onDungeonInit(data.seed);
            else if (this.game.onDungeonInit) this.game.onDungeonInit(data.seed);
            window._currentZoneSeed = data.seed;
        });

        this.socket.on('chat_message', (msg) => {
            console.log('[Network] Socket chat:', msg);
            // Filter out our own messages
            if (msg.sender === this.socket.id || msg.sender === this.game.player?.charName) return;
            
            this.game.onChatMessage?.({
                sender: msg.sender || 'Stranger',
                text: msg.text || msg.content || '',
                time: msg.time || new Date().toLocaleTimeString()
            });
        });

        this.socket.on('whisper', (msg) => {
            this.game.onChatMessage?.({
                sender: msg.sender || 'Stranger',
                text: msg.text || msg.content || '',
                time: msg.time || new Date().toLocaleTimeString(),
                isWhisper: true
            });
        });

        this.socket.on('system_message', (text) => {
            this.game.onChatMessage?.({
                sender: 'System', text: text,
                time: new Date().toLocaleTimeString(), isSystem: true
            });
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.otherPlayers.clear();
        });
    }

    setupPartyRealtime() {
        const channelName = 'party_' + Math.random().toString(36).substring(7);
        DB.client.getChannels().forEach(c => { if (c.name?.includes('party')) DB.client.removeChannel(c); });
        const channel = DB.client.channel(channelName);
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'party_members' }, async (payload) => {
            const userId = DB.session?.user.id;
            if (payload.new.user_id === userId || (payload.old && payload.old.user_id === userId)) {
                await this.refreshPartyState();
            }
        });
        channel.subscribe();
    }

    async refreshPartyState() {
        const userId = DB.session?.user?.id;
        if (!userId) {
            this.partyStateLoaded = true;
            return;
        }
        
        const { data: memberRecord } = await DB.client
            .from('party_members').select('party_id').eq('user_id', userId).maybeSingle();

        if (memberRecord) {
            const { data: party } = await DB.client
                .from('parties').select('*, party_members(user_id)').eq('id', memberRecord.party_id).single();
            this.currentParty = party;
            this.currentParty.members = party.party_members.map(m => ({
                id: m.user_id,
                name: m.user_id === userId ? this.game.player.charName : 'Party Member',
                hp: 100, maxHp: 100, mp: 80, maxMp: 80
            }));
        } else {
            this.currentParty = null;
        }
        this.partyStateLoaded = true;
        window.updatePartyHUD?.(this.currentParty?.members || []);
    }

    async handleIncomingDbMessage(msg, isHistory = false) {
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const myId = DB.session?.user.id;
        const isMe = msg.sender_id === myId;
        let senderName = msg.sender_name;
        if (!senderName || senderName === 'Me' || senderName === 'Other Player') {
            senderName = isMe ? (this.game.player?.charName || 'Me') : (msg.sender_name || 'Stranger');
        }
        if (msg.is_whisper) {
            if (isMe || msg.receiver_id === myId) {
                this.game.onWhisper?.({ sender: senderName, target: msg.receiver_name || 'Recipient', text: msg.content, time: time });
            }
        } else {
            this.game.onChatMessage?.({ sender: senderName, text: msg.content, time: time });
        }
    }

    sendMovement(x, y, animState, facingDir) {
        if (this.isConnected && this.game.player) {
            const p = this.game.player;
            this.socket.emit('move', {
                x, y, animState, facingDir,
                hp: p.hp, maxHp: p.maxHp,
                mp: p.mp, maxMp: p.maxMp,
                activeAura: p.activeAura
            });
        }
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
        if (target) await DB.sendMessage(text, target.user_id, true);
        else this.game.onChatMessage?.({ sender: 'System', text: `Player "${targetName}" not found.`, time: new Date().toLocaleTimeString(), isSystem: true });
    }

    async addFriend(name) {
        const target = await DB.findUserByName(name);
        if (target) {
            await DB.addFriend(target.user_id);
            this.game.onChatMessage?.({ sender: 'System', text: `Friend request sent to ${name}.`, time: new Date().toLocaleTimeString(), isSystem: true });
        }
    }

    async sendPartyInvite(name) {
        if (this.isConnected) {
            const myName = this.game.player?.charName || 'guest';
            this.socket.emit('party_invite', { from: myName, fromId: myName, to: name });
            this.game.onChatMessage?.({ sender: 'System', text: `Invited ${name} to party.`, time: new Date().toLocaleTimeString(), isSystem: true });
        }
    }

    acceptPartyInvite(fromId, fromName) {
        if (this.isConnected) {
            const myName = this.game.player?.charName || 'guest';
            this.socket.emit('party_accept', { from: myName, fromId: myName, to: fromId, toName: fromName });
            window.addCombatLog?.('Accepted party invite', 'log-info');
            
            this.currentParty = {
                id: `party_${Date.now()}`,
                leaderId: fromId,
                members: [
                    { id: fromId, name: fromName },
                    { id: myName, name: myName }
                ]
            };
        }
    }

    async inspectPlayer(name) {
        const data = await DB.findUserByName(name);
        if (data && data.player) this.game.onInspectData?.(data.player);
        else this.game.onChatMessage?.({ sender: 'System', text: `Player "${name}" not found.`, time: new Date().toLocaleTimeString(), isSystem: true });
    }

    sendDuelInvite(name) { if (this.isConnected) this.socket.emit('duel_invite', name); }
    acceptDuel() { if (this.isConnected && this.pendingDuelFrom) { this.socket.emit('duel_accept', this.pendingDuelFrom); this.pendingDuelFrom = null; } }
    sendTradeInvite(name) {
        if (this.isConnected) {
            const myName = this.game.player?.charName || 'guest';
            this.socket.emit('trade_invite', { from: myName, fromId: myName, to: name });
            this.game.onChatMessage?.({ sender: 'System', text: `Trade invite sent to ${name}.`, time: new Date().toLocaleTimeString(), isSystem: true });
        }
    }

    acceptTrade(fromId, fromName) {
        if (this.isConnected) {
            const myName = this.game.player?.charName || 'guest';
            this.socket.emit('trade_accept', { from: myName, fromId: myName, to: fromId, toName: fromName });
            const tradeId = `trade_${fromId}_${myName}`;
            this.game.onTradeStart?.({ tradeId, partner: fromName });
        }
    }

    startPingLoop() {
        if (!this.socket) return;
        this.socket.on('pong', (startTime) => {
            const latency = Math.round(performance.now() - startTime);
            this.updatePingUI(latency);
        });
        setInterval(() => {
            if (this.isConnected) this.socket.emit('ping', performance.now());
            else this.updatePingUI(null);
        }, 5000);
    }

    updatePingUI(latency) {
        const pingDot = document.getElementById('ping-dot'), pingVal = document.getElementById('ping-value');
        if (!pingDot || !pingVal) return;
        if (latency === null) { pingDot.style.backgroundColor = '#666'; pingVal.textContent = 'Offline'; return; }
        pingVal.textContent = `${latency}ms`;
        if (latency < 100) pingDot.style.backgroundColor = '#4caf50';
        else if (latency < 250) pingDot.style.backgroundColor = '#ffc107';
        else pingDot.style.backgroundColor = '#f44336';
    }

    async getLeaderboardData(filter = 'global') {
        try {
            let query = DB.client.from('saves')
                .select(`charName:player->>charName, classId:player->>classId, isHardcore:player->>isHardcore, extra_data`)
                .order('extra_data->riftLevel', { ascending: false }).limit(20);
            if (filter === 'class' && this.game.player) query = query.eq('player->>classId', this.game.player.classId);
            if (filter === 'hardcore') query = query.eq('player->>isHardcore', 'true');
            const { data, error } = await query;
            if (error) throw error;
            return data.map(row => ({ charName: row.charName, classId: row.classId, isHardcore: row.isHardcore === 'true' || row.isHardcore === true, campaign: row.extra_data?.campaign || null, extra_data: row.extra_data }));
        } catch (e) { console.error("Leaderboard Query Error:", e); return []; }
    }

    broadcastLootSpawn(item) {
        if (this.isConnected && this.isHost) {
            this.socket.emit('loot_spawn', { id: item.id, baseId: item.baseId, name: item.name, rarity: item.rarity, icon: item.icon, x: item.x, y: item.y });
        }
    }

    broadcastLootPickup(lootId) { if (this.isConnected) this.socket.emit('loot_pickup', lootId); }
    broadcastGoldSpawn(gold) {
        if (this.isConnected && this.isHost) {
            this.socket.emit('gold_spawn', { id: gold.id || `gold_${Date.now()}_${Math.random()}`, x: gold.x, y: gold.y, amount: gold.amount });
        }
    }
    broadcastGoldPickup(goldId) { if (this.isConnected) this.socket.emit('gold_pickup', goldId); }

    joinZone(zoneId) {
        if (!this.isConnected) { console.log(`[Network] Delaying join for zone ${zoneId} until connected.`); this.pendingZoneJoin = { zoneId }; return; }
        if (!this.game.player) return;
        const modePrefix = this.game.player.isHardcore ? 'hc_' : 'std_';
        let roomName = `${modePrefix}zone_${zoneId}`;
        if (this.currentParty && zoneId !== 0) roomName = `${modePrefix}party_${this.currentParty.id}_zone_${zoneId}`;
        let seed = 12345;
        if (zoneId !== 0) {
            if (this.currentParty) {
                let hash = 0; const pid = String(this.currentParty.id);
                for (let i = 0; i < pid.length; i++) { hash = ((hash << 5) - hash) + pid.charCodeAt(i); hash |= 0; }
                seed = Math.abs(hash + zoneId) % 1000000;
            } else {
                const nameHash = this.game.player.charName.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
                seed = Math.abs(nameHash + zoneId) % 1000000;
            }
        }
        console.log(`[Network] Joining Layer: ${roomName} | Seed: ${seed}`);
        this.otherPlayers.clear(); this.isHost = false;
        this.socket.emit('join_zone', { zoneId, roomName, seed, playerData: this.game.player.serialize() });
    }
}
