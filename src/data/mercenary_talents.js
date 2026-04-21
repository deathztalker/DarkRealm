/**
 * MERCENARY TALENTS — Custom skill trees for companions.
 */

export const MERC_TREES = {
    'Rogue': [
        {
            id: 'rogue_fire', name: 'Fire Archery', icon: '🔥',
            nodes: [
                { id: 'fire_arrow', name: 'Fire Arrow', desc: 'Adds fire damage to shots.', maxPts: 20 },
                { id: 'fire_mastery', name: 'Fire Mastery', desc: 'Increases all fire damage.', maxPts: 20 }
            ]
        },
        {
            id: 'rogue_cold', name: 'Cold Archery', icon: '❄️',
            nodes: [
                { id: 'cold_arrow', name: 'Cold Arrow', desc: 'Adds cold damage and chills.', maxPts: 20 },
                { id: 'piercing_ice', name: 'Piercing Ice', desc: 'Arrows pierce and lower cold res.', maxPts: 20 }
            ]
        },
        {
            id: 'rogue_utility', name: 'Tactics', icon: '👁️',
            nodes: [
                { id: 'inner_sight', name: 'Inner Sight', desc: 'Reduces enemy armor.', maxPts: 20 },
                { id: 'critical_strike', name: 'Deadly Strike', desc: 'Chance for double damage.', maxPts: 20 }
            ]
        }
    ],
    'Desert Warrior': [
        {
            id: 'desert_offense', name: 'Offensive', icon: '⚔️',
            nodes: [
                { id: 'might_aura', name: 'Might Aura', desc: 'Increases physical damage.', maxPts: 20 },
                { id: 'jab', name: 'Jab', desc: 'Fast triple strike.', maxPts: 20 }
            ]
        },
        {
            id: 'desert_defense', name: 'Defensive', icon: '🛡️',
            nodes: [
                { id: 'defiance_aura', name: 'Defiance Aura', desc: 'Increases total armor.', maxPts: 20 },
                { id: 'prayer_aura', name: 'Prayer Aura', desc: 'Regenerates life over time.', maxPts: 20 }
            ]
        },
        {
            id: 'desert_utility', name: 'Combat Arts', icon: '❄️',
            nodes: [
                { id: 'holy_freeze', name: 'Holy Freeze', desc: 'Slows enemies with cold aura.', maxPts: 20 },
                { id: 'thorns_aura', name: 'Thorns Aura', desc: 'Reflects physical damage.', maxPts: 20 }
            ]
        }
    ],
    'Iron Wolf': [
        {
            id: 'wolf_fire', name: 'Pyromancy', icon: '🔥',
            nodes: [
                { id: 'fire_bolt', name: 'Fire Bolt', desc: 'Standard fire damage.', maxPts: 20 },
                { id: 'enchant', name: 'Enchant', desc: 'Adds fire damage to weapons.', maxPts: 20 }
            ]
        },
        {
            id: 'wolf_cold', name: 'Cryomancy', icon: '❄️',
            nodes: [
                { id: 'glacial_spike', name: 'Glacial Spike', desc: 'Explosive ice damage.', maxPts: 20 },
                { id: 'frozen_armor', name: 'Frozen Armor', desc: 'Increases defense.', maxPts: 20 }
            ]
        },
        {
            id: 'wolf_lightning', name: 'Storm', icon: '⚡',
            nodes: [
                { id: 'charged_bolt', name: 'Charged Bolt', desc: 'Multiple sparks of energy.', maxPts: 20 },
                { id: 'static_field', name: 'Static Field', desc: 'Reduces enemy HP by %.', maxPts: 20 }
            ]
        }
    ],
    'Barbarian': [
        {
            id: 'barb_combat', name: 'Berserker', icon: '⚔️',
            nodes: [
                { id: 'bash', name: 'Bash', desc: 'Heavy hit with knockback and extra damage.', maxPts: 20 },
                { id: 'frenzy', name: 'Frenzy', desc: 'Increases attack and move speed per hit.', maxPts: 20 }
            ]
        },
        {
            id: 'barb_warcries', name: 'Warlord', icon: '📢',
            nodes: [
                { id: 'shout_aura', name: 'Shout', desc: 'Increases defense for the party.', maxPts: 20 },
                { id: 'battle_orders', name: 'Battle Orders', desc: 'Increases life and mana.', maxPts: 20 }
            ]
        },
        {
            id: 'barb_mastery', name: 'Guardian', icon: '🛡️',
            nodes: [
                { id: 'iron_skin', name: 'Iron Skin', desc: 'Passively increases armor.', maxPts: 20 },
                { id: 'natural_resistance', name: 'Natural Resistance', desc: 'Increases all resistances.', maxPts: 20 }
            ]
        }
    ]
};
