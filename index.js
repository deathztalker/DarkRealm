const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Log de arranque para debug en Railway
console.log('>>> SYSTEM STARTING...');

// Middleware de CORS
app.use(cors());

// Health check para Railway
app.get('/', (req, res) => {
    res.status(200).send('SERVER_OK');
});

const server = http.createServer(app);

// Socket.io con configuración de producción
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// --- ESTADO DEL JUEGO (VOLÁTIL) ---
const players = {};
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
    console.log(`+ Player: ${socket.id}`);

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
            Object.assign(players[socket.id], data);
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

    socket.on('disconnect', () => {
        console.log(`- Player: ${socket.id}`);
        delete players[socket.id];
        if (socket.id === currentHostId) electNewHost();
        io.emit('player_left', socket.id);
    });
});

process.on('uncaughtException', (err) => console.error('CRITICAL:', err));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> MMO SERVER LIVE ON PORT ${PORT} <<<`);
});
