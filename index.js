const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// Prioridad absoluta al puerto de Railway (process.env.PORT)
const PORT = process.env.PORT || 3000;

console.log('>>> INICIANDO SERVIDOR MMO...');

app.use(cors());

// Health check instantáneo
app.get('/', (req, res) => {
    res.status(200).send('SERVER_ALIVE');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Lógica mínima para validar conexión
io.on('connection', (socket) => {
    console.log(`[Socket] Conectado: ${socket.id}`);
    
    socket.on('join', (data) => {
        socket.emit('current_players', {});
        socket.broadcast.emit('player_joined', { id: socket.id, name: data?.name });
    });

    socket.on('move', (data) => {
        socket.broadcast.emit('player_moved', { id: socket.id, ...data });
    });

    socket.on('chat_message', (text) => {
        io.emit('chat_message', { sender: 'Player', text, time: new Date().toLocaleTimeString() });
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Desconectado: ${socket.id}`);
    });
});

// Captura de errores para evitar cierres inesperados
process.on('uncaughtException', (err) => console.error('CRITICAL:', err));
process.on('unhandledRejection', (reason, promise) => console.error('REJECTION:', reason));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> MMO SERVER LIVE EN PUERTO ${PORT} <<<`);
});
