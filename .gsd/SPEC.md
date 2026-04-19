# SPEC.md — Dark Realm: Action RPG

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: No code may be written until this spec is marked `FINALIZED`.

## Vision

Dark Realm is a browser-based Action RPG inspired by Diablo 2, Path of Exile, and World of Warcraft. Built entirely in vanilla HTML/CSS/JavaScript with no framework dependencies, it delivers a full ARPG experience including procedural loot, deep talent trees, a multi-act quest system, real-time combat, and a complete inventory/stash economy — all playable directly in the browser with cloud save support via Supabase.

## Goals

1. **Complete ARPG Core Loop** — Kill mobs → collect loot → upgrade gear → tackle harder content, fully functional and fun.
2. **Deep Character Customization** — 6+ classes, each with unique talent trees (3 paths × 10 tiers), skill hotbars, and a mercenary companion system.
3. **Full Inventory Economy** — Shift-free contextual inventory management: equip, stash, cube transmutation, selling to vendors, drag-and-drop — all intuitive with zero friction.
4. **Persistent Progression** — Multiple save slots with cloud sync (Supabase Auth), hardcore mode (Pantheon of Heroes on death), NG+ difficulty scaling.
5. **Content Depth** — Multi-act structure, boss fights, Horadric Cube recipes, runewords, socketing, infinite rifts (end-game), and a full quest journal.
6. **Polish & Accessibility** — Premium feel: smooth animations, responsive HUD, atmospheric audio, minimap, buff bars, loot filter, and a class selection experience that wows on first load.

## Non-Goals (Out of Scope)

- Multiplayer / co-op (single player only)
- Mobile / touch interface optimization
- Server-side game logic (client authoritative)
- Procedural map generation beyond current zone/biome system
- External game engine (Phaser, Pixi.js, etc.) — vanilla canvas only

## Constraints

- **Zero build step**: No bundler, no TypeScript. ES6 modules via `<script type="module">`.
- **Single-file core**: `src/main.js` is the primary game loop and UI orchestration file.
- **Browser compatibility**: Must work in modern Chromium and Firefox without polyfills.
- **Performance**: Target 60fps on a mid-range GPU. Canvas rendering must stay efficient.
- **Supabase free tier**: Cloud saves and auth must fit within free tier limits.

## Success Criteria

- [x] Player can select a class and enter the game world
- [x] Real-time combat with skill hotbar (Q/E/R/F/G)
- [x] Procedural loot drops with rarity tiers (Normal/Magic/Rare/Unique/Set)
- [x] Full inventory grid (40 slots), equipment slots, and belt
- [x] Stash (personal + shared) and Horadric Cube panels
- [x] NPC shop — buy, sell, gamble
- [x] Mercenary companion with equipment slots
- [x] Talent tree per class (3 paths × 10 tiers)
- [x] Multi-act quest journal with objectives and rewards
- [x] Save/load system (local + Supabase cloud)
- [x] Loot filter (toggle by rarity)
- [x] Minimap, buff bar, boss HP bar, XP bar
- [ ] Left-click equip/move works without any Shift key — 100% contextual (IN PROGRESS)
- [ ] Runeword system fully operational
- [ ] Full Act 2 content (quests, bosses, waypoints)
- [ ] Skill tree polish: visual tooltips per node, dependency lock display
- [ ] Infinite Rift end-game mode fully playable
- [ ] GitHub Pages deployment live and stable

## User Stories

### As a new player
- I want to click a class and immediately understand its playstyle
- So that I can make an informed choice and dive into the game quickly

### As a player looting
- I want to left-click an item to equip it (or move it to stash if stash is open)
- So that I never need to think about modifier keys — it just works

### As a returning player
- I want to load my save and see my exact state (gear, talents, quests, stash)
- So that I can continue exactly where I left off

### As an end-game player
- I want to farm Infinite Rifts for better loot at increasing difficulty
- So that characters have a perpetual challenge and progression path

## Technical Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Contextual left-click inventory (no Shift) | Must-have | In progress — drag threshold implemented |
| Drag-and-drop with 5px threshold in all panels | Must-have | Done in Inventory, Stash, Cube, Merc, Belt |
| Runeword detection on socket completion | Must-have | `checkRuneword()` exists, needs recipes |
| Talent tree dependency locks (visual) | Should-have | Trees rendered, locking logic exists |
| Act 2 zone + boss content | Should-have | Zone scaffolding present |
| Infinite Rift difficulty scaling | Should-have | Basic rift loop exists |
| GitHub Pages CI/CD (auto-deploy on push) | Should-have | Pages set up, needs workflow yaml |
| Cloud save conflict resolution (last-write-wins) | Nice-to-have | Supabase integration present |

---

*Last updated: 2026-04-13*
