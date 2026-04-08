/**
 * Talent Tree System
 * Handles point allocation, requirement checks, effective skill level
 * (base points + item bonuses from affixes + runewords).
 */
import { getSkillMap } from '../data/classes.js';

export class TalentTree {
    /**
     * @param {string} classId
     * @param {object} savedPoints - { skillId: n } from save
     */
    constructor(classId, savedPoints = {}) {
        this.classId = classId;
        this.skillMap = getSkillMap(classId);
        this.points = { ...savedPoints }; // base points in each skill
        this.unspent = 0;
    }

    /** Total points spent */
    get spent() {
        return Object.values(this.points).reduce((a, b) => a + b, 0);
    }

    /** Base points in a skill (from talent tree only) */
    baseLevel(skillId) {
        return this.points[skillId] || 0;
    }

    /**
     * Effective skill level = base + item bonuses.
     * itemBonuses: result of player.getSkillBonuses(skillId)
     */
    effectiveLevel(skillId, itemBonuses = 0) {
        return Math.max(0, this.baseLevel(skillId) + itemBonuses);
    }

    /**
     * Synergy bonus: sum of (synergyNode.basePoints × pctPerPt)
     * returned as a decimal multiplier (e.g. 0.20 = +20%)
     */
    synergyBonus(targetSkillId) {
        let bonus = 0;
        const targetSkill = this.skillMap[targetSkillId];
        
        if (targetSkill && targetSkill.synergies) {
            for (const syn of targetSkill.synergies) {
                const pts = this.baseLevel(syn.from);
                if (pts > 0) {
                    bonus += (pts * syn.pctPerPt) / 100;
                }
            }
        }
        
        // Also support old/legacy synergy nodes if they exist
        for (const [id, skill] of Object.entries(this.skillMap)) {
            if (skill.type === 'synergy' && skill.targetSkill === targetSkillId) {
                const pts = this.baseLevel(id);
                if (pts > 0) {
                    bonus += pts * parseFloat(skill.bonusPerPoint) / 100;
                }
            }
        }
        return bonus;
    }

    /** Check if a skill's prerequisite is met */
    reqMet(skillId) {
        const skill = this.skillMap[skillId];
        if (!skill?.req) return true;
        const [reqId, reqPts] = skill.req.split(':');
        return this.baseLevel(reqId) >= parseInt(reqPts, 10);
    }

    /** Can spend a point in skillId? */
    canSpend(skillId) {
        if (this.unspent <= 0) return false;
        const skill = this.skillMap[skillId];
        if (!skill) return false;
        if (this.baseLevel(skillId) >= skill.maxPts) return false;
        return this.reqMet(skillId);
    }

    /** Spend a point. Returns true if successful. */
    spend(skillId) {
        if (!this.canSpend(skillId)) return false;
        this.points[skillId] = (this.points[skillId] || 0) + 1;
        this.unspent--;
        return true;
    }

    /** Refund a point (for reset). */
    refund(skillId) {
        if ((this.points[skillId] || 0) <= 0) return false;
        this.points[skillId]--;
        this.unspent++;
        return true;
    }

    /** Full reset — get all points back. */
    reset() {
        const total = this.spent;
        this.points = {};
        this.unspent += total;
    }

    /** Serialize for save system */
    serialize() {
        return { classId: this.classId, points: { ...this.points }, unspent: this.unspent };
    }

    static deserialize(data) {
        const tt = new TalentTree(data.classId, data.points);
        tt.unspent = data.unspent || 0;
        return tt;
    }
}
