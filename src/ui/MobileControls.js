/**
 * Mobile Controls — Virtual Joystick and Skill Buttons
 */
import { bus } from '../engine/EventBus.js';

export class MobileControls {
    constructor(input) {
        this.input = input; // Reference to Input handler to set keys
        this.active = false;
        
        this.joystick = {
            base: null,
            stick: null,
            active: false,
            identifier: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            maxRadius: 40
        };

        this.buttons = [];
        this._init();
    }

    _init() {
        // Detect mobile or touch capability
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouch) return;

        this.active = true;
        this._createUI();
        this._setupEvents();
    }

    _createUI() {
        // Container
        const container = document.createElement('div');
        container.id = 'mobile-controls';
        container.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1000; user-select:none;';
        document.getElementById('game-screen').appendChild(container);

        // Joystick Base
        const jBase = document.createElement('div');
        jBase.id = 'joystick-base';
        jBase.style.cssText = 'position:absolute; bottom:40px; left:40px; width:100px; height:100px; background:rgba(255,255,255,0.1); border:2px solid rgba(255,255,255,0.2); border-radius:50%; pointer-events:auto;';
        container.appendChild(jBase);
        this.joystick.base = jBase;

        // Joystick Stick
        const jStick = document.createElement('div');
        jStick.id = 'joystick-stick';
        jStick.style.cssText = 'position:absolute; top:50%; left:50%; width:40px; height:40px; background:rgba(255,255,255,0.3); border-radius:50%; transform:translate(-50%, -50%); transition: none;';
        jBase.appendChild(jStick);
        this.joystick.stick = jStick;

        // Buttons Container (Right side)
        const btnContainer = document.createElement('div');
        btnContainer.id = 'mobile-buttons';
        btnContainer.style.cssText = 'position:absolute; bottom:40px; right:40px; display:grid; grid-template-columns: repeat(3, 60px); gap:15px; pointer-events:auto;';
        container.appendChild(btnContainer);

        const skillButtons = [
            { label: 'Q', action: 'skill:use:0', icon: '🔥', grid: '1 / 2' },
            { label: 'E', action: 'skill:use:1', icon: '❄️', grid: '1 / 3' },
            { label: 'R', action: 'skill:use:2', icon: '⚡', grid: '2 / 3' },
            { label: 'F', action: 'skill:use:3', icon: '💀', grid: '3 / 3' },
            { label: 'G', action: 'skill:use:4', icon: '🛡️', grid: '3 / 2' },
            { label: '1', action: 'potion:use:0', icon: '🧪', grid: '2 / 1' },
            { label: 'Interact', action: 'action:interact', icon: '✋', grid: '3 / 1', size: 'large' }
        ];

        skillButtons.forEach(btnDef => {
            const btn = document.createElement('div');
            btn.className = 'mobile-btn';
            btn.innerHTML = `<span>${btnDef.icon}</span>`;
            btn.style.cssText = `
                width: 60px; height: 60px; 
                background: rgba(0,0,0,0.5); 
                border: 2px solid rgba(212,175,55,0.5); 
                border-radius: 50%; 
                display: flex; justify-content: center; align-items: center; 
                font-size: 24px; color: white; 
                grid-area: ${btnDef.grid};
                active { background: rgba(212,175,55,0.3); }
            `;
            
            if (btnDef.size === 'large') {
                btn.style.width = '70px';
                btn.style.height = '70px';
                btn.style.fontSize = '30px';
                btn.style.border = '3px solid var(--gold, #d4af37)';
            }

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.style.background = 'rgba(212,175,55,0.5)';
                bus.emit(btnDef.action, { mouse: this.input.mouse });
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.style.background = 'rgba(0,0,0,0.5)';
            });

            btnContainer.appendChild(btn);
        });

        // Toggle UI buttons (Inventory, etc)
        const uiBtnContainer = document.createElement('div');
        uiBtnContainer.style.cssText = 'position:absolute; top:10px; left:10px; display:flex; gap:10px; pointer-events:auto;';
        container.appendChild(uiBtnContainer);

        const uiButtons = [
            { label: 'I', action: 'ui:toggle:inventory', icon: '🎒' },
            { label: 'C', action: 'ui:toggle:character', icon: '📊' },
            { label: 'T', action: 'ui:toggle:talents', icon: '✨' },
            { label: 'J', action: 'ui:toggle:journal', icon: '⚔️' },
            { label: 'A', action: 'ui:toggle:achievements', icon: '🏆' },
            { label: 'M', action: 'ui:toggle:fullmap', icon: '🗺️' }
        ];

        uiButtons.forEach(btnDef => {
            const btn = document.createElement('div');
            btn.style.cssText = 'width:40px; height:40px; background:rgba(0,0,0,0.5); border:1px solid #444; border-radius:4px; display:flex; justify-content:center; align-items:center; font-size:18px; color:white;';
            btn.innerHTML = btnDef.icon;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                bus.emit(btnDef.action, {});
            });
            uiBtnContainer.appendChild(btn);
        });
    }

    _setupEvents() {
        if (!this.joystick.base) return;

        this.joystick.base.addEventListener('touchstart', e => {
            e.preventDefault();
            const touch = e.targetTouches[0];
            this.joystick.active = true;
            this.joystick.identifier = touch.identifier;
            const rect = this.joystick.base.getBoundingClientRect();
            this.joystick.startX = rect.left + rect.width / 2;
            this.joystick.startY = rect.top + rect.height / 2;
        });

        window.addEventListener('touchmove', e => {
            if (!this.joystick.active) return;
            
            let touch = null;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.identifier) {
                    touch = e.changedTouches[i];
                    break;
                }
            }
            if (!touch) return;

            const dx = touch.clientX - this.joystick.startX;
            const dy = touch.clientY - this.joystick.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            const limitedDistance = Math.min(distance, this.joystick.maxRadius);
            this.joystick.currentX = Math.cos(angle) * limitedDistance;
            this.joystick.currentY = Math.sin(angle) * limitedDistance;

            this.joystick.stick.style.transform = `translate(calc(-50% + ${this.joystick.currentX}px), calc(-50% + ${this.joystick.currentY}px))`;

            // Update Input keys based on joystick position
            const threshold = 0.3;
            const normalizedX = this.joystick.currentX / this.joystick.maxRadius;
            const normalizedY = this.joystick.currentY / this.joystick.maxRadius;

            this.input.keys['KeyW'] = normalizedY < -threshold;
            this.input.keys['KeyS'] = normalizedY > threshold;
            this.input.keys['KeyA'] = normalizedX < -threshold;
            this.input.keys['KeyD'] = normalizedX > threshold;
            
            // For diagonal movement, we might want to be more lenient or strict
        }, { passive: false });

        window.addEventListener('touchend', e => {
            let touchFound = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.identifier) {
                    touchFound = true;
                    break;
                }
            }
            if (!touchFound) return;

            this.joystick.active = false;
            this.joystick.identifier = null;
            this.joystick.currentX = 0;
            this.joystick.currentY = 0;
            this.joystick.stick.style.transform = 'translate(-50%, -50%)';

            // Reset keys
            this.input.keys['KeyW'] = false;
            this.input.keys['KeyS'] = false;
            this.input.keys['KeyA'] = false;
            this.input.keys['KeyD'] = false;
        });
    }
}
