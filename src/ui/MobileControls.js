import { bus } from '../engine/EventBus.js';
import { getSkillMap } from '../data/classes.js';

export class MobileControls {
    constructor(input) {
        this.input = input; 
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

        this.skillButtons = []; 
        this._init();
    }

    _init() {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouch) return;

        this.active = true;
        document.body.classList.add('is-mobile');

        const desktopHud = document.getElementById('hud-buttons');
        if (desktopHud) desktopHud.style.display = 'none';

        this._createUI();
        this._setupEvents();
    }

    _createUI() {
        const container = document.createElement('div');
        container.id = 'mobile-controls';
        container.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1000; user-select:none;';
        document.getElementById('game-screen').appendChild(container);

        // Joystick
        const jBase = document.createElement('div');
        jBase.id = 'joystick-base';
        jBase.style.cssText = 'position:absolute; bottom:calc(60px * var(--mobile-ui-scale)); left:calc(40px * var(--mobile-ui-scale)); width:calc(100px * var(--mobile-ui-scale)); height:calc(100px * var(--mobile-ui-scale)); background:rgba(0,0,0,0.3); border:2px solid rgba(212,175,55,0.3); border-radius:50%; pointer-events:auto; backdrop-filter: blur(2px);';
        container.appendChild(jBase);
        this.joystick.base = jBase;

        const jStick = document.createElement('div');
        jStick.id = 'joystick-stick';
        jStick.style.cssText = 'position:absolute; top:50%; left:50%; width:calc(44px * var(--mobile-ui-scale)); height:calc(44px * var(--mobile-ui-scale)); background:rgba(212,175,55,0.4); border:1px solid rgba(212,175,55,0.6); border-radius:50%; transform:translate(-50%, -50%); transition: none; box-shadow: 0 0 10px rgba(0,0,0,0.5);';
        jBase.appendChild(jStick);
        this.joystick.stick = jStick;

        // Skill Buttons
        const btnContainer = document.createElement('div');
        btnContainer.id = 'mobile-buttons';
        btnContainer.style.cssText = 'position:absolute; bottom:0; right:0; width:calc(320px * var(--mobile-ui-scale)); height:calc(320px * var(--mobile-ui-scale)); pointer-events:none;';
        container.appendChild(btnContainer);

        const skillButtonDefs = [
            { slot: 3, angle: -100, dist: 175, action: 'skill:use:3', icon: 'F' },
            { slot: 2, angle: -125, dist: 175, action: 'skill:use:2', icon: 'R' },
            { slot: 1, angle: -150, dist: 170, action: 'skill:use:1', icon: 'E' },
            { slot: 0, angle: -175, dist: 160, action: 'skill:use:0', icon: 'Q' },
            { slot: 4, angle: -75, dist: 140, action: 'skill:use:4', icon: 'G' },
            { slot: 'potion', angle: -200, dist: 110, action: 'potion:use:0', icon: '🧪' },
            { slot: 'interact', angle: -140, dist: 90, action: 'action:interact', icon: '⚔️', size: 'large' }
        ];

        skillButtonDefs.forEach(btnDef => {
            const btn = document.createElement('div');
            btn.className = 'mobile-btn';
            btn.innerHTML = `<span>${btnDef.icon}</span>`;
            const btnBaseSize = btnDef.size === 'large' ? 74 : 52;
            const btnSize = `calc(${btnBaseSize}px * var(--mobile-ui-scale))`;
            const btnFontSize = btnDef.size === 'large' ? 'calc(32px * var(--mobile-ui-scale))' : 'calc(18px * var(--mobile-ui-scale))';
            const dist = `calc(${btnDef.dist}px * var(--mobile-ui-scale))`;
            const rad = (btnDef.angle * Math.PI) / 180;
            
            btn.style.cssText = `position: absolute; bottom: calc(50px * var(--mobile-ui-scale)); right: calc(50px * var(--mobile-ui-scale)); width: ${btnSize}; height: ${btnSize}; background: rgba(20, 20, 20, 0.85); border: 2px solid rgba(212,175,55,0.4); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: ${btnFontSize}; color: white; pointer-events: auto; transition: transform 0.1s, background 0.1s; box-shadow: 0 4px 10px rgba(0,0,0,0.6); backdrop-filter: blur(4px);`;
            
            const x = Math.cos(rad) * btnDef.dist; 
            const y = Math.sin(rad) * btnDef.dist;
            btn.style.transform = `translate(calc(${x}px * var(--mobile-ui-scale)), calc(${y}px * var(--mobile-ui-scale)))`;

            if (btnDef.size === 'large') {
                btn.style.border = '2px solid var(--gold, #d4af37)';
                btn.style.boxShadow = '0 0 20px rgba(212,175,55,0.2)';
            }

            const baseTransform = `translate(calc(${x}px * var(--mobile-ui-scale)), calc(${y}px * var(--mobile-ui-scale)))`;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.style.transform = `${baseTransform} scale(0.9)`;
                btn.style.background = 'rgba(212,175,55,0.4)';
                bus.emit(btnDef.action, { mouse: this.input ? this.input.mouse : null });
                if (navigator.vibrate) navigator.vibrate(15);
            });
            btn.addEventListener('touchend', () => {
                btn.style.transform = `${baseTransform} scale(1.0)`;
                btn.style.background = 'rgba(20, 20, 20, 0.85)';
            });
            btnContainer.appendChild(btn);

            if (typeof btnDef.slot === 'number') this.skillButtons.push({ el: btn, slot: btnDef.slot, originalIcon: btnDef.icon });
            else if (btnDef.slot === 'potion') this.potionButton = btn;
            else if (btnDef.slot === 'interact') this.interactButton = btn;
        });

        // --- MOBILE SHORTCUTS DRAWER ("The Parchment") ---
        const uiBtnContainer = document.createElement('div');
        uiBtnContainer.id = 'mobile-ui-shortcuts';
        this.uiContainer = uiBtnContainer;

        const style = document.createElement('style');
        style.textContent = `
            #mobile-ui-shortcuts {
                position: absolute;
                display: flex;
                align-items: center;
                pointer-events: auto;
                transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1100;
            }
            .mobile-shortcut-btn {
                width: 42px; height: 42px;
                background: rgba(20, 15, 10, 0.85);
                border: 1px solid var(--gold);
                border-radius: 8px;
                display: flex; justify-content: center; align-items: center;
                font-size: 20px; color: white;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                backdrop-filter: blur(4px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                flex-shrink: 0;
            }
            #mobile-ui-handle {
                width: 32px; height: 42px;
                background: linear-gradient(to right, #bf642f, #8a431c);
                border: 1px solid var(--gold);
                display: flex; justify-content: center; align-items: center;
                cursor: pointer; font-size: 14px; color: white;
                z-index: 10;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                text-shadow: 1px 1px 2px #000;
            }
            .shortcuts-inner {
                display: flex; gap: 8px; padding: 6px;
                background: rgba(40, 30, 20, 0.7);
                border: 1px solid #5a4530;
                border-right: none;
                border-radius: 12px 0 0 12px;
                overflow: hidden;
                transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: right center;
                width: auto;
            }
            #mobile-ui-shortcuts.closed .shortcuts-inner {
                width: 0 !important; padding: 0 !important; opacity: 0;
                transform: scaleX(0); border: none;
            }
            #mobile-ui-shortcuts.portrait { top: 120px; right: 0; flex-direction: row; }
            #mobile-ui-shortcuts.landscape { top: 10px; right: 0; flex-direction: row; }
        `;
        document.head.appendChild(style);

        const inner = document.createElement('div');
        inner.className = 'shortcuts-inner';
        
        const handle = document.createElement('div');
        handle.id = 'mobile-ui-handle';
        handle.innerHTML = '📜';
        handle.style.borderRadius = '0 8px 8px 0';
        
        let isOpen = false;
        uiBtnContainer.classList.add('closed');

        handle.onclick = (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            uiBtnContainer.classList.toggle('closed', !isOpen);
            handle.innerHTML = isOpen ? '▶' : '📜';
            if (navigator.vibrate) navigator.vibrate(10);
        };

        uiBtnContainer.appendChild(inner);
        uiBtnContainer.appendChild(handle);
        container.appendChild(uiBtnContainer);

        const uiButtons = [
            { id: 'char', action: 'ui:toggle:character', icon: '📊' },
            { id: 'inv', action: 'ui:toggle:inventory', icon: '🎒' },
            { id: 'skill', action: 'ui:toggle:talents', icon: '📜' },
            { id: 'astral', action: 'ui:toggle:astral', icon: '✨' },
            { id: 'ques', action: 'ui:toggle:journal', icon: '📖' },
            { id: 'merc', action: 'ui:toggle:mercenary', icon: '🛡️' },
            { id: 'social', action: 'ui:toggle:social', icon: '👥' },
            { id: 'port', action: 'action:town_portal', icon: '🌀' },
            { id: 'map', action: 'ui:toggle:fullmap', icon: '🗺️' },
            { id: 'stash', action: 'ui:toggle:stash', icon: '📦' },
            { id: 'cube', action: 'ui:toggle:cube', icon: '🎲' },
            { id:  'lead', action: 'ui:toggle:leaderboard', icon: '🏆' }
        ];

        uiButtons.forEach(btnDef => {
            const btn = document.createElement('div');
            btn.className = 'mobile-shortcut-btn';
            btn.innerHTML = btnDef.icon;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.style.transform = 'scale(0.9)';
                btn.style.background = 'rgba(212,175,55,0.4)';
                bus.emit(btnDef.action, {});
            });
            btn.addEventListener('touchend', () => {
                btn.style.transform = 'scale(1.0)';
                btn.style.background = 'rgba(20, 15, 10, 0.85)';
            });
            inner.appendChild(btn);
        });

        const applyLayout = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            uiBtnContainer.classList.toggle('portrait', isPortrait);
            uiBtnContainer.classList.toggle('landscape', !isPortrait);
            if (isPortrait) uiBtnContainer.style.top = '120px';
            else uiBtnContainer.style.top = '10px';
        };

        window.addEventListener('resize', applyLayout);
        applyLayout();
    }

    update(player) {
        if (!this.active || !player) return;

        const getRAIcon = (id) => {
            if (window.getIconForSkill) return window.getIconForSkill(id);
            return 'ra-interdiction';
        };

        this.skillButtons.forEach(btnObj => {
            const skillId = player.hotbar[btnObj.slot];
            const span = btnObj.el.querySelector('span');
            if (skillId) {
                const iconClass = getRAIcon(skillId);
                span.innerHTML = `<i class="ra ${iconClass}" style="color:var(--gold, #d4af37); font-size:24px;"></i>`;
                btnObj.el.style.borderColor = 'rgba(212,175,55,0.8)';
            } else {
                span.textContent = btnObj.originalIcon;
                btnObj.el.style.borderColor = 'rgba(212,175,55,0.2)';
            }
        });

        if (this.potionButton) {
            const firstPotion = player.belt.find(p => p !== null);
            const span = this.potionButton.querySelector('span');
            if (firstPotion) span.innerHTML = '<i class="ra ra-bubbles" style="color:#ff5050; font-size:24px;"></i>';
            else span.textContent = '🧪';
        }

        if (this.interactButton) {
            const weapon = player.equipment.mainhand;
            const span = this.interactButton.querySelector('span');
            if (weapon) {
                const wType = weapon.type?.toLowerCase() || 'sword';
                const iconMap = { 'sword': 'ra-sword', 'axe': 'ra-axe', 'mace': 'ra-mace-head', 'bow': 'ra-bow-arrow', 'staff': 'ra-crystal-wand', 'wand': 'ra-wand', 'polearm': 'ra-halberd', 'shield': 'ra-heavy-shield' };
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
            this.input.keys['KeyW'] = false; this.input.keys['KeyS'] = false;
            this.input.keys['KeyA'] = false; this.input.keys['KeyD'] = false;
        });
    }
}
