/**
 * Input Handler — Mouse, Keyboard, Touch, Gamepad
 */
import { bus } from './EventBus.js';

export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.keys = {};
        this.gamepadState = {
            axes: [0, 0, 0, 0], // L_X, L_Y, R_X, R_Y
            buttons: {},
            connected: false
        };
        this._prevButtons = {};
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

        window.addEventListener('gamepadconnected', () => { this.gamepadState.connected = true; });
        window.addEventListener('gamepaddisconnected', () => { this.gamepadState.connected = false; });
    }

    update() {
        if (!this.gamepadState.connected) return;
        const gp = navigator.getGamepads()[0];
        if (!gp) return;

        // Deadzone helper
        const applyDeadzone = (val, threshold = 0.2) => Math.abs(val) > threshold ? val : 0;

        this.gamepadState.axes = [
            applyDeadzone(gp.axes[0]), applyDeadzone(gp.axes[1]), // Left Stick (Movement)
            applyDeadzone(gp.axes[2]), applyDeadzone(gp.axes[3])  // Right Stick (Aiming)
        ];

        // Map buttons
        const buttonMap = {
            0: 'skill:use:0', // A / Cross
            1: 'skill:use:1', // B / Circle
            2: 'skill:use:2', // X / Square
            3: 'skill:use:3', // Y / Triangle
            5: 'skill:use:4', // R1
            4: 'potion:use:0', // L1
            12: 'ui:toggle:inventory', // D-pad Up
            13: 'ui:toggle:character', // D-pad Down
            14: 'ui:toggle:talents', // D-pad Left
            9: 'ui:closeAll' // Start / Options
        };

        for (let i = 0; i < gp.buttons.length; i++) {
            const isPressed = gp.buttons[i].pressed;
            if (isPressed && !this._prevButtons[i]) {
                const action = buttonMap[i];
                if (action) bus.emit(action, { mouse: this.mouse });
                
                // Interact button (A) also simulates click if right stick is not aiming
                if (i === 0 && this.gamepadState.axes[2] === 0 && this.gamepadState.axes[3] === 0) {
                    // Send a generic interact click at center of screen (player pos)
                    // We'll let player logic handle gamepad interactions
                }
            }
            this._prevButtons[i] = isPressed;
        }
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
            'KeyO': 'ui:toggle:mercenary', 'KeyT': 'ui:toggle:talents',
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
