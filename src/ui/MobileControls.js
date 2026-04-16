import { bus } from '../engine/EventBus.js';
import { getSkillMap } from '../data/classes.js';

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

        this.skillButtons = []; // Stores { el, slotIdx, originalIcon }
        this._init();
    }

    _init() {
        // Detect mobile or touch capability
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouch) return;

        this.active = true;
        document.body.classList.add('is-mobile');

        // Force hide desktop HUD buttons immediately
        const desktopHud = document.getElementById('hud-buttons');
        if (desktopHud) desktopHud.style.display = 'none';

        this._createUI();
        this._setupEvents();
    }

    _createUI() {
        // Container
        const container = document.createElement('div');
        container.id = 'mobile-controls';
        container.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1000; user-select:none;';
        document.getElementById('game-screen').appendChild(container);

        // Joystick Base (Left Side)
        const jBase = document.createElement('div');
        jBase.id = 'joystick-base';
        jBase.style.cssText = 'position:absolute; bottom:60px; left:40px; width:100px; height:100px; background:rgba(0,0,0,0.3); border:2px solid rgba(212,175,55,0.3); border-radius:50%; pointer-events:auto; backdrop-filter: blur(2px);';
        container.appendChild(jBase);
        this.joystick.base = jBase;

        // Joystick Stick
        const jStick = document.createElement('div');
        jStick.id = 'joystick-stick';
        jStick.style.cssText = 'position:absolute; top:50%; left:50%; width:44px; height:44px; background:rgba(212,175,55,0.4); border:1px solid rgba(212,175,55,0.6); border-radius:50%; transform:translate(-50%, -50%); transition: none; box-shadow: 0 0 10px rgba(0,0,0,0.5);';
        jBase.appendChild(jStick);
        this.joystick.stick = jStick;

        // Buttons Container (Right side)
        const btnContainer = document.createElement('div');
        btnContainer.id = 'mobile-buttons';
        btnContainer.style.cssText = 'position:absolute; bottom:0; right:0; width:320px; height:320px; pointer-events:none;';
        container.appendChild(btnContainer);

        const skillButtonDefs = [
            { slot: 3, angle: -100, dist: 175, action: 'skill:use:3', icon: 'F' }, // Top Small
            { slot: 2, angle: -125, dist: 175, action: 'skill:use:2', icon: 'R' },
            { slot: 1, angle: -150, dist: 170, action: 'skill:use:1', icon: 'E' },
            { slot: 0, angle: -175, dist: 160, action: 'skill:use:0', icon: 'Q' }, // Far Left
            { slot: 4, angle: -75, dist: 140, action: 'skill:use:4', icon: 'G' },  // Right
            { slot: 'potion', angle: -200, dist: 110, action: 'potion:use:0', icon: '🧪' },
            { slot: 'interact', angle: -140, dist: 90, action: 'action:interact', icon: '⚔️', size: 'large' }
        ];

        skillButtonDefs.forEach(btnDef => {
            const btn = document.createElement('div');
            btn.className = 'mobile-btn';
            btn.innerHTML = `<span>${btnDef.icon}</span>`;

            const rad = (btnDef.angle * Math.PI) / 180;
            const x = Math.cos(rad) * btnDef.dist;
            const y = Math.sin(rad) * btnDef.dist;

            btn.style.cssText = `
                position: absolute;
                bottom: 50px; 
                right: 50px;
                width: 52px; height: 52px; 
                transform: translate(${x}px, ${y}px);
                background: rgba(20, 20, 20, 0.85); 
                border: 2px solid rgba(212,175,55,0.4); 
                border-radius: 50%; 
                display: flex; justify-content: center; align-items: center; 
                font-size: 18px; color: white; 
                pointer-events: auto;
                transition: transform 0.1s, background 0.1s;
                box-shadow: 0 4px 10px rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
            `;

            if (btnDef.size === 'large') {
                btn.style.width = '74px';
                btn.style.height = '74px';
                btn.style.fontSize = '32px';
                btn.style.border = '2px solid var(--gold, #d4af37)';
                btn.style.boxShadow = '0 0 20px rgba(212,175,55,0.2)';
                btn.style.zIndex = '5';
            }

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.style.transform = `translate(${x}px, ${y}px) scale(0.9)`;
                btn.style.background = 'rgba(212,175,55,0.4)';
                bus.emit(btnDef.action, { mouse: this.input.mouse });
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.style.transform = `translate(${x}px, ${y}px) scale(1.0)`;
                btn.style.background = 'rgba(20, 20, 20, 0.85)';
            });

            btnContainer.appendChild(btn);

            if (typeof btnDef.slot === 'number') {
                this.skillButtons.push({ el: btn, slot: btnDef.slot, originalIcon: btnDef.icon });
            } else if (btnDef.slot === 'potion') {
                this.potionButton = btn;
            } else if (btnDef.slot === 'interact') {
                this.interactButton = btn;
            }
        });

        // Toggle UI buttons (Inventory, etc)
        const uiBtnContainer = document.createElement('div');
        uiBtnContainer.id = 'mobile-ui-shortcuts';
        this.uiContainer = uiBtnContainer;

        // Portrait vs Landscape Logic
        const isPortrait = window.innerHeight > window.innerWidth;
        const baseStyle = 'display:flex; gap:12px; pointer-events:auto; padding:8px; background:rgba(0,0,0,0.4); border:1px solid #4a3520; border-radius:12px; backdrop-filter:blur(6px); box-shadow:0 0 20px rgba(0,0,0,0.5);';

        if (isPortrait) {
            uiBtnContainer.style.cssText = `position:absolute; top:120px; left:10px; flex-direction:column; ${baseStyle}`;
        } else {
            uiBtnContainer.style.cssText = `position:absolute; top:10px; left:50%; transform:translateX(-50%); flex-direction:row; ${baseStyle}`;
        }

        container.appendChild(uiBtnContainer);

        const uiButtons = [
            { id: 'inv', action: 'ui:toggle:inventory', icon: '🎒' },
            { id: 'char', action: 'ui:toggle:character', icon: '📊' },
            { id: 'skill', action: 'ui:toggle:talents', icon: '✨' },
            { id: 'ques', action: 'ui:toggle:journal', icon: '⚔️' },
            { id: 'map', action: 'ui:toggle:fullmap', icon: '🗺️' }
        ];

        uiButtons.forEach(btnDef => {
            const btn = document.createElement('div');
            btn.style.cssText = 'width:42px; height:42px; background:rgba(255,255,255,0.05); border:1px solid rgba(212,175,55,0.2); border-radius:8px; display:flex; justify-content:center; align-items:center; font-size:20px; color:white; transition: all 0.2s;';
            btn.innerHTML = btnDef.icon;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.style.background = 'rgba(212,175,55,0.3)';
                btn.style.borderColor = 'rgba(212,175,55,0.8)';
                bus.emit(btnDef.action, {});
            });
            btn.addEventListener('touchend', () => {
                btn.style.background = 'rgba(255,255,255,0.05)';
                btn.style.borderColor = 'rgba(212,175,55,0.2)';
            });
            uiBtnContainer.appendChild(btn);
        });

        // Resize handler for orientation shifts
        window.addEventListener('resize', () => {
            const portrait = window.innerHeight > window.innerWidth;
            if (portrait) {
                this.uiContainer.style.top = '120px';
                this.uiContainer.style.left = '10px';
                this.uiContainer.style.transform = 'none';
                this.uiContainer.style.flexDirection = 'column';
            } else {
                this.uiContainer.style.top = '10px';
                this.uiContainer.style.left = '50%';
                this.uiContainer.style.transform = 'translateX(-50%)';
                this.uiContainer.style.flexDirection = 'row';
            }
        });
    }

    /**
     * Synchronize mobile icons with player's actual equipped skills
     */
    update(player) {
        if (!this.active || !player) return;

        // Use global icon map for perfect 1:1 mirroring with Hero bar
        const getRAIcon = (id) => {
            if (window.getIconForSkill) return window.getIconForSkill(id);
            // Fallback map if needed
            return 'ra-interdiction';
        };

        // Update Skill Buttons
        this.skillButtons.forEach(btnObj => {
            const skillId = player.hotbar[btnObj.slot];
            const span = btnObj.el.querySelector('span');

            if (skillId) {
                const iconClass = getRAIcon(skillId);
                span.innerHTML = `<i class="ra ${iconClass}" style="color:var(--gold, #d4af37); font-size:24px;"></i>`;
                btnObj.el.style.borderColor = 'rgba(212,175,55,0.8)';
                btnObj.el.style.boxShadow = '0 0 10px rgba(212,175,55,0.2)';
            } else {
                span.textContent = btnObj.originalIcon;
                btnObj.el.style.borderColor = 'rgba(212,175,55,0.2)';
                btnObj.el.style.boxShadow = 'none';
            }
        });

        // Update Potion Button
        if (this.potionButton) {
            const firstPotion = player.belt.find(p => p !== null);
            const span = this.potionButton.querySelector('span');
            if (firstPotion) {
                span.innerHTML = '<i class="ra ra-bubbles" style="color:#ff5050; font-size:24px;"></i>';
            } else {
                span.textContent = '🧪';
            }
        }

        // Update Interact/Attack Button based on Weapon
        if (this.interactButton) {
            const weapon = player.equipment.mainhand;
            const span = this.interactButton.querySelector('span');
            if (weapon) {
                const wType = weapon.type?.toLowerCase() || 'sword';
                const iconMap = {
                    'sword': 'ra-sword', 'axe': 'ra-axe', 'mace': 'ra-mace-head',
                    'bow': 'ra-bow-arrow', 'staff': 'ra-crystal-wand', 'wand': 'ra-wand',
                    'polearm': 'ra-halberd', 'shield': 'ra-heavy-shield'
                };
                const icon = iconMap[wType] || 'ra-crossed-swords';
                span.innerHTML = `<i class="ra ${icon}" style="color:var(--gold, #d4af37); font-size:32px;"></i>`;
                this.interactButton.style.borderColor = '#bf642f';
            } else {
                span.innerHTML = '<i class="ra ra-hand" style="color:#aaa; font-size:30px;"></i>';
                this.interactButton.style.borderColor = 'rgba(212,175,55,0.4)';
            }
        }
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
