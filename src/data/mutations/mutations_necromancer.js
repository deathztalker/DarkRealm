export const NECROMANCER_MUTATIONS = {
    // --- SUMMONING TREE ---
    raise_skeleton: [
        {
            id: 'rs_archer', name: 'Skeletal Archers', max: 5, reqBaseLevel: 1,
            desc: '20% chance per level to summon an Archer instead of a Warrior.',
            masteryPerk: 'Skeletal Archers fire arrows that pierce 1 target.',
            mod: { archerConversion: 0.2 },
            icon: 'ra-arrow-cluster'
        },
        {
            id: 'rs_legion', name: 'Legion', max: 5, reqBaseLevel: 5,
            desc: '+1 max Skeletons and +10% Skeleton HP.',
            masteryPerk: 'When a Skeleton dies, it has a 30% chance to self-resurrect.',
            mod: { maxPets: 1, petHpPct: 10 },
            icon: 'ra-pawn'
        }
    ],
    skeletal_mage: [
        {
            id: 'sm_elemental', name: 'Elemental Focus', max: 5, reqBaseLevel: 5,
            desc: '+15% Mage damage and +10% resistance.',
            masteryPerk: 'Mages now cast Nova of their element upon death.',
            mod: { petDmgPct: 15 },
            icon: 'ra-crystals'
        }
    ],
    skeleton_mastery: [
        {
            id: 'sm_overlord', name: 'Overlord', max: 5, reqBaseLevel: 1,
            desc: '+10% Minion Damage and +5% Minion Speed.',
            masteryPerk: 'Skeletons gain 10% of your maximum health as bonus health.',
            mod: { petDmgPct: 10, petMoveSpeed: 5 },
            icon: 'ra-skeleton-arm'
        }
    ],
    clay_golem: [
        {
            id: 'cg_mud', name: 'Quicksand', max: 5, reqBaseLevel: 1,
            desc: '+10% Slow effect and +15% Golem HP.',
            masteryPerk: 'Clay Golem generates high threat and has a 20% chance to stun on hit.',
            mod: { slowPct: 10, petHpPct: 15 },
            icon: 'ra-mountain-cave'
        }
    ],
    golem_mastery: [
        {
            id: 'gm_colossus', name: 'Colossus', max: 5, reqBaseLevel: 1,
            desc: '+20% Golem HP and +10% Golem Armor.',
            masteryPerk: 'Golems regenerate 5% of their maximum health every second.',
            mod: { petHpPct: 20, petArmorPct: 10 },
            icon: 'ra-mountain-cave'
        }
    ],
    blood_golem: [
        {
            id: 'bg_vampire', name: 'Sanguine Bond', max: 5, reqBaseLevel: 5,
            desc: '+5% Life Steal share and +20% Golem damage.',
            masteryPerk: 'Blood Golem heals the master for 100% of its damage dealt.',
            mod: { lifestealPct: 5 },
            icon: 'ra-droplet'
        }
    ],
    minion_instability: [
        {
            id: 'mi_volatile', name: 'Volatile Flesh', max: 5, reqBaseLevel: 10,
            desc: '+10% Explosion damage and +15% radius.',
            masteryPerk: 'Minion explosions apply a 3s decay effect that deals damage over time.',
            mod: { explodeDmgPct: 10 },
            icon: 'ra-biohazard'
        }
    ],
    iron_golem: [
        {
            id: 'ig_spikes', name: 'Thorny Plate', max: 5, reqBaseLevel: 10,
            desc: 'Golem gains +50 Thorns per level.',
            masteryPerk: 'Iron Golem inherits all offensive mods from the item used to create it.',
            mod: { thorns: 50 },
            icon: 'ra-shield'
        }
    ],
    death_commander: [
        {
            id: 'dc_fervor', name: 'Commander\'s Fervor', max: 5, reqBaseLevel: 15,
            desc: '+10% Minion Damage bonus and +5s duration.',
            masteryPerk: 'During Death Commander, your minions have a 20% chance to cast Teeth on hit.',
            mod: { petDmgPct: 10 },
            icon: 'ra-burning-embers'
        }
    ],
    fire_golem: [
        {
            id: 'fg_blaze', name: 'Hellfire Aura', max: 5, reqBaseLevel: 15,
            desc: '+20% Aura damage and +10% Golem Speed.',
            masteryPerk: 'Fire Golem explodes for 200% weapon damage when killed.',
            mod: { auraDmgPct: 20 },
            icon: 'ra-flame-symbol'
        }
    ],
    army_of_dead: [
        {
            id: 'aod_swarm', name: 'Swarm of Souls', max: 5, reqBaseLevel: 25,
            desc: '+1 extra skeleton raised and +2s duration.',
            masteryPerk: 'Army of the Dead summons also explode on expiration.',
            mod: { extraSkeletons: 1 },
            icon: 'ra-skull'
        }
    ],

    // --- BONE & POISON TREE ---
    teeth: [
        {
            id: 'te_shotgun', name: 'Jawbone', max: 5, reqBaseLevel: 1,
            desc: '+2 teeth projectiles and +10% Damage.',
            masteryPerk: 'Teeth projectiles pierce 1 target.',
            mod: { extraProjectiles: 2, pctDmg: 10 },
            icon: 'ra-broken-bone'
        }
    ],
    bone_spear: [
        {
            id: 'bs_heavy', name: 'Unstoppable Force', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% projectile speed.',
            masteryPerk: 'Bone Spear damage no longer reduces as it pierces.',
            mod: { pctDmg: 15 },
            icon: 'ra-spear-head'
        }
    ],
    poison_nova: [
        {
            id: 'pn_radius', name: 'Toxic Cloud', max: 5, reqBaseLevel: 15,
            desc: '+15% Nova radius and +1s duration.',
            masteryPerk: 'Poison Nova reduces enemy poison resistance by 20% for 5s.',
            mod: { radiusPct: 15, duration: 1 },
            icon: 'ra-biohazard'
        }
    ],
    bone_wall: [
        {
            id: 'bw_fortress', name: 'Ossified Wall', max: 5, reqBaseLevel: 5,
            desc: '+20% Wall HP and +1s duration.',
            masteryPerk: 'Bone Wall spikes deal 50% physical damage to melee attackers.',
            mod: { petHpPct: 20 },
            icon: 'ra-castle-flag'
        }
    ],
    bone_armor: [
        {
            id: 'ba_hardened', name: 'Hardened Marrow', max: 5, reqBaseLevel: 5,
            desc: '+100 Absorption per level.',
            masteryPerk: 'Bone Armor grants 20% Physical Damage Reduction while active.',
            mod: { absorbCap: 100 },
            icon: 'ra-skeleton-arm'
        }
    ],
    poison_dagger: [
        {
            id: 'pd_toxic', name: 'Plague Strike', max: 5, reqBaseLevel: 1,
            desc: '+15% Poison Damage and +0.5s duration.',
            masteryPerk: 'Poison Dagger hits release a small Poison Nova.',
            mod: { poisDmgPct: 15 },
            icon: 'ra-dripping-blade'
        }
    ],
    toxic_spores: [
        {
            id: 'ts_decay', name: 'Necrotic Decay', max: 5, reqBaseLevel: 10,
            desc: '+5% Healing reduction and +10% Poison duration.',
            masteryPerk: 'Your poison spells also reduce enemy damage dealt by 10%.',
            mod: { healRedPct: 5 },
            icon: 'ra-bubbles'
        }
    ],
    corpse_explosion: [
        {
            id: 'ce_detonator', name: 'Chain Reaction', max: 5, reqBaseLevel: 10,
            desc: '+10% Damage and +15% radius.',
            masteryPerk: 'Corpse Explosion has a 20% chance to consume 2 corpses for double damage.',
            mod: { pctDmg: 10, radiusPct: 15 },
            icon: 'ra-bomb-explosion'
        }
    ],
    bone_mastery: [
        {
            id: 'bm_spirit', name: 'Bone Weaver', max: 5, reqBaseLevel: 1,
            desc: '+5% Bone spell damage and +2% Magic Pierce.',
            masteryPerk: 'Bone spells have a 10% chance to grant a free Bone Armor stack.',
            mod: { pctDmg: 5, magicPierce: 2 },
            icon: 'ra-broken-bone'
        }
    ],
    blood_mastery: [
        {
            id: 'bm_sanguine', name: 'Blood Lord', max: 5, reqBaseLevel: 15,
            desc: '+2% HP and +0.5% Life Steal per level.',
            masteryPerk: 'While at full health, your life steal contributes to a blood shield.',
            mod: { pctHP: 2, lifeStealPct: 0.5 },
            icon: 'ra-droplet'
        }
    ],
    bone_spirit: [
        {
            id: 'bs_haunt', name: 'Vengeful Spirit', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +15% tracking speed.',
            masteryPerk: 'Bone Spirit has a 30% chance to not be consumed on hit.',
            mod: { pctDmg: 20 },
            icon: 'ra-ghost'
        }
    ],

    // --- CURSES TREE ---
    weaken: [
        {
            id: 'we_enfeeble', name: 'Total Enfeeblement', max: 5, reqBaseLevel: 1,
            desc: 'Enemy damage reduced by an additional 4%.',
            masteryPerk: 'Weakened enemies take 15% more damage from your minions.',
            mod: { dmgRedPct: 4 },
            icon: 'ra-broken-heart'
        }
    ],
    amplify_damage: [
        {
            id: 'ad_shred', name: 'Deep Vulnerability', max: 5, reqBaseLevel: 1,
            desc: 'Increases physical damage taken by an additional 5%.',
            masteryPerk: 'Amplify Damage also reduces enemy armor by 30%.',
            mod: { physDmgPct: 5 },
            icon: 'ra-shattered-sword'
        }
    ],
    decrepify: [
        {
            id: 'de_wither', name: 'Withering Bloom', max: 5, reqBaseLevel: 10,
            desc: '+5% Slow and +5% physical vulnerability.',
            masteryPerk: 'Decrepify duration is refreshed when the target is hit by a minion.',
            mod: { slowPct: 5 },
            icon: 'ra-pawn'
        }
    ],
    terror: [
        {
            id: 'te_nightmare', name: 'Living Nightmare', max: 5, reqBaseLevel: 5,
            desc: '+1s Fear duration and +10% Slow while fleeing.',
            masteryPerk: 'Terror has a 20% chance to stun enemies for 1s when it expires.',
            mod: { duration: 1, slowPct: 10 },
            icon: 'ra-ghost'
        }
    ],
    iron_maiden: [
        {
            id: 'im_spikes', name: 'Razor Curse', max: 5, reqBaseLevel: 5,
            desc: '+20% Reflect damage bonus.',
            masteryPerk: 'Iron Maiden also causes the target to bleed for 20% damage dealt.',
            mod: { reflectBonus: 20 },
            icon: 'ra-sword-clash'
        }
    ],
    confuse: [
        {
            id: 'co_chaos', name: 'Chaotic Minds', max: 5, reqBaseLevel: 10,
            desc: '+2s duration and +10% Enemy Attack Speed while confused.',
            masteryPerk: 'Confused enemies deal 50% more damage to their allies.',
            mod: { duration: 2 },
            icon: 'ra-implosion'
        }
    ],
    life_tap_curse: [
        {
            id: 'ltc_vampire', name: 'Eternal Life', max: 5, reqBaseLevel: 10,
            desc: '+10% Healing amount from curse.',
            masteryPerk: 'Life Tap also restores 1% Mana on hit.',
            mod: { healPct: 10 },
            icon: 'ra-droplet'
        }
    ],
    revive_elite: [
        {
            id: 're_master', name: 'Spirit Weaver', max: 5, reqBaseLevel: 15,
            desc: '+15% Revive damage and +10% duration.',
            masteryPerk: 'Revived enemies now have a 50% chance to spawn a skeleton when they die.',
            mod: { petDmgPct: 15 },
            icon: 'ra-ghost'
        }
    ],
    lower_resist: [
        {
            id: 'lr_doom', name: 'Resistant Doom', max: 5, reqBaseLevel: 20,
            desc: 'Reduces enemy resistances by an additional 4%.',
            masteryPerk: 'Lower Resist also reduces enemy Magic Resistance by 30%.',
            mod: { resRedPct: 4 },
            icon: 'ra-broken-bone'
        }
    ],
    bone_prison: [
        {
            id: 'bp_cage', name: 'Cage of Bones', max: 5, reqBaseLevel: 20,
            desc: '+20% Prison HP and +2s duration.',
            masteryPerk: 'Bone Prison periodically shoots bone shards at the trapped targets.',
            mod: { petHpPct: 20 },
            icon: 'ra-skeleton-arm'
        }
    ],
    curse_mastery: [
        {
            id: 'cm_arcane', name: 'Calamity', max: 5, reqBaseLevel: 30,
            desc: '+10% Curse effect and +20% duration.',
            masteryPerk: 'Your curses can no longer be dispelled by normal means.',
            mod: { curseEffectPct: 10 },
            icon: 'ra-implosion'
        }
    ]
};
