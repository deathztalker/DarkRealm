---
updated: 2026-04-17T14:30:00-04:00
---

# Project State

## Current Position

**Milestone:** Dark Realm v1.0 — Full ARPG Launch
**Phase:** 5 — Polish & Launch
**Status:** in-progress
**Plan:** Wave 1 — Final Deployment & Bug Hunting

## Last Action

✅ **MMO Server Migration COMPLETE: Node.js -> Go (Fiber)**
- **Architecture:** Servidor Go autoritativo con soporte para Redis y Supabase (pgx).
- **Railway Ready:** Los archivos del servidor Go se han movido a la raíz (`main.go`, `go.mod`, `Dockerfile`) para que Railway los detecte automáticamente.
- **Backups:** Servidor original de Node.js movido a `server_old_node/`.

## Next Steps

1. **Deploy to Railway**: Simplemente haz push de estos cambios y Railway debería reconstruir usando el nuevo Dockerfile de Go.
2. **Phase 7: Verification**: Monitorear los logs en Railway para asegurar que la conexión a Supabase y Redis sea exitosa.

## Active Decisions

| Decision | Choice | Made | Affects |
|----------|--------|------|---------|
| Skill Scaling | Base + Gear + Synergies | 2026-04-17 | Balance |
| Cube Logic | 3 Same -> 1 Better | 2026-04-17 | Economy |
| Rift Guardians | Unique Boss Pool | 2026-04-17 | Endgame |
| Stat Visibility | Advanced Panel (MF, GF, CB) | 2026-04-17 | UI |

## Session Context

- The game is mechanically and visually complete.
- Phase 4 ended with all systems (Loot, Combat, Skills, Rifts) working in harmony.
- Assets/ folder is fully populated with high-quality generated content.
