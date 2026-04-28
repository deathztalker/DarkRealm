import { fx } from '../engine/ParticleSystem.js';

/**
 * Weather & Atmosphere System — Premium HD Edition
 * - Ciclo día/noche suave con transiciones de color
 * - Relámpagos con flash de pantalla real
 * - Luz dinámica con múltiples capas de gradiente
 * - Viento, niebla volumétrica, neblina de calor
 * - Partículas ambientales por tema (polvo, hojas, cenizas, etc.)
 */

// ─── Constantes ──────────────────────────────────────────────────────────────

const MINUTE = 60;
const DAY_MINUTES = 1440;

// Paleta de color del cielo según hora (hour → [r, g, b, overlayAlpha])
const SKY_TIMELINE = [
    { h: 0, r: 0, g: 0, b: 20, a: 0.92 }, // Medianoche
    { h: 4, r: 5, g: 5, b: 30, a: 0.88 }, // Madrugada
    { h: 5, r: 60, g: 30, b: 10, a: 0.60 }, // Amanecer
    { h: 7, r: 20, g: 15, b: 5, a: 0.20 }, // Mañana
    { h: 12, r: 0, g: 5, b: 15, a: 0.10 }, // Mediodía
    { h: 17, r: 15, g: 10, b: 0, a: 0.18 }, // Tarde
    { h: 19, r: 70, g: 25, b: 10, a: 0.55 }, // Atardecer
    { h: 20, r: 10, g: 5, b: 20, a: 0.80 }, // Anochecer
    { h: 23, r: 0, g: 0, b: 20, a: 0.92 }, // Noche
];

