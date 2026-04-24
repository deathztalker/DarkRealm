export class HUDManager {
    constructor($) {
        this.$ = $;
        this.lastBossWarnTime = 0;
    }

    update(state) {
        const { player, mercenary, uiActiveBoss, zoneLevel, theme, fx, addCombatLog, updateWorldClockUI } = state;
        if (!player) return;

        if (updateWorldClockUI) updateWorldClockUI();

        this._updateOrbs(player);
        this._updateMercenary(mercenary);
        this._updateBossBar(uiActiveBoss, player, fx, addCombatLog);
        this._updateAtmosphere(zoneLevel, theme);
    }

    _updateOrbs(player) {
        const hpFill = this.$('hp-fill');
        if (hpFill) hpFill.style.height = (player.hp / player.maxHp * 100) + '%';
        const hpText = this.$('hp-text');
        if (hpText) hpText.textContent = `${Math.ceil(player.hp)}`;

        const mpFill = this.$('mp-fill');
        if (mpFill) mpFill.style.height = (player.mp / player.maxMp * 100) + '%';
        const mpText = this.$('mp-text');
        if (mpText) mpText.textContent = `${Math.ceil(player.mp)}`;

        const xpPct = player.xpToNext ? (player.xp / player.xpToNext * 100) : 100;
        const xpBar = this.$('xp-bar');
        if (xpBar) {
            xpBar.style.width = xpPct + '%';
            this.$('xp-bar-container').title = `Level ${player.level} — ${Math.floor(xpPct)}%`;
        }
    }

    _updateMercenary(mercenary) {
        const mercHud = this.$('mercenary-hud');
        if (!mercHud) return;

        if (mercenary) {
            mercHud.classList.remove('hidden');
            const hpFill = this.$('merc-hud-hp-fill');
            const hpPct = (mercenary.hp / mercenary.maxHp) * 100;
            if (hpFill) hpFill.style.width = Math.max(0, hpPct) + '%';

            const lvlText = this.$('merc-hud-lvl');
            if (lvlText) lvlText.textContent = `Level ${mercenary.level}`;

            const portrait = this.$('merc-hud-portrait');
            if (portrait) {
                if (mercenary.hp <= 0) portrait.classList.add('merc-dead-portrait');
                else portrait.classList.remove('merc-dead-portrait');
            }
        } else {
            mercHud.classList.add('hidden');
        }
    }

    _updateBossBar(uiActiveBoss, player, fx, addCombatLog) {
        const bossBar = this.$('boss-hp-bar');
        if (!bossBar) return;

        if (uiActiveBoss && uiActiveBoss.hp > 0) {
            const dist = Math.hypot(uiActiveBoss.x - player.x, uiActiveBoss.y - player.y);
            if (dist < 500) {
                bossBar.classList.remove('hidden');
                this.$('boss-name').textContent = uiActiveBoss.name;
                const bPct = (uiActiveBoss.hp / uiActiveBoss.maxHp) * 100;
                this.$('boss-hp-fill').style.width = bPct + '%';

                if (performance.now() - this.lastBossWarnTime > 60000) {
                    if (fx) fx.shake(500, 5);
                    if (addCombatLog) addCombatLog(`⚠️ TARGET DETECTED: ${uiActiveBoss.name}`, 'log-warn');
                    this.lastBossWarnTime = performance.now();
                }
            } else {
                bossBar.classList.add('hidden');
            }
        } else {
            bossBar.classList.add('hidden');
        }
    }

    _updateAtmosphere(zoneLevel, theme) {
        const canvas = this.$('game-canvas');
        if (!canvas) return;

        let filter = 'none';
        if (zoneLevel === 0) filter = 'sepia(0.2) saturate(1.2)';
        else if (zoneLevel === 137 || (zoneLevel > 128 && zoneLevel % 5 === 0)) filter = 'saturate(1.5) contrast(1.1) hue-rotate(-10deg)';
        else if (theme === 'catacombs') filter = 'brightness(0.8) saturate(0.8) hue-rotate(20deg)';
        else if (theme === 'wilderness') filter = 'saturate(1.1) contrast(1.05)';
        canvas.style.filter = filter;
    }
}
