const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://deathztalker.github.io", "http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files from the project root
app.use(express.static(path.join(__dirname, '..')));

// Player states: { socketId: { x, y, animState, facingDir, classId, name } }
const players = {};
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
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].animState = data.animState;
            players[socket.id].facingDir = data.facingDir;
            
            // Broadcast to everyone else
            socket.broadcast.emit('player_moved', players[socket.id]);
        }
    });

    // Combat Relay: Enemy Damaged
    socket.on('enemy_damaged', (data) => {
        // data: { enemyId, damage, dealerId }
        socket.broadcast.emit('enemy_damaged', data);
    });

    // Combat Relay: Enemy Death
    socket.on('enemy_death', (enemyId) => {
        socket.broadcast.emit('enemy_death', enemyId);
    });

    // Chat System
    socket.on('chat_message', (text) => {
        const player = players[socket.id];
        if (player) {
            const message = {
                id: Date.now(),
                sender: player.name,
                text: text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            io.emit('chat_message', message);
        }
    });

    // Whisper System
    socket.on('whisper', (data) => {
        // data: { targetName, text }
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
            // Send to both sender and target
            socket.emit('whisper', whisper);
            io.to(targetSocketId).emit('whisper', whisper);
        } else {
            socket.emit('system_message', `Player "${data.targetName}" not found or offline.`);
        }
    });

    // Friends System (Minimal for now, using volatile server state)
    const friends = {}; // socketId -> Set(names)
    socket.on('add_friend', (name) => {
        if (!friends[socket.id]) friends[socket.id] = new Set();
        friends[socket.id].add(name);
        socket.emit('system_message', `${name} added to your friends list.`);
        socket.emit('friends_list', Array.from(friends[socket.id]));
    });

    // --- Trade System ---
    const activeTrades = {}; // tradeId -> { p1, p2, offer1, offer2, lock1, lock2, accept1, accept2 }

    socket.on('trade_invite', (targetName) => {
        const targetId = Object.keys(players).find(id => players[id].name === targetName);
        if (targetId && targetId !== socket.id) {
            io.to(targetId).emit('trade_invite', { from: players[socket.id].name, fromId: socket.id });
            socket.emit('system_message', `Trade invitation sent to ${targetName}.`);
        } else {
            socket.emit('system_message', `Player "${targetName}" not found or busy.`);
        }
    });

    socket.on('trade_accept', (fromId) => {
        if (!players[fromId] || !players[socket.id]) return;
        const tradeId = `trade_${Math.min(socket.id, fromId)}_${Math.max(socket.id, fromId)}`;
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
        // data: { tradeId, offer }
        const trade = activeTrades[data.tradeId];
        if (!trade) return;
        const isP1 = socket.id === trade.p1;
        if (isP1) { trade.offer1 = data.offer; trade.lock1 = trade.lock2 = false; }
        else { trade.offer2 = data.offer; trade.lock1 = trade.lock2 = false; }
        trade.accept1 = trade.accept2 = false;
        
        const partnerId = isP1 ? trade.p2 : trade.p1;
        io.to(partnerId).emit('trade_update', { offer: data.offer });
        io.to(trade.p1).emit('trade_status', { lock1: trade.lock1, lock2: trade.lock2 });
        io.to(trade.p2).emit('trade_status', { lock1: trade.lock1, lock2: trade.lock2 });
    });

    socket.on('trade_lock', (data) => {
        const trade = activeTrades[data.tradeId];
        if (!trade) return;
        if (socket.id === trade.p1) trade.lock1 = true;
        else trade.lock2 = true;
        
        io.to(trade.p1).emit('trade_status', { lock1: trade.lock1, lock2: trade.lock2 });
        io.to(trade.p2).emit('trade_status', { lock1: trade.lock1, lock2: trade.lock2 });
    });

    socket.on('trade_confirm', (data) => {
        const trade = activeTrades[data.tradeId];
        if (!trade || !trade.lock1 || !trade.lock2) return;
        if (socket.id === trade.p1) trade.accept1 = true;
        else trade.accept2 = true;

        if (trade.accept1 && trade.accept2) {
            io.to(trade.p1).emit('trade_execute', { receive: trade.offer2, give: trade.offer1 });
            io.to(trade.p2).emit('trade_execute', { receive: trade.offer1, give: trade.offer2 });
            delete activeTrades[data.tradeId];
        }
    });

    // Enemy Sync (Host broadcasts)
    socket.on('enemy_sync', (enemies) => {
        // Only the host should send this
        socket.broadcast.emit('enemy_sync', enemies);
    });

    // --- PvP Duel System ---
    socket.on('duel_invite', (targetName) => {
        const targetId = Object.keys(players).find(id => players[id].name === targetName);
        if (targetId && targetId !== socket.id) {
            io.to(targetId).emit('duel_invite', { from: players[socket.id].name, fromId: socket.id });
            socket.emit('system_message', `Duel challenge sent to ${targetName}.`);
        }
    });

    socket.on('duel_accept', (fromId) => {
        if (!players[fromId] || !players[socket.id]) return;
        io.to(fromId).emit('duel_start', { opponentId: socket.id, opponentName: players[socket.id].name });
        io.to(socket.id).emit('duel_start', { opponentId: fromId, opponentName: players[fromId].name });
    });

    socket.on('duel_cancel', (targetId) => {
        io.to(targetId).emit('duel_end', { reason: 'cancelled' });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete players[socket.id];
        
        if (socket.id === currentHostId) {
            console.log('Host disconnected, migrating...');
            electNewHost();
        }

        io.emit('player_left', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`MMO Server running on http://localhost:${PORT}`);
});
