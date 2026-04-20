const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// Railway inyecta el puerto en process.env.PORT. Si no existe, usamos 3000.
const PORT = process.env.PORT || 3000;

console.log(`>>> ARRANCANDO DARK REALM SERVER...`);

app.use(cors());

// Health check en / (como configuraste en Railway)
app.get('/', (req, res) => {
    console.log('[Railway] Health Check recibido');
    res.status(200).send('SERVER_IS_HEALTHY');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ['websocket', 'polling']
});

// Lógica MMO Restaurada
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
    console.log(`[Socket] + ${socket.id}`);
    socket.on('join', (data) => {
        if (!data) return;
        players[socket.id] = { id: socket.id, ...data, animState: 'idle', facingDir: 'down' };
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
    socket.on('disconnect', () => {
        console.log(`[Socket] - ${socket.id}`);
        delete players[socket.id];
        if (socket.id === currentHostId) electNewHost();
        io.emit('player_left', socket.id);
    });
});

process.on('uncaughtException', (err) => console.error('ERROR:', err));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> SERVIDOR ACTIVO EN PUERTO ${PORT} <<<`);
});
