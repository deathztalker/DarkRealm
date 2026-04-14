import { bus } from './EventBus.js';

let ctx = null;
const soundCache = new Map();

async function loadSound(url) {
    if (soundCache.has(url)) return soundCache.get(url);
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        soundCache.set(url, audioBuffer);
        return audioBuffer;
    } catch (e) {
        console.error(`Failed to load sound: ${url}`, e);
        return null;
    }
}

export async function playCustomSound(url, volume = 0.4) {
    if (!ctx) return;
    const buffer = await loadSound(url);
    if (!buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
}

export function initAudio() {
    if (ctx) return;
    try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        bus.on('combat:damage', d => {
            if (!d.target?.isPlayer) {
                if (d.dealt > 0) playHit(d.isCrit);
            } else {
                playPlayerHit();
            }
        });

        bus.on('boss:death', d => {
            if (d.name === 'Angry Jano') {
                playCustomSound('src/audio/1281081413847744672.ogg', 0.8);
            }
        });

        bus.on('skill:used', d => {
            const types = { fire: playCastFire, cold: playCastCold, lightning: playCastLightning, poison: playCastPoison, shadow: playCastShadow };
            if (types[d.type]) types[d.type]();
            else playCast();
        });
        bus.on('potion:drink', () => playPotion());
        bus.on('level_up', () => playLevelUp());
        bus.on('item:pickup', () => playLoot());
        bus.on('gold:pickup', () => playGold());
        bus.on('ui:click', () => playClick());
        bus.on('item:move', () => playItemMove());
        bus.on('cube:transmute', () => playTransmute());
        bus.on('ui:error', () => playError());
    } catch (e) {
        console.warn("AudioContext not supported or blocked", e);
    }
}

export function playHit(isCrit) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = isCrit ? 'square' : 'sawtooth';
    // Add 10% pitch variation for more organic feel
    const pitchMod = 0.9 + Math.random() * 0.2;
    osc.frequency.setValueAtTime((isCrit ? 200 : 120) * pitchMod, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

export function playPlayerHit() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
}

export function playCast() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

export function playLoot() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

export function playGold() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

export function playPotion() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
}

export function playLevelUp() {
    if (!ctx) return;
    const freqs = [440, 554.37, 659.25, 880]; // A4 C#5 E5 A5 (A Major)
    freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.05, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.6);
    });
}

// Spell-type-specific sounds
export function playCastFire() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const noise = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
    noise.type = 'square';
    noise.frequency.setValueAtTime(60, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain); noise.connect(gain); gain.connect(ctx.destination);
    osc.start(); noise.start();
    osc.stop(ctx.currentTime + 0.25); noise.stop(ctx.currentTime + 0.25);
}

export function playCastCold() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
}

export function playCastLightning() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
}

export function playCastPoison() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 8;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); lfo.start();
    osc.stop(ctx.currentTime + 0.25); lfo.stop(ctx.currentTime + 0.25);
}

export function playCastShadow() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
}

export function playZoneTransition() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1.0);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 1.0);
}

export function playDeathSfx() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
}

// ─── UI & INTERACTION SFX ───
export function playClick() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
}

export function playItemMove() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
}

export function playTransmute() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
}

export function playError() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
}

// ─── AMBIENT AUDIO ───
let ambientOsc = null;
let ambientGain = null;
let ambientLfo = null;
let ambientLfoGain = null;

export function stopAmbient() {
    if (ambientOsc) {
        try { ambientOsc.stop(); ambientOsc.disconnect(); } catch {}
        ambientOsc = null;
    }
    if (ambientLfo) {
        try { ambientLfo.stop(); ambientLfo.disconnect(); } catch {}
        ambientLfo = null;
    }
    if (ambientGain) {
        try { ambientGain.disconnect(); } catch {}
        ambientGain = null;
    }
}

export function startAmbientDungeon() {
    if (!ctx) return;
    stopAmbient();
    
    ambientOsc = ctx.createOscillator();
    ambientGain = ctx.createGain();
    ambientLfo = ctx.createOscillator();
    ambientLfoGain = ctx.createGain();

    // Dark low drone
    ambientOsc.type = 'sine';
    ambientOsc.frequency.value = 55; // Low A
    
    // Slow volume pulsing (wind-like)
    ambientLfo.type = 'sine';
    ambientLfo.frequency.value = 0.1; // 10 second cycle
    
    ambientGain.gain.value = 0.05; // Base low volume
    
    ambientLfoGain.gain.value = 0.03; // Modulation depth
    ambientLfo.connect(ambientLfoGain);
    ambientLfoGain.connect(ambientGain.gain);

    ambientOsc.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientOsc.start();
    ambientLfo.start();
}

export function startAmbientBoss() {
    if (!ctx) return;
    stopAmbient();
    
    ambientOsc = ctx.createOscillator();
    ambientGain = ctx.createGain();
    ambientLfo = ctx.createOscillator();
    ambientLfoGain = ctx.createGain();

    // Heartbeat/tense drone
    ambientOsc.type = 'triangle';
    ambientOsc.frequency.value = 60;
    
    // Fast pulsing
    ambientLfo.type = 'square';
    ambientLfo.frequency.value = 1.5; // 1.5 Hz heartbeat
    
    ambientGain.gain.value = 0.04;
    
    ambientLfoGain.gain.value = 0.04;
    ambientLfo.connect(ambientLfoGain);
    ambientLfoGain.connect(ambientGain.gain);

    ambientOsc.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientOsc.start();
    ambientLfo.start();
}
