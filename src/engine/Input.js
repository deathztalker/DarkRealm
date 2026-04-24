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
            axes: [0, 0, 0, 0],
            connected: false
        };
        
        // Mobile Support
        this.touchStick = { active: false, startX: 0, startY: 0, curX: 0, curY: 0, stickX: 0, stickY: 0 };
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this._prevButtons = {};
        this._init();
    }

    _init() {
        this.canvas.addEventListener('click', e => this._onCanvasClick(e));
        this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); this._onRightClick(e); });
        this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
        window.addEventListener('keydown', e => this._onKeyDown(e));
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });

        // Enhanced Touch Support (Joystick & Action Buttons)
        this.canvas.addEventListener('touchstart', e => this._onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', e => this._onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', e => this._onTouchEnd(e), { passive: false });

        if (this.isMobile) this._createMobileUI();
        
        // Virtual Cursor Element
        this.cursorEl = document.createElement('div');
        this.cursorEl.id = 'virtual-cursor';
        this.cursorEl.style.cssText = 'position:fixed; width:12px; height:12px; background:white; border:2px solid gold; border-radius:50%; pointer-events:none; z-index:99999; display:none; transform:translate(-50%,-50%); box-shadow: 0 0 10px gold;';
        document.body.appendChild(this.cursorEl);

        window.addEventListener('gamepadconnected', () => { this.gamepadState.connected = true; });
        window.addEventListener('gamepaddisconnected', () => { this.gamepadState.connected = false; });
    }

    vibrate(pattern) {
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        if (this.gamepadState.connected) {
            this.cursorEl.style.display = 'block';
            this.cursorEl.style.left = e.clientX + 'px';
            this.cursorEl.style.top = e.clientY + 'px';
        } else {
            this.cursorEl.style.display = 'none';
        }
    }

    _onCanvasClick(e) {
        bus.emit('input:click', { screenX: this.mouse.x, screenY: this.mouse.y });
    }

    _onRightClick(e) {
        bus.emit('input:rightclick', { screenX: this.mouse.x, screenY: this.mouse.y });
    }

    _onKeyDown(e) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        this.keys[e.code] = true;
        
        const uiMap = { 'KeyI': 'ui:toggle:inventory', 'KeyC': 'ui:toggle:character', 'KeyT': 'ui:toggle:talents', 'KeyM': 'ui:toggle:minimap' };
        if (uiMap[e.code]) {
            e.preventDefault();
            bus.emit(uiMap[e.code], { mouse: this.mouse });
        }
    }

    isDown(code) { 
        if (this._isInputBlocked()) return false;
        if (this.touchStick.active) {
            if (code === 'KeyW' && this.touchStick.stickY < -0.3) return true;
            if (code === 'KeyS' && this.touchStick.stickY > 0.3) return true;
            if (code === 'KeyA' && this.touchStick.stickX < -0.3) return true;
            if (code === 'KeyD' && this.touchStick.stickX > 0.3) return true;
        }
        return !!this.keys[code]; 
    }

    _isInputBlocked() {
        return document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
    }

    _onTouchStart(e) {
        const t = e.touches[0];
        if (t.clientX < window.innerWidth / 2) {
            this.touchStick.active = true;
            this.touchStick.startX = t.clientX;
            this.touchStick.startY = t.clientY;
            this.touchStick.curX = t.clientX;
            this.touchStick.curY = t.clientY;
            this._updateJoystickUI();
        } else {
            const rect = this.canvas.getBoundingClientRect();
            const x = (t.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (t.clientY - rect.top) * (this.canvas.height / rect.height);
            bus.emit('input:click', { screenX: x, screenY: y });
        }
    }

    _onTouchMove(e) {
        if (!this.touchStick.active) return;
        const t = Array.from(e.touches).find(t => t.clientX < window.innerWidth / 2);
        if (t) {
            this.touchStick.curX = t.clientX;
            this.touchStick.curY = t.clientY;
            const dx = this.touchStick.curX - this.touchStick.startX;
            const dy = this.touchStick.curY - this.touchStick.startY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const maxLen = 50;
            this.touchStick.stickX = dx / Math.max(dist, maxLen);
            this.touchStick.stickY = dy / Math.max(dist, maxLen);
            if (dist > maxLen) {
                this.touchStick.curX = this.touchStick.startX + (dx/dist) * maxLen;
                this.touchStick.curY = this.touchStick.startY + (dy/dist) * maxLen;
            }
            this._updateJoystickUI();
        }
    }

    _onTouchEnd(e) {
        if (e.touches.length === 0 || !Array.from(e.touches).some(t => t.clientX < window.innerWidth / 2)) {
            this.touchStick.active = false;
            this.touchStick.stickX = 0;
            this.touchStick.stickY = 0;
            this._updateJoystickUI();
        }
    }

    _updateJoystickUI() {
        const base = document.getElementById('joy-base');
        const stick = document.getElementById('joy-stick');
        if (!base || !stick) return;
        if (this.touchStick.active) {
            base.style.display = 'block';
            base.style.left = `${this.touchStick.startX}px`;
            base.style.top = `${this.touchStick.startY}px`;
            stick.style.left = `${this.touchStick.curX - this.touchStick.startX + 27}px`;
            stick.style.top = `${this.touchStick.curY - this.touchStick.startY + 27}px`;
        } else {
            base.style.display = 'none';
        }
    }

    _createMobileUI() {
        if (document.getElementById('mobile-ui')) return;
        const container = document.createElement('div');
        container.id = 'mobile-ui';
        container.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:20000;';
        container.innerHTML = `
            <div id="joy-base" style="position:absolute; bottom:120px; left:60px; width:100px; height:100px; background:rgba(255,255,255,0.05); border:2px solid rgba(255,255,255,0.2); border-radius:50%; pointer-events:auto; touch-action:none;">
                <div id="joy-stick" style="position:absolute; width:45px; height:45px; background:rgba(255,255,255,0.3); border-radius:50%; left:27px; top:27px; pointer-events:none;"></div>
            </div>
            <div id="mobile-actions" style="position:absolute; bottom:40px; right:40px; display:grid; grid-template-areas: '. pot .' 's1 atk s2' '. dash .'; gap:15px; pointer-events:auto; transform: scale(1.1);">
                <button id="btn-m-pot" style="grid-area:pot; width:50px; height:50px; border-radius:50%; background:rgba(255,0,0,0.2); border:1px solid #ff0000; color:#ffaaaa; font-size:10px;">POT</button>
                <button id="btn-m-s1" style="grid-area:s1; width:55px; height:55px; border-radius:50%; background:rgba(0,200,255,0.2); border:1px solid #00c8ff; color:#fff;">S1</button>
                <button id="btn-m-atk" style="grid-area:atk; width:85px; height:85px; border-radius:50%; background:rgba(255,255,255,0.15); border:3px solid #fff; color:#fff; font-weight:bold; font-size:16px; box-shadow: 0 0 15px rgba(255,255,255,0.3);">ATK</button>
                <button id="btn-m-s2" style="grid-area:s2; width:55px; height:55px; border-radius:50%; background:rgba(255,100,0,0.2); border:1px solid #ff6400; color:#fff;">S2</button>
                <button id="btn-m-dash" style="grid-area:dash; width:65px; height:65px; border-radius:50%; background:rgba(255,255,255,0.1); border:2px solid rgba(255,255,255,0.6); color:#fff; font-size:12px;">DASH</button>
            </div>
            <div id="mobile-menu-btns" style="position:absolute; top:15px; right:15px; display:flex; gap:10px; pointer-events:auto;">
                <button onclick="bus.emit('ui:toggle', 'inventory')" style="width:40px; height:40px; background:rgba(0,0,0,0.6); border:1px solid #daa520; color:#daa520; border-radius:4px;">INV</button>
                <button onclick="bus.emit('ui:toggle', 'character')" style="width:40px; height:40px; background:rgba(0,0,0,0.6); border:1px solid #daa520; color:#daa520; border-radius:4px;">CHR</button>
            </div>
        `;
        document.body.appendChild(container);
        const preventDefault = (e) => { e.preventDefault(); e.stopPropagation(); };
        const btnAtk = document.getElementById('btn-m-atk');
        btnAtk.ontouchstart = (e) => { preventDefault(e); bus.emit('input:click', { isMobileAtk: true }); };
        document.getElementById('btn-m-dash').ontouchstart = (e) => { preventDefault(e); bus.emit('skill:use:dash'); };
        document.getElementById('btn-m-s1').ontouchstart = (e) => { preventDefault(e); bus.emit('skill:use:0', { mouse: this.mouse }); };
        document.getElementById('btn-m-s2').ontouchstart = (e) => { preventDefault(e); bus.emit('skill:use:1', { mouse: this.mouse }); };
        document.getElementById('btn-m-pot').ontouchstart = (e) => { preventDefault(e); bus.emit('potion:use:0'); };
        window.addEventListener('resize', () => this._adjustLayoutForOrientation());
        this._adjustLayoutForOrientation();
    }

    _adjustLayoutForOrientation() {
        const actions = document.getElementById('mobile-actions');
        const joy = document.getElementById('joy-base');
        if (!actions || !joy) return;
        if (window.innerHeight > window.innerWidth) {
            actions.style.bottom = '100px'; actions.style.right = '20px'; actions.style.transform = 'scale(0.85)';
            joy.style.bottom = '100px'; joy.style.left = '60px'; joy.style.transform = 'scale(0.85)';
        } else {
            actions.style.bottom = '30px'; actions.style.right = '40px'; actions.style.transform = 'scale(1.1)';
            joy.style.bottom = '40px'; joy.style.left = '80px'; joy.style.transform = 'scale(1.1)';
        }
    }

    update() {
        if (this.gamepadState.connected) {
            const pads = navigator.getGamepads();
            const pad = pads[0];
            if (pad) {
                this.gamepadState.axes = [pad.axes[0], pad.axes[1], pad.axes[2], pad.axes[3]];
                pad.buttons.forEach((btn, idx) => {
                    const pressed = btn.pressed;
                    const prev = this._prevButtons[idx];
                    if (pressed && !prev) bus.emit('gamepad:button', { index: idx });
                    this._prevButtons[idx] = pressed;
                });
            }
        }
    }
}
