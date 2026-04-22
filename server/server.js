const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Log inicial inmediato para Railway
console.log('>>> Inicianzando Dark Realm MMO Server...');

// 1. CORS CONFIGURATION - Muy permisivo para asegurar conexión
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

// 3. HEALTH CHECK (Ruta obligatoria para que Railway no mate el proceso)
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// --- GLOBAL STATE ---
const friends = {}; 
const players = {}; // { socketId: { id, x, y, animState, facingDir, classId, name, zoneLevel } }
const zoneHosts = {}; // { zoneLevel: socketId }
const activeTrades = {}; 

function electNewHost(zoneLevel) {
    const playersInZone = Object.values(players).filter(p => p.zoneLevel === zoneLevel);
    if (playersInZone.length > 0) {
        zoneHosts[zoneLevel] = playersInZone[0].id;
        io.to(zoneHosts[zoneLevel]).emit('host_assignment', true);
    } else {
        delete zoneHosts[zoneLevel];
    }
}

io.on('connection', (socket) => {
    console.log(`+ Player Connected: ${socket.id}`);

    socket.on('join', (data) => {
        if (!data) return;
        
        const zoneLevel = data.zoneLevel || 0;
        socket.join(`zone_${zoneLevel}`);

        players[socket.id] = {
            id: socket.id,
            x: data.x || 0,
            y: data.y || 0,
            animState: 'idle',
            facingDir: 'down',
            classId: data.classId,
            name: data.name || 'Stranger',
            zoneLevel: zoneLevel
        };

        if (!zoneHosts[zoneLevel]) electNewHost(zoneLevel);
        
        // Send only players in the same zone
        const playersInZone = Object.fromEntries(Object.entries(players).filter(([_, p]) => p.zoneLevel === zoneLevel));
        socket.emit('current_players', playersInZone);
        
        // Notify others in the zone
        socket.broadcast.to(`zone_${zoneLevel}`).emit('player_joined', players[socket.id]);
    });

    socket.on('change_zone', (data) => {
        if (!players[socket.id]) return;
        const oldZone = players[socket.id].zoneLevel;
        const newZone = data.zoneLevel;

        socket.leave(`zone_${oldZone}`);
        socket.broadcast.to(`zone_${oldZone}`).emit('player_left', socket.id);
        
        if (zoneHosts[oldZone] === socket.id) electNewHost(oldZone);

        socket.join(`zone_${newZone}`);
        players[socket.id].zoneLevel = newZone;
        players[socket.id].x = data.x || 0;
        players[socket.id].y = data.y || 0;

        if (!zoneHosts[newZone]) electNewHost(newZone);

        const playersInZone = Object.fromEntries(Object.entries(players).filter(([_, p]) => p.zoneLevel === newZone));
        socket.emit('current_players', playersInZone);
        socket.broadcast.to(`zone_${newZone}`).emit('player_joined', players[socket.id]);
    });

    socket.on('move', (data) => {
        if (data && players[socket.id]) {
            const p = players[socket.id];
            p.x = data.x;
            p.y = data.y;
            p.animState = data.animState;
            p.facingDir = data.facingDir;
            if (data.activeAura) p.activeAura = data.activeAura;
            
            socket.broadcast.to(`zone_${p.zoneLevel}`).emit('player_moved', p);
        }
    });

    // Scoped environment events
    socket.on('enemy_damaged', (data) => {
        if(players[socket.id]) socket.broadcast.to(`zone_${players[socket.id].zoneLevel}`).emit('enemy_damaged', data);
    });
    socket.on('enemy_death', (id) => {
        if(players[socket.id]) socket.broadcast.to(`zone_${players[socket.id].zoneLevel}`).emit('enemy_death', id);
    });
    socket.on('enemy_sync', (data) => {
        if(players[socket.id]) socket.broadcast.to(`zone_${players[socket.id].zoneLevel}`).emit('enemy_sync', data);
    });
    socket.on('npc_sync', (data) => {
        if(players[socket.id]) socket.broadcast.to(`zone_${players[socket.id].zoneLevel}`).emit('npc_sync', data);
    });
    socket.on('minion_sync', (data) => {
        if(players[socket.id]) socket.broadcast.to(`zone_${players[socket.id].zoneLevel}`).emit('minion_sync', { id: socket.id, minions: data });
    });
    socket.on('merc_sync', (data) => {
        if(players[socket.id]) socket.broadcast.to(`zone_${players[socket.id].zoneLevel}`).emit('merc_sync', { id: socket.id, mercenary: data });
    });
    socket.on('portal_spawn', (data) => {
        if(players[socket.id]) socket.broadcast.to(`zone_${players[socket.id].zoneLevel}`).emit('portal_spawn', data);
    });

    socket.on('chat_message', (text) => {
        const p = players[socket.id];
        if (p && text) {
            // Broadcast only to the zone
            io.to(`zone_${p.zoneLevel}`).emit('chat_message', {
                id: Date.now(),
                sender: p.name,
                text: text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });

    socket.on('system_message', (text) => {
        // Global broadcasts (e.g. Rift Guardian defeated)
        io.emit('chat_message', {
            id: Date.now(),
            sender: 'System',
            text: text,
            isSystem: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
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

    socket.on('trade_update', (data) => {
        if (!data || !data.tradeId) return;
        const trade = activeTrades[data.tradeId];
        if (!trade) return;
        const isP1 = socket.id === trade.p1;
        if (isP1) { trade.offer1 = data.offer; } else { trade.offer2 = data.offer; }
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

    socket.on('disconnect', () => {
        console.log(`- Player Disconnected: ${socket.id}`);
        const p = players[socket.id];
        if (p) {
            const oldZone = p.zoneLevel;
            socket.broadcast.to(`zone_${oldZone}`).emit('player_left', socket.id);
            delete players[socket.id];
            if (zoneHosts[oldZone] === socket.id) electNewHost(oldZone);
        }
    });
});

// 4. ERROR HANDLING
process.on('uncaughtException', (err) => console.error('CRITICAL ERROR:', err));

// 5. START SERVER - Explicitly bind to 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> MMO SERVER LIVE ON PORT ${PORT} <<<`);
});

