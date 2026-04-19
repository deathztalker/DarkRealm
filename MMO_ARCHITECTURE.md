# Dark Realm MMO Architecture

This document outlines the architectural changes required to transition Dark Realm from a single-player ARPG to a multi-player MMORPG.

## 1. World & Dungeons
### Current State
- Dungeons are procedurally generated on every entry.
- Progress is lost when leaving the dungeon (unless saved).
- World state is local to the player.

### MMO Goal
- **Static/Persistent Maps:** Dungeons should be generated once (or have fixed layouts) and persist.
- **Instancing/Layers:** To support many players, use "layers" or "shards" for high-traffic zones.
- **Larger Maps:** Increase grid dimensions (e.g., from 50x50 to 150x150) to prevent crowding.

## 2. Entity Management
### Respawn System
- Enemies and Bosses should not be deleted permanently upon death.
- **Respawn Timer:** After death, entities enter a "respawning" state.
- **Server-Side Sync:** (Future) The server will dictate when and where entities respawn.

### Loot Allocation
- Individual loot drops (instanced loot) to prevent "ninja looting".
- Shared bosses with contribution-based rewards.

## 3. Networking (In Progress)
- Move game state (player position, HP, mobs) to a central server (Socket.io).
- Synchronize entities across all connected clients.

## 4. Immediate Roadmap Tasks
- [ ] Increase default Dungeon size in `src/world/dungeon.js`.
- [ ] Implement a `RespawnSystem` to revive enemies.
- [ ] Modify `src/main.js` to prevent dungeon re-generation if already visited in session.
