/**
 * Input Handler — Mouse, Keyboard, Touch
 */
import { bus } from './EventBus.js';

export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.keys = {};
        this._init();
    }

    _init() {
        this.canvas.addEventListener('click', e => this._onCanvasClick(e));
        this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); this._onRightClick(e); });
        this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
        window.addEventListener('keydown', e => this._onKeyDown(e));
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });

        // Touch support
        this.canvas.addEventListener('touchend', e => {
            e.preventDefault();
            const t = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (t.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (t.clientY - rect.top) * (this.canvas.height / rect.height);
            bus.emit('input:click', { screenX: x, screenY: y });
        }, { passive: false });
    }

    _onCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        bus.emit('input:click', { screenX: x, screenY: y, button: e.button });
    }

    _onRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        bus.emit('input:rightclick', { screenX: x, screenY: y });
    }

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    }

    _onKeyDown(e) {
        this.keys[e.code] = true;
        const map = {
            // Potions
            'KeyQ': 'potion:use:0', 'KeyW': 'potion:use:1', 'KeyE': 'potion:use:2', 'KeyR': 'potion:use:3',
            // Skills
            'Digit1': 'skill:use:0', 'Digit2': 'skill:use:1', 'Digit3': 'skill:use:2',
            'Digit4': 'skill:use:3', 'Digit5': 'skill:use:4',

            'KeyI': 'ui:toggle:inventory', 'KeyC': 'ui:toggle:character',
            'Escape': 'ui:closeAll',
            'KeyM': 'ui:toggle:map',
            'Tab': 'ui:toggle:fullmap',
            'KeyF': 'ui:toggle:lootfilter',
            'KeyP': 'action:town_portal',
        };
        if (map[e.code]) {
            e.preventDefault();
            bus.emit(map[e.code], { mouse: this.mouse });
        }
    }

    isDown(code) { return !!this.keys[code]; }
}
