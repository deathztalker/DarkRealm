/**
 * CLASS REGISTRY — imports all expanded class files, exports unified API
 */
import { WARRIOR_CLASS } from './class_warrior.js';
import { SORCERESS_CLASS } from './class_sorceress.js';
import { SHAMAN_CLASS } from './class_shaman.js';
import { NECROMANCER_CLASS } from './class_necromancer.js';
import { ROGUE_CLASS } from './class_rogue.js';
import { WARLOCK_CLASS } from './class_warlock.js';
import { PALADIN_CLASS } from './class_paladin.js';
import { DRUID_CLASS } from './class_druid.js';
import { RANGER_CLASS } from './class_ranger.js';

const CLASSES = {
    warrior: WARRIOR_CLASS,
    sorceress: SORCERESS_CLASS,
    shaman: SHAMAN_CLASS,
    necromancer: NECROMANCER_CLASS,
    rogue: ROGUE_CLASS,
    warlock: WARLOCK_CLASS,
    paladin: PALADIN_CLASS,
    druid: DRUID_CLASS,
    ranger: RANGER_CLASS,
};

export { CLASSES };
export function getClass(id) { return CLASSES[id]; }
export function getAllClasses() { return Object.values(CLASSES); }
export function getSkillMap(classId) {
    const cls = CLASSES[classId];
    if (!cls) return {};
    const map = {};
    for (const tree of cls.trees) for (const n of tree.nodes) map[n.id] = { ...n, treeId: tree.id };
    return map;
}
