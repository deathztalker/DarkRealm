const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Log inicial inmediato
console.log('>>> Inicianzando Dark Realm MMO Server (v2.0 Luxury) <<<');

// 1. CORS CONFIGURATION
app.use(cors());

const server = http.createServer(app);

// 2. SOCKET.IO CONFIGURATION
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// 3. HEALTH CHECK
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// --- GLOBAL STATE ---
const players = {}; 
const zoneHosts = {}; 
const activeTrades = {};

function sanitize(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]*>?/gm, '').trim().substring(0, 255);
}

function electNewHost(roomName) {
    const playersInRoom = Object.values(players).filter(p => p.roomName === roomName);
    if (playersInRoom.length > 0) {
        zoneHosts[roomName] = playersInRoom[0].id;
        io.to(zoneHosts[roomName]).emit('host_assignment', true);
    } else {
        delete zoneHosts[roomName];
    }
}

io.on('connection', (socket) => {
    console.log(`+ Player Connected: ${socket.id}`);

    socket.on('join_zone', (data) => {
        if (!data) return;
        const zoneLevel = data.zoneId || 0;
        const roomName = data.roomName || `zone_${zoneLevel}`;
        
        // Leave previous room
        if (players[socket.id] && players[socket.id].roomName) {
            const oldRoom = players[socket.id].roomName;
            socket.leave(oldRoom);
            socket.broadcast.to(oldRoom).emit('player_left', socket.id);
            if (zoneHosts[oldRoom] === socket.id) electNewHost(oldRoom);
        }

        socket.join(roomName);
        players[socket.id] = {
            id: socket.id,
            x: data.playerData?.x || 0,
            y: data.playerData?.y || 0,
            animState: 'idle',
            facingDir: 'down',
            classId: data.playerData?.classId,
            name: sanitize(data.playerData?.charName || 'Stranger').substring(0, 20),
            zoneLevel: zoneLevel,
            roomName: roomName
        };

        if (!zoneHosts[roomName]) electNewHost(roomName);

        // Sync room players
        const playersInRoom = Object.fromEntries(Object.entries(players).filter(([_, p]) => p.roomName === roomName));
        socket.emit('current_players', playersInRoom);
        socket.broadcast.to(roomName).emit('player_joined', players[socket.id]);
        console.log(`[MMO] Player ${players[socket.id].name} joined room: ${roomName}`);
    });

    socket.on('move', (data) => {
        const p = players[socket.id];
        if (data && p) {
            p.x = data.x; p.y = data.y;
            p.animState = data.animState; p.facingDir = data.facingDir;
            if (data.activeAura) p.activeAura = data.activeAura;
            socket.broadcast.to(p.roomName).emit('player_moved', p);
        }
    });

    // Host authority events
    socket.on('enemy_sync', (data) => {
        const p = players[socket.id];
        if (p && zoneHosts[p.roomName] === socket.id) socket.broadcast.to(p.roomName).emit('enemy_sync', data);
    });

    socket.on('npc_sync', (data) => {
        const p = players[socket.id];
        if (p && zoneHosts[p.roomName] === socket.id) socket.broadcast.to(p.roomName).emit('npc_sync', data);
    });

    socket.on('portal_spawn', (data) => {
        const p = players[socket.id];
        if (p && zoneHosts[p.roomName] === socket.id) socket.broadcast.to(p.roomName).emit('portal_spawn', data);
    });

    // Chat and Social
    socket.on('chat_message', (text) => {
        const p = players[socket.id];
        if (p && text) {
            const cleanText = sanitize(text).substring(0, 200);
            if (!cleanText) return;
            io.to(p.roomName).emit('chat_message', { id: Date.now(), sender: p.name, text: cleanText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        }
    });

    socket.on('system_message', (text) => {
        const cleanText = sanitize(text).substring(0, 500);
        if (!cleanText) return;
        io.emit('chat_message', { id: Date.now(), sender: 'System', text: cleanText, isSystem: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    });

    socket.on('whisper', (data) => {
        if (!data || !data.targetName || !data.text) return;
        const sender = players[socket.id];
        const targetId = Object.keys(players).find(id => players[id].name === data.targetName);
        if (sender && targetId) {
            const cleanText = sanitize(data.text).substring(0, 300);
            if (!cleanText) return;
            const whisper = { id: Date.now(), sender: sender.name, target: data.targetName, text: cleanText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            socket.emit('whisper', whisper);
            io.to(targetId).emit('whisper', whisper);
        }
    });

    socket.on('trade_invite', (name) => {
        const tid = Object.keys(players).find(id => players[id].name === name);
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

    socket.on('disconnect', () => {
        console.log(`- Player Disconnected: ${socket.id}`);
        const p = players[socket.id];
        if (p) {
            socket.broadcast.to(p.roomName).emit('player_left', socket.id);
            if (zoneHosts[p.roomName] === socket.id) electNewHost(p.roomName);
            delete players[socket.id];
        }
    });
});

process.on('uncaughtException', (err) => console.error('CRITICAL ERROR:', err));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> DARK REALM MMO SERVER LIVE ON PORT ${PORT} <<<`);
});
