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

        // Virtual Cursor Element
        this.cursorEl = document.createElement('div');
        this.cursorEl.id = 'gamepad-cursor';
        this.cursorEl.style.cssText = 'position:fixed; width:20px; height:20px; background:radial-gradient(circle, rgba(216,176,104,0.8) 0%, transparent 60%); border-radius:50%; pointer-events:none; z-index:10000; display:none; transform:translate(-50%, -50%); transition: opacity 0.1s;';
        document.body.appendChild(this.cursorEl);
        this.cursorX = window.innerWidth / 2;
        this.cursorY = window.innerHeight / 2;

        // Clear all keys when window loses focus to prevent stuck movement
        window.addEventListener('blur', () => {
            this.keys = {};
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.keys = {};
        });
    }

    update() {
        if (!this.gamepadState.connected) return;
        const gp = navigator.getGamepads()[0];
        if (!gp) return;

        // Deadzone helper
        const applyDeadzone = (val, threshold = 0.25) => Math.abs(val) > threshold ? val : 0;

        this.gamepadState.axes = [
            applyDeadzone(gp.axes[0]), applyDeadzone(gp.axes[1]), // Left Stick (Movement)
            applyDeadzone(gp.axes[2]), applyDeadzone(gp.axes[3])  // Right Stick (Aiming)
        ];

        // Check if any UI panel is open
        const isUiOpen = document.querySelectorAll('.panel:not(.hidden)').length > 0;
        
        if (isUiOpen) {
            this.cursorEl.style.display = 'block';
            const speed = 12; // Virtual cursor speed
            this.cursorX += this.gamepadState.axes[0] * speed;
            this.cursorY += this.gamepadState.axes[1] * speed;
            
            // Constrain to window
            this.cursorX = Math.max(0, Math.min(window.innerWidth, this.cursorX));
            this.cursorY = Math.max(0, Math.min(window.innerHeight, this.cursorY));
            
            this.cursorEl.style.left = `${this.cursorX}px`;
            this.cursorEl.style.top = `${this.cursorY}px`;
            
            // Sync mouse pos to virtual cursor so tooltips work
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (this.cursorX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (this.cursorY - rect.top) * (this.canvas.height / rect.height);
            
            // Hover events simulation for tooltips
            const el = document.elementFromPoint(this.cursorX, this.cursorY);
            if (el && el !== this._lastHovered) {
                if (this._lastHovered) this._lastHovered.dispatchEvent(new MouseEvent('mouseleave'));
                el.dispatchEvent(new MouseEvent('mouseenter'));
                this._lastHovered = el;
            }
            if (el) el.dispatchEvent(new MouseEvent('mousemove', { clientX: this.cursorX, clientY: this.cursorY }));
        } else {
            this.cursorEl.style.display = 'none';
            if (this._lastHovered) {
                this._lastHovered.dispatchEvent(new MouseEvent('mouseleave'));
                this._lastHovered = null;
            }
        }

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
                
                if (isUiOpen) {
                    if (i === 0) { // A button
                        const el = document.elementFromPoint(this.cursorX, this.cursorY);
                        if (el) el.click();
                    } else if (i === 1 || i === 9) { // B or Start closes UI
                        bus.emit('ui:closeAll', {});
                    }
                } else {
                    const action = buttonMap[i];
                    if (action) bus.emit(action, { mouse: this.mouse });
                }
                
                // Interact button (A) also simulates click if right stick is not aiming and not in UI
                if (!isUiOpen && i === 0 && this.gamepadState.axes[2] === 0 && this.gamepadState.axes[3] === 0) {
                    // Send a generic interact click at center of screen (player pos)
                    bus.emit('input:click', { screenX: this.canvas.width/2, screenY: this.canvas.height/2, button: 0 });
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

    _isInputBlocked() {
        const activeEl = document.activeElement;
        const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
        
        return isTyping;
    }

    _onKeyDown(e) {
        const isRepeat = e.repeat;
        this.keys[e.code] = true;

        // Escape always works to close panels/clear focus
        if (e.code === 'Escape') {
            if (isRepeat) return;
            bus.emit('ui:closeAll', {});
            if (document.activeElement) document.activeElement.blur();
            return;
        }

        // --- WASD & Combat Hotkeys: Block if typing or UI is open ---
        const isBlocked = this._isInputBlocked();
        const map = {
            // Potions (Shift+1, etc. or just keep Q,W,E,R for pots if 1-5 are skills. Let's use Z,X,C,V for potions)
            'KeyZ': 'potion:use:0', 'KeyX': 'potion:use:1', 'KeyC': 'potion:use:2', 'KeyV': 'potion:use:3',
            // Skills (1, 2, 3, 4, 5 AND Q, E, R, F, G)
            'Digit1': 'skill:use:0', 'Digit2': 'skill:use:1', 'Digit3': 'skill:use:2',
            'Digit4': 'skill:use:3', 'Digit5': 'skill:use:4',
            'KeyQ': 'skill:use:0', 'KeyE': 'skill:use:1', 'KeyR': 'skill:use:2',
            'KeyF': 'skill:use:3', 'KeyG': 'skill:use:4',

            'KeyP': 'action:town_portal',
            'Space': 'action:interact',
        };

        if (map[e.code]) {
            if (isBlocked) return;
            e.preventDefault();
            bus.emit(map[e.code], { mouse: this.mouse });
            return;
        }

        // --- UI Toggle Hotkeys: Allow through even if UI is open (for toggling), but block repeat ---
        const uiMap = {
            'KeyI': 'ui:toggle:inventory', 
            'KeyB': 'ui:toggle:character',
            'KeyO': 'ui:toggle:mercenary', 
            'KeyK': 'ui:toggle:social',
            'KeyT': 'ui:toggle:talents',
            'KeyJ': 'ui:toggle:journal', 
            'KeyH': 'ui:toggle:achievements',
            'KeyM': 'ui:toggle:map',
            'Tab': 'ui:toggle:fullmap',
            'KeyL': 'ui:toggle:lootfilter',
            'KeyN': 'ui:toggle:stash',
            'KeyU': 'ui:toggle:cube',
        };

        if (uiMap[e.code]) {
            if (isRepeat) return;
            // Only block if typing, NOT if a panel is open (so we can toggle it close)
            const activeEl = document.activeElement;
            const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
            if (isTyping) return;

            e.preventDefault();
            bus.emit(uiMap[e.code], { mouse: this.mouse });
        }
    }

    isDown(code) { 
        // Stop movement/input if UI is open
        if (this._isInputBlocked()) return false;
        return !!this.keys[code]; 
    }
}
