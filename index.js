const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('>>> SISTEMA INICIANDO - MODO MMO COMPLETO <<<');

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

    // --- MMO ENHANCED SYNC: Skills & Minions ---
    socket.on('skill_use', (data) => {
        // Broadcasst skill action to other players
        socket.broadcast.emit('player_skill', { id: socket.id, ...data });
    });

    socket.on('minion_sync', (minions) => {
        if (players[socket.id]) {
            players[socket.id].minions = minions;
            socket.broadcast.emit('player_minions_sync', { id: socket.id, minions });
        }
    });

    socket.on('merc_sync', (mercData) => {
        if (players[socket.id]) {
            players[socket.id].mercenary = mercData;
            socket.broadcast.emit('player_merc_sync', { id: socket.id, mercenary: mercData });
        }
    });

    socket.on('enemy_sync', (data) => socket.broadcast.emit('enemy_sync', data));
    socket.on('npc_sync', (data) => socket.broadcast.emit('npc_sync', data));

    // --- MMO TOTAL SYNC: Objects, Projectiles & Loot ---
    socket.on('object_interact', (data) => {
        socket.broadcast.emit('object_update', data);
    });

    socket.on('projectile_fire', (data) => {
        socket.broadcast.emit('projectile_spawn', { ownerId: socket.id, ...data });
    });

    socket.on('loot_spawn', (data) => {
        socket.broadcast.emit('loot_spawn', data);
    });

    socket.on('loot_pickup', (lootId) => {
        socket.broadcast.emit('loot_pickup', lootId);
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

    // --- SISTEMA DE COMERCIO (RESTAURADO) ---
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

    socket.on('disconnect', () => {
        console.log(`[Socket] - Jugador desconectado: ${socket.id}`);
        
        // Broadcast a todos que el jugador se fue ANTES de borrarlo
        io.emit('player_left', socket.id);
        
        // Limpiar de todos los mapas globales
        if (players[socket.id]) {
            console.log(`[MMO] Limpiando estado del jugador: ${players[socket.id].name}`);
            delete players[socket.id];
        }
        
        if (socket.id === currentHostId) {
            console.log('[MMO] El Host se ha ido, eligiendo nuevo Host...');
            electNewHost();
        }
    });
});

process.on('uncaughtException', (err) => console.error('CRITICAL:', err));

// ESCUCHA SIN RESTRICCIONES (Railway gestiona la IP)
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> MMO SERVER LIVE ON PORT ${PORT} <<<`);
});
