import { DB } from '../systems/db.js';
import { bus } from '../engine/EventBus.js';

export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.otherPlayers = new Map();
        this.isConnected = false;
        this.isHost = false;
        this.chatSubscription = null;
        this.currentParty = null;
        this.pendingZoneJoin = null;
        
        this.lastMoveSent = 0;
        this.moveThrottleMs = 50; 
    }

    init() {
        if (typeof io === 'undefined') {
            console.error('Socket.io not found. Multiplayer disabled.');
            return;
        }

        const serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : `https://${window.location.hostname}`;
            
        this.socket = io(serverUrl, {
            reconnectionAttempts: 5,
            timeout: 10000
        });

        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('[MMO] Connected to Server:', this.socket.id);
            if (this.pendingZoneJoin) {
                this.joinZone(this.pendingZoneJoin.zoneId);
            }
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.isHost = false;
            console.warn('[MMO] Disconnected from server');
        });

        this.socket.on('current_players', (players) => {
            for (const id in players) {
                if (id !== this.socket.id) {
                    const pData = players[id];
                    this.otherPlayers.set(id, {
                        ...pData,
                        charName: pData.name || 'Other Player',
                        targetX: pData.x || pData.targetX,
                        targetY: pData.y || pData.targetY
                    });
                }
            }
            if (this.otherPlayers.size === 0) {
                this.isHost = true;
                console.log('No other players. You are now the Zone Host.');
            }
        });

        this.socket.on('player_joined', (data) => {
            if (data.id !== this.socket.id) {
                this.otherPlayers.set(data.id, {
                    ...data,
                    charName: data.name || 'Other Player',
                    targetX: data.x,
                    targetY: data.y
                });
            }
        });

        this.socket.on('player_moved', (data) => {
            const player = this.otherPlayers.get(data.id);
            if (player) {
                player.targetX = data.x;
                player.targetY = data.y;
                player.animState = data.animState;
                player.facingDir = data.facingDir;
                if (data.activeAura) player.activeAura = data.activeAura;
                if (data.name) player.charName = data.name;
                if (player.x === undefined) { player.x = data.x; player.y = data.y; }

                if (this.currentParty && this.currentParty.members.some(m => m.id === player.id)) {
                    const member = this.currentParty.members.find(m => m.id === player.id);
                    member.x = data.x; member.y = data.y;
                    window.updatePartyHUD?.(this.currentParty.members);
                }
            }
        });

        this.socket.on('player_left', (id) => {
            this.otherPlayers.delete(id);
        });

        this.socket.on('host_assignment', (status) => {
            this.isHost = status;
            console.log('Host Assignment:', status ? 'You are now the Zone Host' : 'You are a Guest');
        });

        this.socket.on('enemy_sync', (data) => {
            if (!this.isHost) {
                data.forEach(ed => {
                    const enemy = this.game.enemies?.find(e => e.syncId === ed.id);
                    if (enemy) {
                        enemy.targetX = ed.x;
                        enemy.targetY = ed.y;
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
                    if (npc) { npc.targetX = nd.x; npc.targetY = nd.y; }
                });
            }
        });
    }

    update(dt) {
        if (!this.isConnected) return;
        const LERP_SPEED = 10;
        this.otherPlayers.forEach(p => {
            if (p.targetX !== undefined && p.x !== undefined) {
                p.x += (p.targetX - p.x) * LERP_SPEED * dt;
                p.y += (p.targetY - p.y) * LERP_SPEED * dt;
            }
        });
        if (!this.isHost) {
            if (this.game.enemies) {
                this.game.enemies.forEach(e => {
                    if (e.targetX !== undefined) {
                        e.x += (e.targetX - e.x) * LERP_SPEED * dt;
                        e.y += (e.targetY - e.y) * LERP_SPEED * dt;
                    }
                });
            }
            if (this.game.npcs) {
                this.game.npcs.forEach(n => {
                    if (n.targetX !== undefined) {
                        n.x += (n.targetX - n.x) * LERP_SPEED * dt;
                        n.y += (n.targetY - n.y) * LERP_SPEED * dt;
                    }
                });
            }
        }
    }

    sendMovement(x, y, animState, facingDir) {
        if (!this.isConnected || !this.game.player) return;
        const now = performance.now();
        if (now - this.lastMoveSent < this.moveThrottleMs) return;
        this.lastMoveSent = now;
        const p = this.game.player;
        this.socket.emit('move', {
            x, y, animState, facingDir,
            hp: p.hp, maxHp: p.maxHp,
            mp: p.mp, maxMp: p.maxMp,
            activeAura: p.activeAura,
            level: p.level
        });
    }

    joinZone(zoneId) {
        this.otherPlayers.clear();
        this.isHost = false;
        if (!this.isConnected) {
            this.pendingZoneJoin = { zoneId };
            return;
        }
        const roomName = (this.currentParty) ? `party_${this.currentParty.id}_zone_${zoneId}` : `zone_${zoneId}`;
        const seed = Math.floor(Math.random() * 999999);
        this.socket.emit('join_zone', {
            zoneId,
            roomName,
            seed,
            playerData: this.game.player.serialize()
        });
        window._currentZoneSeed = seed;
    }
}
