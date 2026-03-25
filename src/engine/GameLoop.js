/**
 * GameLoop — Main requestAnimationFrame loop with fixed timestep physics.
 * Uses delta-time capped at 100ms to prevent spiral-of-death.
 */
export default class GameLoop {
    constructor() {
        this.running = false;
        this.lastTime = 0;
        this.accumulated = 0;
        this.fixedStep = 1000 / 60; // 60Hz physics
        this._onUpdate = null;
        this._onRender = null;
        this._rafId = null;
        this.totalTime = 0;
        this.fps = 0;
        this._fpsCount = 0;
        this._fpsTimer = 0;
    }

    start(onUpdate, onRender) {
        this._onUpdate = onUpdate;
        this._onRender = onRender;
        this.running = true;
        this.lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._tick.bind(this));
    }

    stop() {
        this.running = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
    }

    _tick(now) {
        if (!this.running) return;
        let dt = Math.min(now - this.lastTime, 100); // cap delta
        this.lastTime = now;
        this.totalTime += dt;

        // FPS counter
        this._fpsCount++;
        this._fpsTimer += dt;
        if (this._fpsTimer >= 1000) {
            this.fps = this._fpsCount;
            this._fpsCount = 0;
            this._fpsTimer -= 1000;
        }

        // Fixed timestep updates
        this.accumulated += dt;
        while (this.accumulated >= this.fixedStep) {
            if (this._onUpdate) this._onUpdate(this.fixedStep / 1000); // seconds
            this.accumulated -= this.fixedStep;
        }

        const alpha = this.accumulated / this.fixedStep;
        if (this._onRender) this._onRender(alpha, dt);

        this._rafId = requestAnimationFrame(this._tick.bind(this));
    }
}
