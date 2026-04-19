const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// Railway asigna el puerto automáticamente en process.env.PORT
const PORT = process.env.PORT || 3000;

console.log('>>> INICIANDO SERVIDOR MMO...');

app.use(cors());

// Health check mejorado con log
app.get('/', (req, res) => {
    console.log(`[HealthCheck] Petición recibida desde: ${req.ip}`);
    res.status(200).send('MMO_SERVER_OK');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// --- LÓGICA DE JUEGO MANTENIDA ---
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
    console.log(`[Socket] Nuevo jugador conectado: ${socket.id}`);

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

    socket.on('enemy_damaged', (data) => socket.broadcast.emit('enemy_damaged', data));
    socket.on('enemy_death', (id) => socket.broadcast.emit('enemy_death', id));
    socket.on('enemy_sync', (data) => socket.broadcast.emit('enemy_sync', data));

    socket.on('disconnect', () => {
        console.log(`[Socket] Jugador desconectado: ${socket.id}`);
        delete players[socket.id];
        if (socket.id === currentHostId) electNewHost();
        io.emit('player_left', socket.id);
    });
});

process.on('uncaughtException', (err) => console.error('CRITICAL:', err));

// ESCUCHA EN 0.0.0.0 (Obligatorio para Railway)
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> MMO SERVER LIVE EN PUERTO ${PORT} <<<`);
});
