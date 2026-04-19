const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Log de arranque inmediato
console.log('>>> Inicianzando Dark Realm Server en puerto:', PORT);

// 1. CORS CONFIGURATION (Muy permisivo para evitar bloqueos)
app.use(cors());

const server = http.createServer(app);

// 2. SOCKET.IO SETUP
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Health check para Railway (Vital)
app.get('/', (req, res) => res.status(200).send('SERVER_OK'));

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
    } else {
        currentHostId = null;
    }
}

io.on('connection', (socket) => {
    console.log(`+ Conectado: ${socket.id}`);

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
    socket.on('enemy_death', (id) => socket.broadcast.emit('enemy_death', id));
    socket.on('enemy_sync', (data) => socket.broadcast.emit('enemy_sync', data));

    socket.on('chat_message', (text) => {
        const p = players[socket.id];
        if (p && text) {
            io.emit('chat_message', {
                id: Date.now(),
                sender: p.name,
                text: text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });

    socket.on('whisper', (data) => {
        if (!data || !data.targetName) return;
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

    socket.on('trade_invite', (name) => {
        const tid = Object.keys(players).find(id => players[id].name === name);
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
        console.log(`- Desconectado: ${socket.id}`);
        delete players[socket.id];
        if (socket.id === currentHostId) electNewHost();
        io.emit('player_left', socket.id);
    });
});

// Captura de errores para estabilidad
process.on('uncaughtException', (err) => console.error('ERROR:', err));

// ESCUCHA EN 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
    console.log('>>> SERVER IS LIVE <<<');
});
