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
        // We'll use an ergonomic arc around the Mana orb area
        const btnContainer = document.createElement('div');
        btnContainer.id = 'mobile-buttons';
        btnContainer.style.cssText = 'position:absolute; bottom:0; right:0; width:300px; height:300px; pointer-events:none;';
        container.appendChild(btnContainer);

        const skillButtonDefs = [
            { slot: 0, angle: -160, dist: 150, action: 'skill:use:0', icon: 'Q' },
            { slot: 1, angle: -135, dist: 160, action: 'skill:use:1', icon: 'E' },
            { slot: 2, angle: -110, dist: 160, action: 'skill:use:2', icon: 'R' },
            { slot: 3, angle: -85, dist: 155, action: 'skill:use:3', icon: 'F' },
            { slot: 4, angle: -65, dist: 140, action: 'skill:use:4', icon: 'G' },
            { slot: 'potion', angle: -180, dist: 100, action: 'potion:use:0', icon: '🧪' },
            { slot: 'interact', angle: -130, dist: 80, action: 'action:interact', icon: '✋', size: 'large' }
        ];

        skillButtonDefs.forEach(btnDef => {
            const btn = document.createElement('div');
            btn.className = 'mobile-btn';
            btn.innerHTML = `<span>${btnDef.icon}</span>`;
            
            // Positioning in an arc relative to the bottom-right corner (Mana Orb area)
            const rad = (btnDef.angle * Math.PI) / 180;
            const x = Math.cos(rad) * btnDef.dist;
            const y = Math.sin(rad) * btnDef.dist;

            btn.style.cssText = `
                position: absolute;
                bottom: 40px; 
                right: 40px;
                width: 55px; height: 55px; 
                transform: translate(${x}px, ${y}px);
                background: rgba(0,0,0,0.6); 
                border: 2px solid rgba(212,175,55,0.4); 
                border-radius: 50%; 
                display: flex; justify-content: center; align-items: center; 
                font-size: 22px; color: white; 
                pointer-events: auto;
                transition: transform 0.1s;
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
                btn.style.background = 'rgba(0,0,0,0.6)';
            });

            btnContainer.appendChild(btn);
            
            if (typeof btnDef.slot === 'number') {
                this.skillButtons.push({ el: btn, slot: btnDef.slot, originalIcon: btnDef.icon });
            } else if (btnDef.slot === 'potion') {
                this.potionButton = btn;
            }
        });

        // Toggle UI buttons (Inventory, etc) - Place below mercenary portrait
        const uiBtnContainer = document.createElement('div');
        uiBtnContainer.id = 'mobile-ui-shortcuts';
        uiBtnContainer.style.cssText = 'position:absolute; top:120px; left:10px; display:flex; gap:10px; pointer-events:auto;';
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

    /**
     * Synchronize mobile icons with player's actual equipped skills
     */
    update(player) {
        if (!this.active || !player) return;

        // Skill icon mapping (replicated from main.js for sync)
        const getRAIcon = (id) => {
            const map = {
                'warrior': 'ra-crossed-swords', 'arms': 'ra-sword', 'bash': 'ra-muscle-up', 'double_swing': 'ra-dervish-swords', 'rend': 'ra-dripping-sword', 'whirlwind': 'ra-spinning-sword', 'berserk': 'ra-player-pyromaniac', 'cleave': 'ra-axe-swing', 'execute': 'ra-decapitation', 'defense': 'ra-heavy-shield', 'shield_bash': 'ra-bolt-shield', 'iron_skin': 'ra-knight-helmet', 'block_mastery': 'ra-round-shield', 'revenge': 'ra-player-dodge', 'taunt': 'ra-horn-call', 'fortify': 'ra-guarded-tower', 'life_tap': 'ra-crowned-heart', 'last_stand': 'ra-blast', 'battle': 'ra-castle-flag', 'warcry': 'ra-horn-call', 'shout': 'ra-speech-bubble', 'leap_attack': 'ra-boot-stomp', 'battle_orders': 'ra-hand-emblem', 'commanding_shout': 'ra-speech-bubbles', 'slam': 'ra-groundbreaker', 'avatar_of_war': 'ra-heavy-fall',
                'sorceress': 'ra-crystal-wand', 'fire': 'ra-fire-symbol', 'fire_bolt': 'ra-small-fire', 'fireball': 'ra-fire-bomb', 'fire_mastery': 'ra-burning-embers', 'meteor': 'ra-burning-meteor', 'fire_storm': 'ra-arson', 'immolate': 'ra-campfire', 'enchant': 'ra-fireball-sword', 'inferno': 'ra-fire-breath', 'cold': 'ra-snowflake', 'ice_bolt': 'ra-frost-emblem', 'frost_nova': 'ra-frostfire', 'ice_blast': 'ra-cold-heart', 'frozen_armor': 'ra-crystal-cluster', 'blizzard': 'ra-ice-cube', 'cold_mastery': 'ra-frozen-arrow', 'frozen_orb': 'ra-crystal-ball', 'absolute_zero': 'ra-brain-freeze', 'lightning': 'ra-lightning-bolt', 'charged_bolt': 'ra-focused-lightning', 'lightning_bolt': 'ra-lightning', 'chain_lightning': 'ra-lightning-trio', 'static_field': 'ra-energise', 'teleport': 'ra-player-teleport', 'light_mastery': 'ra-lightning-sword', 'nova': 'ra-explosion', 'energy_shield': 'ra-bolt-shield', 'thunder_storm': 'ra-lightning-storm',
                'shaman': 'ra-lightning-trio', 'necromancer': 'ra-skull', 'rogue': 'ra-divert', 'warlock': 'ra-eye-shield', 'paladin': 'ra-holy-symbol', 'druid': 'ra-pawprint', 'ranger': 'ra-target-arrows'
            };
            return map[id] || 'ra-interdiction';
        };
        
        // Update Skill Buttons
        this.skillButtons.forEach(btnObj => {
            const skillId = player.hotbar[btnObj.slot];
            const span = btnObj.el.querySelector('span');
            
            if (skillId) {
                const iconClass = getRAIcon(skillId);
                span.innerHTML = `<i class="ra ${iconClass}" style="color:var(--gold); font-size:24px;"></i>`;
            } else {
                // If no skill equipped, show slot label (Q, E, R, etc)
                span.textContent = btnObj.originalIcon;
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
