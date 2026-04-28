import { WARRIOR_MUTATIONS } from './mutations/mutations_warrior.js';
import { SORCERESS_MUTATIONS } from './mutations/mutations_sorceress.js';
import { SHAMAN_MUTATIONS } from './mutations/mutations_shaman.js';
import { NECROMANCER_MUTATIONS } from './mutations/mutations_necromancer.js';
import { ROGUE_MUTATIONS } from './mutations/mutations_rogue.js';
import { PALADIN_MUTATIONS } from './mutations/mutations_paladin.js';
import { DRUID_MUTATIONS } from './mutations/mutations_druid.js';
import { WARLOCK_MUTATIONS } from './mutations/mutations_warlock.js';
import { RANGER_MUTATIONS } from './mutations/mutations_ranger.js';

/**
 * MUTATION TREES — Deep mastery trees for each skill.
 * Aggregated from class-specific mutation files.
 */
export const MUTATION_TREES = {
    ...WARRIOR_MUTATIONS,
    ...SORCERESS_MUTATIONS,
    ...SHAMAN_MUTATIONS,
    ...NECROMANCER_MUTATIONS,
    ...ROGUE_MUTATIONS,
    ...PALADIN_MUTATIONS,
    ...DRUID_MUTATIONS,
    ...WARLOCK_MUTATIONS,
    ...RANGER_MUTATIONS
};

/**
 * Calculates the total modifiers for a skill based on spent mutation points.
 * @param {Object} player - The player object containing mutationTrees state.
 * @param {string} skillId - The ID of the skill to calculate mods for.
 * @returns {Object} - An object containing aggregated modifiers and perk flags.
 */
export function getMutationMods(player, skillId) {
    const mods = {};
    const tree = MUTATION_TREES[skillId];
    if (!tree || !player.mutationTrees || !player.mutationTrees[skillId]) return mods;

    const spent = player.mutationTrees[skillId].pointsSpent || {};
    
    tree.forEach(node => {
        const pts = spent[node.id] || 0;
        if (pts > 0) {
            for (const [stat, val] of Object.entries(node.mod)) {
                mods[stat] = (mods[stat] || 0) + (val * pts);
            }
            // Add mastery perk flag if at max points
            if (pts >= node.max) {
                mods[`perk_${node.id}`] = true;
            }
        }
    });

    return mods;
}
