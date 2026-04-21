/**
 * MERCENARY TALENTS — Mega Expansion
 * Each mercenary type now has 3 specialized branches with deep synergies.
 */

export const MERC_TREES = {
    'Rogue': [
        {
            id: 'rogue_fire', name: 'Inferno Path', icon: '🔥',
            nodes: [
                { id: 'fire_arrow', name: 'Fire Arrow', desc: 'Adds fire damage to shots.', maxPts: 20 },
                { id: 'exploding_arrow', name: 'Exploding Arrow', desc: 'Arrows explode on impact dealing AoE fire damage.', maxPts: 20 },
                { id: 'fire_mastery', name: 'Fire Mastery', desc: 'Increases all fire damage by 10% per level.', maxPts: 20 }
            ]
        },
        {
            id: 'rogue_cold', name: 'Frost Path', icon: '❄️',
            nodes: [
                { id: 'cold_arrow', name: 'Cold Arrow', desc: 'Adds cold damage and chills.', maxPts: 20 },
                { id: 'freezing_arrow', name: 'Freezing Arrow', desc: 'Freezes target and nearby enemies.', maxPts: 20 },
                { id: 'shatter_mastery', name: 'Shatter', desc: 'Deals 20% more damage to frozen targets.', maxPts: 10 }
            ]
        },
        {
            id: 'rogue_lightning', name: 'Storm Path', icon: '⚡',
            nodes: [
                { id: 'lightning_arrow', name: 'Lightning Arrow', desc: 'Arrows deal lightning damage and chain to 2 targets.', maxPts: 20 },
                { id: 'static_arrow', name: 'Static Shock', desc: 'Critical hits with lightning arrows reduce enemy HP by %.', maxPts: 20 }
            ]
        },
        {
            id: 'rogue_utility', name: 'Survival', icon: '👁️',
            nodes: [
                { id: 'inner_sight', name: 'Inner Sight', desc: 'Reduces enemy armor.', maxPts: 20 },
                { id: 'dodge', name: 'Dodge', desc: '1% chance per level to evade any attack.', maxPts: 15 },
                { id: 'critical_strike', name: 'Deadly Strike', desc: 'Adds 2% chance for double damage.', maxPts: 20 }
            ]
        }
    ],
    'Desert Warrior': [
        {
            id: 'desert_offense', name: 'Offensive', icon: '⚔️',
            nodes: [
                { id: 'might_aura', name: 'Might Aura', desc: 'Increases party physical damage.', maxPts: 20 },
                { id: 'concentration_aura', name: 'Concentration', desc: 'Massive damage and hits cannot be interrupted.', maxPts: 20 },
                { id: 'jab', name: 'Jab', desc: 'Fast triple strike.', maxPts: 20 }
            ]
        },
        {
            id: 'desert_defense', name: 'Defensive', icon: '🛡️',
            nodes: [
                { id: 'defiance_aura', name: 'Defiance Aura', desc: 'Increases total armor.', maxPts: 20 },
                { id: 'prayer_aura', name: 'Prayer Aura', desc: 'Regenerates life over time.', maxPts: 20 },
                { id: 'cleansing_aura', name: 'Cleansing', desc: 'Reduces poison and curse duration.', maxPts: 20 }
            ]
        },
        {
            id: 'desert_tactical', name: 'Tactical', icon: '✨',
            nodes: [
                { id: 'holy_freeze', name: 'Holy Freeze', desc: 'Slows enemies with cold aura.', maxPts: 20 },
                { id: 'fanaticism_aura', name: 'Fanaticism', desc: 'Increases party IAS, Damage, and AR.', maxPts: 20 },
                { id: 'meditation_aura', name: 'Meditation', desc: 'Massively increases mana recovery.', maxPts: 20 }
            ]
        }
    ],
    'Iron Wolf': [
        {
            id: 'wolf_fire', name: 'Pyromancy', icon: '🔥',
            nodes: [
                { id: 'fire_bolt', name: 'Fire Bolt', desc: 'Standard fire damage.', maxPts: 20 },
                { id: 'fire_ball', name: 'Fire Ball', desc: 'Explosive ball of fire.', maxPts: 20 },
                { id: 'meteor', name: 'Meteor', desc: 'Calls down a huge flaming rock.', maxPts: 20 }
            ]
        },
        {
            id: 'wolf_cold', name: 'Cryomancy', icon: '❄️',
            nodes: [
                { id: 'glacial_spike', name: 'Glacial Spike', desc: 'Explosive ice damage.', maxPts: 20 },
                { id: 'blizzard', name: 'Blizzard', desc: 'Calls down a storm of ice.', maxPts: 20 },
                { id: 'cold_mastery', name: 'Cold Mastery', desc: 'Pierces enemy cold resistance.', maxPts: 20 }
            ]
        },
        {
            id: 'wolf_lightning', name: 'Storm', icon: '⚡',
            nodes: [
                { id: 'charged_bolt', name: 'Charged Bolt', desc: 'Multiple sparks of energy.', maxPts: 20 },
                { id: 'chain_lightning', name: 'Chain Lightning', desc: 'Lightning that jumps between targets.', maxPts: 20 },
                { id: 'static_field', name: 'Static Field', desc: 'Reduces enemy HP by %.', maxPts: 20 }
            ]
        }
    ],
    'Barbarian': [
        {
            id: 'barb_combat', name: 'Berserker', icon: '⚔️',
            nodes: [
                { id: 'bash', name: 'Bash', desc: 'Heavy hit with knockback.', maxPts: 20 },
                { id: 'whirlwind', name: 'Whirlwind', desc: 'Spinning area attack.', maxPts: 20 },
                { id: 'frenzy', name: 'Frenzy', desc: 'Increases speed per hit.', maxPts: 20 }
            ]
        },
        {
            id: 'barb_warcries', name: 'Warlord', icon: '📢',
            nodes: [
                { id: 'shout_aura', name: 'Shout', desc: 'Increases party defense.', maxPts: 20 },
                { id: 'battle_orders', name: 'Battle Orders', desc: 'Increases life and mana.', maxPts: 20 },
                { id: 'battle_command', name: 'Battle Command', desc: '+1 to all party skills.', maxPts: 20 }
            ]
        },
        {
            id: 'barb_mastery', name: 'Guardian', icon: '🛡️',
            nodes: [
                { id: 'iron_skin', name: 'Iron Skin', desc: 'Passively increases armor.', maxPts: 20 },
                { id: 'natural_resistance', name: 'Natural Resistance', desc: 'Increases all resistances.', maxPts: 20 },
                { id: 'increased_speed', name: 'Speed', desc: 'Increases movement speed.', maxPts: 10 }
            ]
        }
    ]
};
