/**
 * Campaign System — Tracks Act progression, quest flags, and rewards.
 */
import { bus } from '../engine/EventBus.js';

class CampaignSystem {
    constructor() {
        this.completedActs = 0; // 0 = In Act 1, 1 = Act 1 finished, etc.
        this.flags = new Set();
        this.questRewards = new Set(); // Track if rewards (like Radament's skill book) were claimed
    }

    reset() {
        this.completedActs = 0;
        this.flags.clear();
        this.questRewards.clear();
    }

    serialize() {
        return {
            completedActs: this.completedActs,
            flags: Array.from(this.flags),
            questRewards: Array.from(this.questRewards)
        };
    }

    deserialize(data) {
        if (!data) return;
        this.completedActs = data.completedActs || 0;
        this.flags = new Set(data.flags || []);
        this.questRewards = new Set(data.questRewards || []);
    }

    setFlag(flag) {
        if (this.flags.has(flag)) return;
        this.flags.add(flag);
        bus.emit('campaign:flag', { flag });
        console.log(`[Campaign] Flag set: ${flag}`);
    }

    hasFlag(flag) {
        return this.flags.has(flag);
    }

    completeAct(actNum) {
        if (actNum > this.completedActs) {
            this.completedActs = actNum;
            bus.emit('campaign:act_complete', { act: actNum });
            console.log(`[Campaign] Act ${actNum} Completed!`);
        }
    }

    isActUnlocked(actNum) {
        if (actNum === 0) return true;
        return actNum <= this.completedActs + 1;
    }

    getActForZone(z) {
        if (z === 0) return 1;
        if (z <= 37) return 1;
        if (z <= 67) return 2;
        if (z <= 95) return 3;
        if (z <= 101) return 4;
        if (z <= 125) return 5;
        return 6; // Rifts
    }

    claimReward(questId, player) {
        if (this.questRewards.has(questId)) return false;
        
        switch(questId) {
            case 'den_of_evil':
                // One-time skill/stat reset
                player.statPoints += (player.level - 1) * 5;
                player.baseStr = 10; player.baseDex = 10; player.baseVit = 10; player.baseInt = 10; // Basic reset - real bases should come from Class data
                player.talents.points = {};
                player.talents.unspent = player.level; // All points back
                player._recalcStats();
                bus.emit('combat:log', { text: "Akara has purged your essence! Stats and Skills reset.", cls: 'log-heal' });
                break;
            case 'radament':
                player.talents.unspent += 1;
                bus.emit('combat:log', { text: "Reward: +1 Skill Point!", cls: 'log-level' });
                break;
            case 'izual':
                player.talents.unspent += 2;
                bus.emit('combat:log', { text: "Reward: +2 Skill Points!", cls: 'log-level' });
                break;
            case 'anya':
                player.permanentResists = (player.permanentResists || 0) + 10;
                player._recalcStats();
                bus.emit('combat:log', { text: "Reward: +10 All Resistances!", cls: 'log-level' });
                break;
            case 'lam_esen':
                player.statPoints += 5;
                bus.emit('combat:log', { text: "Reward: +5 Stat Points!", cls: 'log-level' });
                break;
        }

        this.questRewards.add(questId);
        return true;
    }
}

export const campaign = new CampaignSystem();
