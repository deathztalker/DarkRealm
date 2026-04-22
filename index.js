const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('>>> SISTEMA INICIANDO - MODO MMO COMPLETO CON INSTANCIAMIENTO <<<');

// 1. CORS TOTAL
app.use(cors());

// 2. HEALTH CHECK INSTANTÁNEO
app.get('/', (req, res) => res.status(200).send('HEALTHY'));

const server = http.createServer(app);

// 3. SOCKET.IO CON TODO EL PODER
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ['websocket', 'polling']
});

// --- ESTADO GLOBAL ---
const players = {};
const friends = {};
const activeTrades = {}; 
const rooms = {}; // roomName -> { hostId }

function electNewHost(roomName) {
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room && room.size > 0) {
        const firstId = Array.from(room)[0];
        io.to(firstId).emit('host_assignment', true);
        if (!rooms[roomName]) rooms[roomName] = {};
        rooms[roomName].hostId = firstId;
        console.log(`[Host] Elected ${players[firstId]?.name || firstId} for room ${roomName}`);
    } else {
        delete rooms[roomName];
    }
}

io.on('connection', (socket) => {
    console.log(`[Socket] + ${socket.id}`);

    socket.on('join', (data) => {
        if (!data) return;
        players[socket.id] = {
            id: socket.id,
            x: data.x || 0,
            y: data.y || 0,
            animState: 'idle',
            facingDir: 'down',
            classId: data.classId,
            name: data.name || 'Stranger'
        };
        // Initial join defaults to global lobby or previous room logic
        // But join_zone will handle the actual instancing
    });

    socket.on('join_zone', (data) => {
        if (!data || !data.roomName) return;
        
        const oldRoom = players[socket.id]?.roomName;
        if (oldRoom) {
            socket.leave(oldRoom);
            if (rooms[oldRoom]?.hostId === socket.id) electNewHost(oldRoom);
        }

        socket.join(data.roomName);
        if (!players[socket.id]) {
            players[socket.id] = { id: socket.id };
        }
        players[socket.id].zoneId = data.zoneId;
        players[socket.id].roomName = data.roomName;
        players[socket.id].name = data.playerData?.charName || players[socket.id].name || 'Stranger';
        Object.assign(players[socket.id], data.playerData); // Sync full stats

        console.log(`[Zone] ${players[socket.id].name} joined layer: ${data.roomName}`);

        // Sync with others in the same room
        const roomPlayers = {};
        const room = io.sockets.adapter.rooms.get(data.roomName);
        if (room) {
            room.forEach(id => {
                if (id !== socket.id && players[id]) {
                    roomPlayers[id] = players[id];
                }
            });
        }
        
        socket.emit('current_players', roomPlayers);
        socket.to(data.roomName).emit('player_joined', players[socket.id]);

        // Host Election for this specific room
        if (!rooms[data.roomName] || !rooms[data.roomName].hostId) {
            electNewHost(data.roomName);
        } else {
            socket.emit('host_assignment', false);
        }
    });

    socket.on('move', (data) => {
        const p = players[socket.id];
        if (data && p) {
            Object.assign(p, data);
            if (p.roomName) {
                socket.to(p.roomName).emit('player_moved', p);
            } else {
                socket.broadcast.emit('player_moved', p);
            }
        }
    });

    // --- MMO ENHANCED SYNC: Skills & Minions ---
    socket.on('skill_use', (data) => {
        const p = players[socket.id];
        if (p && p.roomName) {
            socket.to(p.roomName).emit('player_skill', { id: socket.id, ...data });
        }
    });

    socket.on('minion_sync', (minions) => {
        const p = players[socket.id];
        if (p) {
            p.minions = minions;
            if (p.roomName) {
                socket.to(p.roomName).emit('player_minions_sync', { id: socket.id, minions });
            }
        }
    });

    socket.on('merc_sync', (mercData) => {
        const p = players[socket.id];
        if (p) {
            p.mercenary = mercData;
            if (p.roomName) {
                socket.to(p.roomName).emit('player_merc_sync', { id: socket.id, mercenary: mercData });
            }
        }
    });

    socket.on('enemy_sync', (data) => {
        const p = players[socket.id];
        if (p && p.roomName) {
            socket.to(p.roomName).emit('enemy_sync', data);
        }
    });

    socket.on('npc_sync', (data) => {
        const p = players[socket.id];
        if (p && p.roomName) {
            socket.to(p.roomName).emit('npc_sync', data);
        }
    });

    socket.on('object_interact', (data) => {
        const p = players[socket.id];
        if (p && p.roomName) {
            socket.to(p.roomName).emit('object_update', data);
        }
    });

    socket.on('projectile_fire', (data) => {
        const p = players[socket.id];
        if (p && p.roomName) {
            socket.to(p.roomName).emit('projectile_spawn', { ownerId: socket.id, ...data });
        }
    });

    socket.on('loot_spawn', (data) => {
        const p = players[socket.id];
        if (p && p.roomName) {
            socket.to(p.roomName).emit('loot_spawn', data);
        }
    });

    socket.on('loot_pickup', (lootId) => {
        const p = players[socket.id];
        if (p && p.roomName) {
            socket.to(p.roomName).emit('loot_pickup', lootId);
        }
    });

    socket.on('zone_theme_sync', (theme) => {
        const p = players[socket.id];
        if (p && p.roomName) {
            socket.to(p.roomName).emit('zone_theme_sync', theme);
        }
    });

    socket.on('chat_message', (text) => {
        const p = players[socket.id];
        if (p && text) {
            io.emit('chat_message', {
                id: Date.now(),
                sender: p.name,
                text: text,
                time: new Date().toLocaleTimeString()
            });
        }
    });

    socket.on('system_message', (text) => {
        io.emit('chat_message', { sender: 'System', text, isSystem: true });
    });

    socket.on('whisper', (data) => {
        if (!data) return;
        const sender = players[socket.id];
        const targetSocketId = Object.keys(players).find(id => players[id].name === data.targetName);
        if (sender && targetSocketId) {
            const whisper = { id: Date.now(), sender: sender.name, target: data.targetName, text: data.text, time: new Date().toLocaleTimeString() };
            socket.emit('whisper', whisper);
            io.to(targetSocketId).emit('whisper', whisper);
        }
    });

    socket.on('trade_invite', (targetName) => {
        const tid = Object.keys(players).find(id => players[id].name === targetName);
        if (tid && tid !== socket.id) io.to(tid).emit('trade_invite', { from: players[socket.id].name, fromId: socket.id });
    });

    socket.on('trade_accept', (fromId) => {
        if (!players[fromId] || !players[socket.id]) return;
        const ids = [socket.id, fromId].sort();
        const tradeId = `trade_${ids[0]}_${ids[1]}`;
        activeTrades[tradeId] = { p1: fromId, p2: socket.id, offer1: [], offer2: [], lock1: false, lock2: false, accept1: false, accept2: false };
        io.to(fromId).emit('trade_start', { tradeId, partner: players[socket.id].name });
        io.to(socket.id).emit('trade_start', { tradeId, partner: players[fromId].name });
    });

    socket.on('party_invite', (targetName) => {
        const targetId = Object.keys(players).find(id => players[id].name === targetName);
        if (targetId && targetId !== socket.id) {
            io.to(targetId).emit('party_invite', { 
                from: players[socket.id].name, 
                fromId: socket.id 
            });
        }
    });

    socket.on('party_accept', (fromId) => {
        if (players[fromId] && players[socket.id]) {
            const partyId = `party_${Date.now()}`;
            const partyData = {
                id: partyId,
                leaderId: fromId,
                members: [
                    { id: fromId, name: players[fromId].name },
                    { id: socket.id, name: players[socket.id].name }
                ]
            };
            io.to(fromId).emit('party_joined', partyData);
            io.to(socket.id).emit('party_joined', partyData);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] - Player disconnected: ${socket.id}`);
        const p = players[socket.id];
        if (p) {
            const roomName = p.roomName;
            io.emit('player_left', socket.id);
            delete players[socket.id];
            if (roomName && rooms[roomName]?.hostId === socket.id) {
                electNewHost(roomName);
            }
        }
    });
});

process.on('uncaughtException', (err) => console.error('CRITICAL:', err));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> MMO SERVER LIVE ON PORT ${PORT} <<<`);
});
