import { fx } from '../engine/ParticleSystem.js';

/**
 * Weather & Atmosphere System
 * Manages environmental effects, day/night cycle, and act-specific climates.
 */
export const WeatherSystem = {
    worldTime: 8 * 60, // Start at 08:00 AM
    isNight: false,
    currentAmbient: 'rgba(0, 0, 0, 0.88)',
    flicker: 0,

    update(dt, zoneLevel, theme) {
        // --- Day/Night Cycle Tick (1 sec real = 10 game mins) ---
        this.worldTime = (this.worldTime + dt * 10) % 1440;
        const hour = this.worldTime / 60;
        this.isNight = (hour >= 20 || hour < 6);
        window.isNight = this.isNight; // Maintain global for compatibility

        // --- Weather Particle Emission ---
        if (fx) {
            if (theme === 'snow') {
                fx.emitBlizzard(window.innerWidth, window.innerHeight);
            } else if (theme === 'desert') {
                fx.emitSand(window.innerWidth, window.innerHeight);
            } else if (theme === 'hell') {
                fx.emitEmbers(window.innerWidth, window.innerHeight);
            } else if (theme === 'jungle' || theme === 'temple') {
                fx.emitRain(window.innerWidth, window.innerHeight);
            } else if (theme === 'wilderness') {
                fx.emitMist(window.innerWidth, window.innerHeight);
            }
        }

        // --- Climate & Ambient Calculation ---
        this._updateAmbient(zoneLevel, theme);
    },

    _updateAmbient(zoneLevel, theme) {
        this.flicker = Math.sin(Date.now() / 150) * 8;
        
        // Base Ambient based on time and theme
        if (zoneLevel === 0 || [38, 68, 96, 102].includes(zoneLevel)) {
            this.currentAmbient = 'rgba(0, 0, 10, 0.15)'; // Towns
        } else if (zoneLevel <= 37) {
            // Act 1: Rainy/Stormy
            this.currentAmbient = 'rgba(5, 5, 20, 0.75)';
            if (Math.random() < 0.005) { // Lightning strike
                this.currentAmbient = 'rgba(200, 200, 255, 0.1)';
                this.flicker = 500;
            }
        } else if (zoneLevel <= 67) {
            // Act 2: Sandstorm
            this.currentAmbient = 'rgba(25, 15, 0, 0.70)';
        } else if (zoneLevel <= 95) {
            // Act 3: Foggy Jungle
            this.currentAmbient = 'rgba(10, 25, 10, 0.80)';
        } else if (zoneLevel <= 101) {
            // Act 4: Hell Fire
            this.currentAmbient = 'rgba(35, 5, 0, 0.85)';
        } else if (zoneLevel <= 125) {
            // Act 5: Blizzard
            this.currentAmbient = 'rgba(15, 20, 35, 0.75)';
        } else if (zoneLevel >= 128 || window.riftLevel > 0) {
            // Rift: Void particles
            this.currentAmbient = 'rgba(20, 0, 30, 0.90)';
        } else {
            this.currentAmbient = 'rgba(0, 0, 0, 0.88)';
        }
    },

    renderAtmosphere(renderer, player, camera, zoneLevel, isBossZone) {
        if (!player || !renderer || !camera) return;

        const screen = camera.toScreen(player.x, player.y - 15);
        const baseRadius = (160 + (player.lightRadius || 0));
        
        // Apply lighting based on act/climate
        renderer.applyLighting(screen.x, screen.y, (baseRadius + this.flicker) * camera.zoom, this.currentAmbient);

        // Premium Ambient Lighting Mask (affecting everything)
        this._renderGlobalMask(renderer, player, zoneLevel, isBossZone);
    },

    _renderGlobalMask(renderer, player, zoneLevel, isBossZone) {
        const cx = renderer.width / 2;
        const cy = renderer.height / 2;

        // Dynamic pulsing and gear-based light radius
        const baseRadius = 450 + (player.lightRadius || 0) * 50;
        const pulse = Math.sin(Date.now() * 0.002) * 15;
        const radius = Math.max(100, baseRadius + pulse);

        const grd = renderer.ctx.createRadialGradient(cx, cy, 50, cx, cy, radius);

        // In town or boss room, make it slightly brighter overall
        const minAlpha = (zoneLevel === 0) ? 0.6 : (isBossZone ? 0.8 : 0.95);
        
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, `rgba(0,0,0,${minAlpha})`);

        renderer.ctx.fillStyle = grd;
        renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);
    },

    // Get color based on time of day for UI/Mini-map
    getTimeTint() {
        const hour = this.worldTime / 60;
        let alpha = 0;
        let color = '0, 0, 0';

        if (hour >= 20 || hour < 4) { // Night
            alpha = 0.45;
            color = '0, 0, 30';
        } else if (hour >= 18 && hour < 20) { // Dusk
            alpha = (hour - 18) / 2 * 0.45;
            color = '80, 20, 40';
        } else if (hour >= 4 && hour < 6) { // Dawn
            alpha = (1 - (hour - 4) / 2) * 0.45;
            color = '80, 50, 20';
        }
        
        return { alpha, color };
    }
};
