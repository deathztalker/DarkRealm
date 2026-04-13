---
milestone: Dark Realm v1.0 — Full ARPG Launch
version: 0.9.0
updated: 2026-04-13
---

# Roadmap

> **Current Phase:** 2 — Core UX Polish & Content
> **Status:** 🔄 In Progress

## Must-Haves (from SPEC)

- [x] Complete ARPG core loop (combat → loot → equip → progress)
- [x] Inventory economy (loot, stash, cube, shop, vendor)
- [ ] Shift-free contextual inventory — 100% working
- [ ] Full Act 2 content
- [ ] GitHub Pages stable deployment

---

## Phases

### Phase 1: Foundation & Core Systems
**Status:** ✅ Complete
**Objective:** Playable game with all core ARPG systems functional.

**Plans:**
- [x] Plan 1.1: Game loop, canvas rendering, player movement
- [x] Plan 1.2: Combat system (melee, ranged, spells, damage types)
- [x] Plan 1.3: Procedural loot system (rarity, affixes, item types)
- [x] Plan 1.4: Inventory, equipment slots, belt
- [x] Plan 1.5: Stash (personal + shared), Horadric Cube
- [x] Plan 1.6: NPC shop, merchant dialogue, sell/buy
- [x] Plan 1.7: Save system (local + Supabase cloud)
- [x] Plan 1.8: Talent trees (3 paths × 10 tiers per class)
- [x] Plan 1.9: Quest journal, objectives, rewards
- [x] Plan 1.10: Mercenary companion system
- [x] Plan 1.11: Class selection screen (6 classes, HD sprites)
- [x] Plan 1.12: HUD (HP/MP orbs, XP bar, skill bar, belt, minimap, buffs)
- [x] Plan 1.13: Boss fights, boss HP bar, victory screen
- [x] Plan 1.14: Socketing system (gems, runewords)
- [x] Plan 1.15: Infinite Rifts (end-game loop)
- [x] Plan 1.16: Loot filter, waypoints, town portal
- [x] Plan 1.17: Achievements, Pantheon of Heroes (Hardcore)
- [x] Plan 1.18: GitHub Pages deployment

---

### Phase 2: Core UX Polish & Content
**Status:** 🔄 In Progress
**Objective:** Make inventory interactions seamless, fix known bugs, expand Act 2 content, and stabilize deployment.
**Depends on:** Phase 1

**Plans:**
- [x] Plan 2.1: Shift-free contextual inventory (Left-click equip/move, Right-click sell/drop/use)
- [x] Plan 2.2: Drag threshold (5px) in all panels — Inventory, Stash, Cube, Merc, Belt, Equipment
- [x] Plan 2.3: Fix Quest Log ReferenceError (`renderQuestJournal`)
- [ ] Plan 2.4: Tooltip footer text update (remove Shift references)
- [ ] Plan 2.5: Act 2 zones, enemies, quest chain
- [ ] Plan 2.6: GitHub Actions CI/CD auto-deploy to GitHub Pages

---

### Phase 3: Skill System & Balance
**Status:** ⬜ Not Started
**Objective:** Flesh out skill system, class-specific skill animations, and overall game balance.
**Depends on:** Phase 2

**Plans:**
- [ ] Plan 3.1: Skill visual feedback (projectile animations per class)
- [ ] Plan 3.2: Talent tree dependency UI (locked nodes, requirement display)
- [ ] Plan 3.3: Combat balance pass (damage scaling, monster HP curves)
- [ ] Plan 3.4: Runeword recipe expansion (10+ runewords fully operational)
- [ ] Plan 3.5: Class-specific passive stats and playstyle differentiation

---

### Phase 4: Polish & Launch
**Status:** ⬜ Not Started
**Objective:** Final visual and audio polish, performance optimization, launch readiness.
**Depends on:** Phase 3

**Plans:**
- [ ] Plan 4.1: Audio system polish (ambient zones, combat sounds, UI feedback)
- [ ] Plan 4.2: Performance audit (canvas rendering, DOM recycling)
- [ ] Plan 4.3: New player experience (tutorial hints, first-run flow)
- [ ] Plan 4.4: Final deployment validation and community sharing

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1 | ✅ | 18 | 18/18 |
| 2 | 🔄 | 6 | 3/6 |
| 3 | ⬜ | 5 | 0/5 |
| 4 | ⬜ | 4 | 0/4 |

---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1 | 2026-03-15 | 2026-04-12 | ~28 days |
| 2 | 2026-04-12 | — | ongoing |
| 3 | — | — | — |
| 4 | — | — | — |