// Configuración de atmósfera por acto
const ACT_CONFIGS = {
    town: { ambient: [0, 0, 10, 0.10], lightMult: 1.4, fog: false },
    act1: { ambient: [5, 5, 20, 0.75], lightMult: 1.0, fog: true, fogColor: 'rgba(30,40,80,0.06)' },
    act2: { ambient: [30, 15, 0, 0.72], lightMult: 0.9, fog: true, fogColor: 'rgba(120,80,20,0.05)' },
    act3: { ambient: [10, 28, 10, 0.80], lightMult: 0.85, fog: true, fogColor: 'rgba(20,60,20,0.07)' },
    act4: { ambient: [40, 5, 0, 0.88], lightMult: 0.8, fog: true, fogColor: 'rgba(120,30,0,0.06)' },
    act5: { ambient: [15, 20, 40, 0.78], lightMult: 0.95, fog: true, fogColor: 'rgba(60,80,120,0.05)' },
    rift: { ambient: [25, 0, 40, 0.92], lightMult: 0.75, fog: true, fogColor: 'rgba(80,0,120,0.08)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(c1, c2, t) {
    return {
        r: Math.round(lerp(c1.r, c2.r, t)),
        g: Math.round(lerp(c1.g, c2.g, t)),
        b: Math.round(lerp(c1.b, c2.b, t)),
        a: lerp(c1.a, c2.a, t),
    };
}

function getSkyColor(hour) {
    const tl = SKY_TIMELINE;
    for (let i = 0; i < tl.length - 1; i++) {
        if (hour >= tl[i].h && hour < tl[i + 1].h) {
            const t = (hour - tl[i].h) / (tl[i + 1].h - tl[i].h);
            return lerpColor(tl[i], tl[i + 1], t);
        }
    }
    return tl[0];
}

function getActConfig(zoneLevel) {
    if (zoneLevel === 0 || [38, 68, 96, 102].includes(zoneLevel)) return ACT_CONFIGS.town;
    if (zoneLevel <= 37) return ACT_CONFIGS.act1;
    if (zoneLevel <= 67) return ACT_CONFIGS.act2;
    if (zoneLevel <= 95) return ACT_CONFIGS.act3;
    if (zoneLevel <= 101) return ACT_CONFIGS.act4;
    if (zoneLevel <= 125) return ACT_CONFIGS.act5;
    return ACT_CONFIGS.rift;
}

// ─── Sistema Principal ────────────────────────────────────────────────────────

export const WeatherSystem = {
    worldTime: 8 * MINUTE,
    isNight: false,

    // Internos
    _skyColor: { r: 0, g: 0, b: 10, a: 0.10 },
    _actAmbient: [0, 0, 0, 0.88],
    _lightningFlash: 0,       // ms restantes del flash
    _lightningAlpha: 0,       // alpha actual del flash
    _windOffset: 0,           // para efecto de viento en partículas
    _fogLayers: [],           // capas de niebla volumétrica
    _heatHaze: 0,             // intensidad de distorsión de calor
    _lightPulse: 0,           // phase acumulada para pulso de luz
    _dustAccum: 0,            // acumulador de polvo ambiental
    _leafAccum: 0,            // acumulador de hojas
    _emberAccum: 0,
    _lastTheme: null,

    // ─── Update ─────────────────────────────────────────────────────────────

    update(dt, zoneLevel, theme, renderer) {
        // Avance de tiempo (1s real = 10 min juego)
        this.worldTime = (this.worldTime + dt * 10) % DAY_MINUTES;
        const hour = this.worldTime / MINUTE;
        this.isNight = (hour >= 20 || hour < 6);
        window.isNight = this.isNight;

        // Limpiar clima si cambia el tema
        if (theme !== this._lastTheme) {
            if (fx) fx.clearWeather();
            this._lastTheme = theme;
        }

        // Color de cielo interpolado suavemente
        this._skyColor = getSkyColor(hour);

        // Pulso de luz acumulado
        this._lightPulse += dt * 0.002;

        // Viento oscilante (para partículas climáticas)
        this._windOffset = Math.sin(Date.now() / 4000) * 0.8 + Math.sin(Date.now() / 1100) * 0.3;

        // Flash de relámpago
        if (this._lightningFlash > 0) {
            this._lightningFlash -= dt;
            this._lightningAlpha = Math.max(0, (this._lightningFlash / 80) * 0.35);
        }

        // Partículas climáticas
        this._updateWeatherParticles(dt, zoneLevel, theme, renderer);

        // Calor (acto 4)
        this._heatHaze = (zoneLevel > 95 && zoneLevel <= 101) ? 1.0 : 0.0;
    },

    _updateWeatherParticles(dt, zoneLevel, theme, renderer) {
        if (!fx || !renderer) return;
        const W = renderer.width;
        const H = renderer.height;

        this._dustAccum += dt;
        this._leafAccum += dt;
        this._emberAccum += dt;

        switch (theme) {
            case 'snow':
                fx.emitBlizzard(W, H);
                // Polvo de hielo fino extra
                if (this._dustAccum > 80) {
                    this._dustAccum = 0;
                    this._spawnIceDust(W, H);
                }
                break;

            case 'desert':
                fx.emitSand(W, H);
                // Torbellinos de polvo ocasionales
                if (this._dustAccum > 200) {
                    this._dustAccum = 0;
                    this._spawnDustDevil(W, H);
                }
                break;

            case 'hell':
                fx.emitEmbers(W, H);
                // Cenizas más densas
                if (this._emberAccum > 120) {
                    this._emberAccum = 0;
                    this._spawnAsh(W, H);
                }
                // Relámpagos de infierno ocasionales
                if (Math.random() < 0.001) this._triggerHellLightning();
                break;

            case 'jungle':
            case 'temple':
                fx.emitRain(W, H);
                // Hojas cayendo
                if (this._leafAccum > 300) {
                    this._leafAccum = 0;
                    this._spawnLeaf(W, H);
                }
                // Relámpagos de tormenta
                if (Math.random() < 0.003) this._triggerLightning();
                break;

            case 'wilderness':
                fx.emitMist(W, H);
                // Hojas de bosque
                if (this._leafAccum > 500) {
                    this._leafAccum = 0;
                    this._spawnLeaf(W, H);
                }
                break;

            case 'rift':
                // Void sparks
                if (Math.random() < 0.05) this._spawnVoidSpark(W, H);
                break;
        }

        // Lluvia genérica de acto 1
        if (!theme && zoneLevel > 0 && zoneLevel <= 37) {
            fx.emitRain(W, H);
            if (Math.random() < 0.004) this._triggerLightning();
        }
    },

    // ─── Efectos Especiales de Partículas ───────────────────────────────────

    _spawnIceDust(W, H) {
        if (!fx) return;
        for (let i = 0; i < 6; i++) {
            fx._spawn(
                Math.random() * W, Math.random() * H * 0.5,
                fx._rand(-0.3, 0.3) + this._windOffset, fx._rand(0.1, 0.4),
                fx._rand(3000, 6000),
                `rgba(180,230,255,${fx._rand(0.03, 0.08)})`,
                fx._rand(20, 50),
                { shape: 'glow', gravity: 0 }
            );
        }
    },

    _spawnDustDevil(W, H) {
        if (!fx) return;
        const cx = Math.random() * W;
        const cy = H * 0.6 + Math.random() * H * 0.4;
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const r = fx._rand(10, 40);
            fx._spawn(
                cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.3,
                Math.cos(angle + Math.PI / 2) * 1.5 + this._windOffset,
                fx._rand(-2, -0.5),
                fx._rand(800, 1400),
                `rgba(180,140,60,${fx._rand(0.15, 0.35)})`,
                fx._rand(2, 5),
                { gravity: -0.02 }
            );
        }
    },

    _spawnAsh(W, H) {
        if (!fx) return;
        for (let i = 0; i < 8; i++) {
            fx._spawn(
                Math.random() * W, H + 10,
                fx._rand(-0.5, 0.5) + this._windOffset * 0.3,
                fx._rand(-1.5, -0.4),
                fx._rand(4000, 8000),
                `rgba(80,60,50,${fx._rand(0.1, 0.25)})`,
                fx._rand(2, 5),
                { shape: 'snowflake', rotationSpeed: fx._rand(-0.02, 0.02), gravity: -0.005 }
            );
        }
    },

    _spawnLeaf(W, H) {
        if (!fx) return;
        const colors = [
            `rgba(60,120,40,${fx._rand(0.4, 0.7)})`,
            `rgba(80,140,50,${fx._rand(0.4, 0.7)})`,
            `rgba(100,160,60,${fx._rand(0.3, 0.6)})`,
        ];
        fx._spawn(
            Math.random() * W, -10,
            fx._rand(-1, 1) + this._windOffset * 0.5,
            fx._rand(0.5, 1.5),
            fx._rand(4000, 7000),
            colors[Math.floor(Math.random() * colors.length)],
            fx._rand(3, 6),
            { shape: 'spark', rotationSpeed: fx._rand(-0.05, 0.05), gravity: 0.005 }
        );
    },

    _spawnVoidSpark(W, H) {
        if (!fx) return;
        const colors = ['#8020ff', '#c040ff', '#ff20ff', '#4000ff'];
        fx._spawn(
            Math.random() * W, Math.random() * H,
            fx._rand(-1, 1), fx._rand(-2, -0.5),
            fx._rand(500, 1200),
            colors[Math.floor(Math.random() * colors.length)],
            fx._rand(1, 3),
            { shape: 'spark', gravity: -0.01 }
        );
    },

    _triggerLightning() {
        this._lightningFlash = 80;
        this._lightningAlpha = 0.30;
        // Retraso de trueno (visual solamente)
        setTimeout(() => {
            this._lightningFlash = 40;
            this._lightningAlpha = 0.15;
        }, 120);
    },

    _triggerHellLightning() {
        this._lightningFlash = 60;
        this._lightningAlpha = 0.20;
    },

    // ─── Render Principal ────────────────────────────────────────────────────

    renderAtmosphere(renderer, player, camera, zoneLevel, isBossZone) {
        if (!player || !renderer || !camera) return;

        const ctx = renderer.ctx;
        const W = renderer.width;
        const H = renderer.height;

        const screen = camera.toScreen(player.x, player.y - 15);
        const actCfg = getActConfig(zoneLevel);
        const lightMult = actCfg.lightMult * (isBossZone ? 0.85 : 1.0);
        const baseRadius = (180 + (player.lightRadius || 0) * 60) * lightMult;

        // 1. Máscara de oscuridad global con gradiente de acto
        this._renderDarknessLayer(ctx, W, H, screen, baseRadius, actCfg, zoneLevel, isBossZone);

        // 2. Overlay de color de cielo (tiempo del día)
        this._renderSkyOverlay(ctx, W, H, zoneLevel);

        // 3. Flash de relámpago
        if (this._lightningAlpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(200, 220, 255, ${this._lightningAlpha})`;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }

        // 4. Niebla volumétrica por acto
        if (actCfg.fog) {
            this._renderFogLayer(ctx, W, H, actCfg.fogColor);
        }

        // 5. Viñeta de borde (profundidad premium)
        this._renderVignette(ctx, W, H, zoneLevel, isBossZone);

        // 6. Calor (distorsión de acto 4) — efecto de brillo rojo pulsante
        if (this._heatHaze > 0) {
            this._renderHeatGlow(ctx, W, H);
        }
    },

    // ─── Capas de Render ─────────────────────────────────────────────────────

    _renderDarknessLayer(ctx, W, H, screen, baseRadius, actCfg, zoneLevel, isBossZone) {
        const pulse = Math.sin(this._lightPulse) * 12 + Math.sin(this._lightPulse * 2.3) * 5;
        const radius = Math.max(80, baseRadius + pulse);
        const innerR = radius * 0.15;
        const [r, g, b, a] = actCfg.ambient;

        ctx.save();

        // Capa 1: Oscuridad base con color de acto
        const grad = ctx.createRadialGradient(screen.x, screen.y, innerR, screen.x, screen.y, radius);
        grad.addColorStop(0.00, 'rgba(0,0,0,0)');
        grad.addColorStop(0.40, 'rgba(0,0,0,0)');
        grad.addColorStop(0.70, `rgba(${r},${g},${b},${(a * 0.5).toFixed(2)})`);
        grad.addColorStop(1.00, `rgba(${r},${g},${b},${a.toFixed(2)})`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Capa 2: Halo de luz cálida interior (antorcha)
        if (zoneLevel !== 0) {
            const haloGrad = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius * 0.45);
            haloGrad.addColorStop(0.00, 'rgba(255,180,80,0.06)');
            haloGrad.addColorStop(0.60, 'rgba(255,120,40,0.02)');
            haloGrad.addColorStop(1.00, 'rgba(0,0,0,0)');
            ctx.fillStyle = haloGrad;
            ctx.fillRect(0, 0, W, H);
        }

        ctx.restore();
    },

    _renderSkyOverlay(ctx, W, H, zoneLevel) {
        // En interiores o actos específicos no aplicar tinte de cielo
        if (zoneLevel <= 0) return;
        const { r, g, b, a } = this._skyColor;
        if (a < 0.01) return;

        ctx.save();
        // Gradiente de cielo: más intenso arriba
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, `rgba(${r},${g},${b},${(a * 1.2).toFixed(2)})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${(a * 0.6).toFixed(2)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    },

    _renderFogLayer(ctx, W, H, fogColor) {
        const t = Date.now() / 1000;
        ctx.save();

        // 3 capas de niebla con offset de tiempo diferente (volumétrica)
        for (let i = 0; i < 3; i++) {
            const offsetX = Math.sin(t * 0.12 + i * 2.1) * W * 0.15;
            const offsetY = Math.cos(t * 0.08 + i * 1.7) * H * 0.08;
            const grad = ctx.createRadialGradient(
                W * (0.3 + i * 0.2) + offsetX, H * (0.4 + i * 0.15) + offsetY, 0,
                W * (0.3 + i * 0.2) + offsetX, H * (0.4 + i * 0.15) + offsetY, W * 0.45
            );
            grad.addColorStop(0, fogColor);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        ctx.restore();
    },

    _renderVignette(ctx, W, H, zoneLevel, isBossZone) {
        ctx.save();
        const intensity = isBossZone ? 0.75 : 0.55;
        const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    },

    _renderHeatGlow(ctx, W, H) {
        const t = Date.now() / 800;
        const pulse = (Math.sin(t) * 0.5 + 0.5) * 0.04 + 0.02;
        ctx.save();
        // Brillo rojo-naranja pulsante desde abajo
        const grad = ctx.createLinearGradient(0, H * 0.6, 0, H);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(150,30,0,${pulse.toFixed(3)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    },

    // ─── Compatibilidad ──────────────────────────────────────────────────────

    /** Mantenido para compatibilidad con renderer.applyLighting() */
    _updateAmbient(zoneLevel, theme) {
        const cfg = getActConfig(zoneLevel);
        const [r, g, b, a] = cfg.ambient;
        this.currentAmbient = `rgba(${r},${g},${b},${a})`;
        this.flicker = Math.sin(Date.now() / 150) * 8;
    },

    // ─── Utilidades Públicas ─────────────────────────────────────────────────

    /**
     * Devuelve tinte RGBA para minimap/UI basado en hora del día
     */
    getTimeTint() {
        const hour = this.worldTime / MINUTE;
        let alpha = 0;
        let color = '0, 0, 0';

        if (hour >= 20 || hour < 4) {
            alpha = 0.45; color = '0, 0, 30';
        } else if (hour >= 18 && hour < 20) {
            alpha = ((hour - 18) / 2) * 0.45; color = '80, 20, 40';
        } else if (hour >= 4 && hour < 6) {
            alpha = (1 - (hour - 4) / 2) * 0.45; color = '80, 50, 20';
        }

        return { alpha, color };
    },

    /**
     * Devuelve string de hora para HUD (ej: "06:30 AM")
     */
    getTimeString() {
        const totalMin = Math.floor(this.worldTime);
        const h = Math.floor(totalMin / 60) % 24;
        const m = totalMin % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hh = ((h % 12) || 12).toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        return `${hh}:${mm} ${ampm}`;
    },

    /**
     * Fuerza una tormenta de relámpagos (útil para boss fights)
     */
    triggerThunderstorm(count = 5, intervalMs = 400) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => this._triggerLightning(), i * intervalMs + Math.random() * 150);
        }
    },
};