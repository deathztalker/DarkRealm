const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS CONFIGURATION - FIXED: Explicit origins are required when credentials: true
const allowedOrigins = ["https://deathztalker.github.io", "http://localhost:3000", "http://127.0.0.1:3000"];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('github.io')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

const server = http.createServer(app);

// 2. SOCKET.IO CONFIGURATION
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// 3. HEALTH CHECK
app.get('/', (req, res) => {
    res.status(200).send('MMO Server is running and healthy!');
});

// --- GLOBAL STATE ---
const players = {};
const friends = {}; 
const activeTrades = {}; 
let currentHostId = null;

function electNewHost() {
    const ids = Object.keys(players);
    if (ids.length > 0) {
        currentHostId = ids[0];
        io.to(currentHostId).emit('host_assignment', true);
        console.log(`New Host elected: ${currentHostId}`);
    } else {
        currentHostId = null;
    }
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

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
        if (!currentHostId) electNewHost();
        socket.emit('current_players', players);
        socket.broadcast.emit('player_joined', players[socket.id]);
    });

    socket.on('move', (data) => {
        if (data && players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].animState = data.animState;
            players[socket.id].facingDir = data.facingDir;
            socket.broadcast.emit('player_moved', players[socket.id]);
        }
    });

    socket.on('enemy_damaged', (data) => socket.broadcast.emit('enemy_damaged', data));
    socket.on('enemy_death', (enemyId) => socket.broadcast.emit('enemy_death', enemyId));
    socket.on('enemy_sync', (enemies) => socket.broadcast.emit('enemy_sync', enemies));

    socket.on('chat_message', (text) => {
        const player = players[socket.id];
        if (player && text) {
            io.emit('chat_message', {
                id: Date.now(),
                sender: player.name,
                text: text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });

    socket.on('whisper', (data) => {
        if (!data) return;
        const sender = players[socket.id];
        const targetSocketId = Object.keys(players).find(id => players[id].name === data.targetName);
        if (sender && targetSocketId) {
            const whisper = {
                id: Date.now(),
                sender: sender.name,
                target: data.targetName,
                text: data.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            socket.emit('whisper', whisper);
            io.to(targetSocketId).emit('whisper', whisper);
        }
    });

    socket.on('trade_invite', (targetName) => {
        const tid = Object.keys(players).find(id => players[id].name === targetName);
        if (tid && tid !== socket.id) {
            io.to(tid).emit('trade_invite', { from: players[socket.id].name, fromId: socket.id });
        }
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
        console.log(`User disconnected: ${socket.id}`);
        delete players[socket.id];
        if (socket.id === currentHostId) electNewHost();
        io.emit('player_left', socket.id);
    });
});

// 4. ERROR HANDLING
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR:', err);
});

// 5. START SERVER - Explicitly bind to 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> MMO SERVER IS LIVE ON PORT ${PORT} <<<`);
});
