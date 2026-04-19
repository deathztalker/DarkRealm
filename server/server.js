const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Express and Socket.io
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Health check route
app.get('/', (req, res) => {
    res.send('MMO Server is running and healthy!');
});

// --- GLOBAL STATE (Volatile) ---
const players = {};
const friends = {}; // socketId -> Set(names)
const activeTrades = {}; // tradeId -> tradeData
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

    // Join Game
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

        // Tell the new player about existing players
        socket.emit('current_players', players);
        
        // Tell others about the new player
        socket.broadcast.emit('player_joined', players[socket.id]);
    });

    // Movement Relay
    socket.on('move', (data) => {
        if (data && players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].animState = data.animState;
            players[socket.id].facingDir = data.facingDir;
            
            // Broadcast to everyone else
            socket.broadcast.emit('player_moved', players[socket.id]);
        }
    });

    // Combat Relay
    socket.on('enemy_damaged', (data) => socket.broadcast.emit('enemy_damaged', data));
    socket.on('enemy_death', (enemyId) => socket.broadcast.emit('enemy_death', enemyId));
    socket.on('enemy_sync', (enemies) => socket.broadcast.emit('enemy_sync', enemies));

    // Chat System
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

    // Whisper System
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
        } else {
            socket.emit('system_message', `Player "${data.targetName}" not found or offline.`);
        }
    });

    // Friends System
    socket.on('add_friend', (name) => {
        if (!name) return;
        if (!friends[socket.id]) friends[socket.id] = new Set();
        friends[socket.id].add(name);
        socket.emit('system_message', `${name} added to friends.`);
        socket.emit('friends_list', Array.from(friends[socket.id]));
    });

    // --- Trade System ---
    socket.on('trade_invite', (targetName) => {
        const tid = Object.keys(players).find(id => players[id].name === targetName);
        if (tid && tid !== socket.id) {
            io.to(tid).emit('trade_invite', { from: players[socket.id].name, fromId: socket.id });
        }
    });

    socket.on('trade_accept', (fromId) => {
        if (!players[fromId] || !players[socket.id]) return;
        
        // Correct way to generate unique ID for two strings
        const ids = [socket.id, fromId].sort();
        const tradeId = `trade_${ids[0]}_${ids[1]}`;

        activeTrades[tradeId] = {
            p1: fromId, p2: socket.id,
            offer1: [], offer2: [],
            lock1: false, lock2: false,
            accept1: false, accept2: false
        };
        io.to(fromId).emit('trade_start', { tradeId, partner: players[socket.id].name });
        io.to(socket.id).emit('trade_start', { tradeId, partner: players[fromId].name });
    });

    socket.on('trade_update', (data) => {
        if (!data || !data.tradeId) return;
        const trade = activeTrades[data.tradeId];
        if (!trade) return;

        const isP1 = socket.id === trade.p1;
        if (isP1) { trade.offer1 = data.offer; } else { trade.offer2 = data.offer; }
        
        // Reset locks and accepts on update
        trade.lock1 = trade.lock2 = trade.accept1 = trade.accept2 = false;
        
        const partnerId = isP1 ? trade.p2 : trade.p1;
        io.to(partnerId).emit('trade_update', { offer: data.offer });
        io.to(trade.p1).emit('trade_status', { lock1: trade.lock1, lock2: trade.lock2 });
        io.to(trade.p2).emit('trade_status', { lock1: trade.lock1, lock2: trade.lock2 });
    });

    socket.on('trade_lock', (data) => {
        if (!data || !data.tradeId) return;
        const trade = activeTrades[data.tradeId];
        if (!trade) return;

        if (socket.id === trade.p1) trade.lock1 = true; else trade.lock2 = true;
        
        io.to(trade.p1).emit('trade_status', { lock1: trade.lock1, lock2: trade.lock2 });
        io.to(trade.p2).emit('trade_status', { lock1: trade.lock1, lock2: trade.lock2 });
    });

    socket.on('trade_confirm', (data) => {
        if (!data || !data.tradeId) return;
        const trade = activeTrades[data.tradeId];
        if (!trade || !trade.lock1 || !trade.lock2) return;

        if (socket.id === trade.p1) trade.accept1 = true; else trade.accept2 = true;

        if (trade.accept1 && trade.accept2) {
            io.to(trade.p1).emit('trade_execute', { receive: trade.offer2, give: trade.offer1 });
            io.to(trade.p2).emit('trade_execute', { receive: trade.offer1, give: trade.offer2 });
            delete activeTrades[data.tradeId];
        }
    });

    // --- Duel System ---
    socket.on('duel_invite', (targetName) => {
        const tid = Object.keys(players).find(id => players[id].name === targetName);
        if (tid && tid !== socket.id) {
            io.to(tid).emit('duel_invite', { from: players[socket.id].name, fromId: socket.id });
        }
    });

    socket.on('duel_accept', (fromId) => {
        if (!players[fromId] || !players[socket.id]) return;
        io.to(fromId).emit('duel_start', { opponentId: socket.id, opponentName: players[socket.id].name });
        io.to(socket.id).emit('duel_start', { opponentId: fromId, opponentName: players[fromId].name });
    });

    socket.on('duel_cancel', (targetId) => {
        if (targetId) io.to(targetId).emit('duel_end', { reason: 'cancelled' });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete players[socket.id];
        delete friends[socket.id];
        
        if (socket.id === currentHostId) {
            electNewHost();
        }

        io.emit('player_left', socket.id);
    });
});

// CRITICAL: Bind to 0.0.0.0 for Railway
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> MMO Server is LIVE on port ${PORT}`);
});
