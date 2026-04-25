# Phase 1 Analysis: Express to Go Migration - Dark Realm MMO

## 1. HTTP Routes (REST API)
Currently, the server is extremely minimal on HTTP routes, focusing almost entirely on WebSockets.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check. Returns "OK". |

*Note: Auth and Database operations are currently handled directly by the frontend using the Supabase JS client.*

## 2. WebSocket Events (Socket.io)

### Incoming Events (Client -> Server)
| Event | Payload | Action |
|-------|---------|--------|
| `join_zone` | `{ zoneId, roomName, seed, playerData }` | Joins a room, sets in-memory state, sends `current_players`, broadcasts `player_joined`. |
| `move` | `{ x, y, animState, facingDir, hp, mp, activeAura }` | Updates in-memory position/state, broadcasts `player_moved`. |
| `enemy_damaged`| `{ enemyId, damage, dealerId }` | Broadcasts damage event to the room. |
| `enemy_death` | `enemyId` | Broadcasts death event to the room. |
| `enemy_sync` | `Array<EnemyData>` | Sent by the 'Host' client to sync enemy positions/HP to others. |
| `npc_sync` | `Array<NpcData>` | Sent by 'Host' to sync NPC positions. |
| `minion_sync` | `Array<MinionData>` | Syncs player minions. |
| `merc_sync` | `MercData` | Syncs player mercenary. |
| `portal_spawn` | `PortalData` | Broadcasts portal creation. |
| `chat_message` | `text` | Broadcasts chat to the room. |
| `system_message`| `text` | Broadcasts system chat globally. |
| `whisper` | `{ targetName, text }` | Routes a private message to a specific user. |
| `trade_invite` | `name` | Sends invite to target. |
| `trade_accept` | `fromId` | Initializes trade session between two players. |
| `trade_update` | `{ tradeId, offer }` | Syncs trade window contents. |
| `trade_lock` | `{ tradeId }` | Signals one player has locked their offer. |
| `trade_confirm`| `{ tradeId }` | Executes trade if both are locked/confirmed. |
| `duel_invite` | `targetName` | Sends challenge to target. |
| `duel_accept` | `fromId` | Starts a duel instance. |
| `party_invite` | `targetName` | Sends invite to target. |
| `party_accept` | `leaderId` | Joins/creates a party. |
| `party_leave` | - | Leaves current party. |
| `disconnect` | - | Clean up state, broadcast `player_left`. |

### Outgoing Events (Server -> Client)
| Event | Payload | Description |
|-------|---------|-------------|
| `host_assignment`| `boolean` | Designates if this client is responsible for AI sync. |
| `current_players`| `Object` | List of all players in the room upon joining. |
| `player_joined` | `PlayerData` | Notification of a new player entry. |
| `player_moved` | `PlayerData` | Position and state update. |
| `player_left` | `socketId` | Notification of player exit. |
| `enemy_damaged` | `Object` | Syncs damage visual/effect. |
| `enemy_death` | `id` | Syncs enemy removal. |
| `enemy_sync` | `Array` | Relays host data to guests. |
| `chat_message` | `Object` | Formatted message with timestamp. |
| `whisper` | `Object` | Formatted private message. |
| `trade_start` | `Object` | Opens trade UI for both parties. |
| `trade_execute` | `Object` | Finalizes item transfer. |
| `duel_start` | `Object` | Starts combat countdown/state. |
| `party_update` | `Object` | Syncs party member list and health. |

## 3. Supabase Schema (PostgreSQL)

| Table | Columns | Notes |
|-------|---------|-------|
| `saves` | `slot_id` (int), `user_id` (uuid), `zone_level` (int), `player` (jsonb), `stash` (jsonb), `cube` (jsonb), `mercenary` (jsonb), `waypoints` (jsonb), `difficulty` (int), `extra_data` (jsonb), `updated_at` (tz) | Main progression storage. |
| `shared_stash` | `user_id` (uuid), `tabs` (jsonb), `gold` (int), `updated_at` (tz) | Shared items between characters. |
| `messages` | `id` (int/uuid), `created_at` (tz), `sender_id` (uuid), `sender_name` (text), `receiver_id` (uuid), `content` (text), `is_whisper` (bool) | Persistent chat history. |
| `friends` | `user_id` (uuid), `friend_id` (uuid), `status` (text) | Social graph. |
| `parties` | `id` (uuid), `leader_id` (uuid), `created_at` (tz) | Active groups. |
| `party_members`| `party_id` (uuid), `user_id` (uuid), `joined_at` (tz) | Group membership. |
| `auctions` | `id` (uuid), `seller_id` (uuid), `seller_name` (text), `item_data` (jsonb), `price` (int), `status` (text) | Player economy. |

## 4. Current Logic Issues (Bugs to Fix)
1. **Client-Authoritative Dungeons**: The `seed` is currently passed from client to server in `join_zone`, or generated in a disjointed way. This causes desync when multiple players enter the same zone but generate different layouts.
2. **Relay-only Combat**: The server simply broadcasts what one client says happened. It doesn't validate or originate combat events, leading to "ghost" spells or missed actions if a client doesn't send/receive a packet correctly.

## 5. Migration Strategy
- **Go + Fiber**: Replaces Express for the REST/Health check layer.
- **Gorilla WebSocket**: Replaces Socket.io for the game loop.
- **Authoritative Zones**: Move dungeon generation and combat logic to Go.
- **Redis**: Introduce for high-frequency state (positions, active seeds) to reduce DB load.
- **pgx**: Direct connection to Supabase for persistent data.
