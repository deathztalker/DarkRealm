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
        },
        {
            id: 'sm_legion', name: 'Mage Legion', max: 5, reqBaseLevel: 10,
            desc: '+1 max Skeletal Mages and +10% Minion Speed.',
            masteryPerk: 'Skeletal Mages now have a 25% chance to cast their spell twice.',
            mod: { maxPets: 1, petMoveSpeed: 10 },
            icon: 'ra-pawn'
        }
    ],
    skeleton_mastery: [
        {
            id: 'sm_overlord', name: 'Overlord', max: 5, reqBaseLevel: 1,
            desc: '+10% Minion Damage and +5% Minion Speed.',
            masteryPerk: 'Skeletons gain 10% of your maximum health as bonus health.',
            mod: { petDmgPct: 10, petMoveSpeed: 5 },
            icon: 'ra-skeleton-arm'
        },
        {
            id: 'sm_undying', name: 'Undying Horde', max: 5, reqBaseLevel: 5,
            desc: '+10% Minion Armor and +5% Resistance per level.',
            masteryPerk: 'Your minions now regenerate 2% of their maximum health per second.',
            mod: { petArmorPct: 10, petRes: 5 },
            icon: 'ra-heart-towers'
        }
    ],
    clay_golem: [
        {
            id: 'cg_mud', name: 'Quicksand', max: 5, reqBaseLevel: 1,
            desc: '+10% Slow effect and +15% Golem HP.',
            masteryPerk: 'Clay Golem generates high threat and has a 20% chance to stun on hit.',
            mod: { slowPct: 10, petHpPct: 15 },
            icon: 'ra-mountain-cave'
        },
        {
            id: 'cg_earthquake', name: 'Tectonic Golem', max: 5, reqBaseLevel: 5,
            desc: '+20% Golem Damage and +10% AoE Radius.',
            masteryPerk: 'Clay Golem now releases a tremor every 5s that stuns nearby enemies for 1s.',
            mod: { petDmgPct: 20, radiusPct: 10 },
            icon: 'ra-cracks'
        }
    ],
    golem_mastery: [
        {
            id: 'gm_colossus', name: 'Colossus', max: 5, reqBaseLevel: 1,
            desc: '+20% Golem HP and +10% Golem Armor.',
            masteryPerk: 'Golems regenerate 5% of their maximum health every second.',
            mod: { petHpPct: 20, petArmorPct: 10 },
            icon: 'ra-mountain-cave'
        },
        {
            id: 'gm_titan', name: 'Titan\'s Might', max: 5, reqBaseLevel: 5,
            desc: '+15% Golem Damage and +5% Golem Attack Speed.',
            masteryPerk: 'Golems now deal 50% area damage with their basic attacks.',
            mod: { petDmgPct: 15, petIas: 5 },
            icon: 'ra-muscle-fat'
        }
    ],
    blood_golem: [
        {
            id: 'bg_vampire', name: 'Sanguine Bond', max: 5, reqBaseLevel: 5,
            desc: '+5% Life Steal share and +20% Golem damage.',
            masteryPerk: 'Blood Golem heals the master for 100% of its damage dealt.',
            mod: { lifestealPct: 5 },
            icon: 'ra-droplet'
        },
        {
            id: 'bg_sacrifice', name: 'Sanguine Sacrifice', max: 5, reqBaseLevel: 10,
            desc: '+10% Master DR and +10% Golem Health.',
            masteryPerk: 'When the master takes damage, 30% of it is redirected to the Blood Golem.',
            mod: { drPct: 10, petHpPct: 10 },
            icon: 'ra-drop'
        }
    ],
    minion_instability: [
        {
            id: 'mi_volatile', name: 'Volatile Flesh', max: 5, reqBaseLevel: 10,
            desc: '+10% Explosion damage and +15% radius.',
            masteryPerk: 'Minion explosions apply a 3s decay effect that deals damage over time.',
            mod: { explodeDmgPct: 10 },
            icon: 'ra-biohazard'
        },
        {
            id: 'mi_bombard', name: 'Bombardment', max: 5, reqBaseLevel: 15,
            desc: '+15% Explosion Damage and +10% Projectile Damage.',
            masteryPerk: 'Minion explosions now launch 3 bone shards at nearby targets.',
            mod: { explodeDmgPct: 15, projDmgPct: 10 },
            icon: 'ra-bomb-explosion'
        }
    ],
    iron_golem: [
        {
            id: 'ig_spikes', name: 'Thorny Plate', max: 5, reqBaseLevel: 10,
            desc: 'Golem gains +50 Thorns per level.',
            masteryPerk: 'Iron Golem inherits all offensive mods from the item used to create it.',
            mod: { thorns: 50 },
            icon: 'ra-shield'
        },
        {
            id: 'ig_magnetism', name: 'Aetheric Attractor', max: 5, reqBaseLevel: 15,
            desc: '+15% Golem Armor and +10% Threat generation.',
            masteryPerk: 'Iron Golem now pulls nearby enemies toward itself every 6s.',
            mod: { petArmorPct: 15, threatPct: 10 },
            icon: 'ra-implosion'
        }
    ],
    death_commander: [
        {
            id: 'dc_fervor', name: 'Commander\'s Fervor', max: 5, reqBaseLevel: 15,
            desc: '+10% Minion Damage bonus and +5s duration.',
            masteryPerk: 'During Death Commander, your minions have a 20% chance to cast Teeth on hit.',
            mod: { petDmgPct: 10 },
            icon: 'ra-burning-embers'
        },
        {
            id: 'dc_authority', name: 'Absolute Authority', max: 5, reqBaseLevel: 20,
            desc: '+15% Minion Crit Chance and +10% Minion Speed.',
            masteryPerk: 'While Death Commander is active, your minions are immune to all CC.',
            mod: { petCritChance: 15, petMoveSpeed: 10 },
            icon: 'ra-queen-crown'
        }
    ],
    fire_golem: [
        {
            id: 'fg_blaze', name: 'Hellfire Aura', max: 5, reqBaseLevel: 15,
            desc: '+20% Aura damage and +10% Golem Speed.',
            masteryPerk: 'Fire Golem explodes for 200% weapon damage when killed.',
            mod: { auraDmgPct: 20 },
            icon: 'ra-flame-symbol'
        },
        {
            id: 'fg_inferno', name: 'Infernal Core', max: 5, reqBaseLevel: 20,
            desc: '+25% Fire Damage and +10% Burn Chance.',
            masteryPerk: 'Fire Golem\'s aura now reduces enemy fire resistance by 20%.',
            mod: { fireDmgPct: 25, burnChance: 10 },
            icon: 'ra-fire-nova'
        }
    ],
    army_of_dead: [
        {
            id: 'aod_swarm', name: 'Swarm of Souls', max: 5, reqBaseLevel: 25,
            desc: '+1 extra skeleton raised and +2s duration.',
            masteryPerk: 'Army of the Dead summons also explode on expiration.',
            mod: { extraSkeletons: 1 },
            icon: 'ra-skull'
        },
        {
            id: 'aod_corpse_fuel', name: 'Corpse Fuel', max: 5, reqBaseLevel: 30,
            desc: '+20% Damage and +10% Cooldown Reduction.',
            masteryPerk: 'Army of the Dead now consumes corpses to increase its duration by 1s each.',
            mod: { pctDmg: 20, cdRedPct: 10 },
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
        },
        {
            id: 'te_vampire', name: 'Lacerating Teeth', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and +2% Life Steal for Teeth.',
            masteryPerk: 'Teeth now causes targets to bleed for 40% damage over 4s.',
            mod: { pctDmg: 15, lifeStealPct: 2 },
            icon: 'ra-dripping-blade'
        }
    ],
    bone_spear: [
        {
            id: 'bs_heavy', name: 'Unstoppable Force', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% projectile speed.',
            masteryPerk: 'Bone Spear damage no longer reduces as it pierces.',
            mod: { pctDmg: 15 },
            icon: 'ra-spear-head'
        },
        {
            id: 'bs_splinter', name: 'Splintering Spear', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +10% Split Chance.',
            masteryPerk: 'Bone Spear now releases 3 bone shards upon hitting an enemy.',
            mod: { pctDmg: 20 },
            icon: 'ra-split-body'
        }
    ],
    poison_nova: [
        {
            id: 'pn_radius', name: 'Toxic Cloud', max: 5, reqBaseLevel: 15,
            desc: '+15% Nova radius and +1s duration.',
            masteryPerk: 'Poison Nova reduces enemy poison resistance by 20% for 5s.',
            mod: { radiusPct: 15, duration: 1 },
            icon: 'ra-biohazard'
        },
        {
            id: 'pn_toxic_waste', name: 'Toxic Waste', max: 5, reqBaseLevel: 20,
            desc: '+20% Poison Damage and +10% Slow effect.',
            masteryPerk: 'Poison Nova now leaves a trail of toxic gas that lasts for 4s.',
            mod: { poisDmgPct: 20, slowPct: 10 },
            icon: 'ra-bubbles'
        }
    ],
    bone_wall: [
        {
            id: 'bw_fortress', name: 'Ossified Wall', max: 5, reqBaseLevel: 5,
            desc: '+20% Wall HP and +1s duration.',
            masteryPerk: 'Bone Wall spikes deal 50% physical damage to melee attackers.',
            mod: { petHpPct: 20 },
            icon: 'ra-castle-flag'
        },
        {
            id: 'bw_shatter', name: 'Bone Shrapnel', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% Explosion Radius on death.',
            masteryPerk: 'Bone Wall segments explode for 100% damage when destroyed.',
            mod: { explodeDmgPct: 15 },
            icon: 'ra-bomb-explosion'
        }
    ],
    bone_armor: [
        {
            id: 'ba_hardened', name: 'Hardened Marrow', max: 5, reqBaseLevel: 5,
            desc: '+100 Absorption per level.',
            masteryPerk: 'Bone Armor grants 20% Physical Damage Reduction while active.',
            mod: { absorbCap: 100 },
            icon: 'ra-skeleton-arm'
        },
        {
            id: 'ba_spikes', name: 'Bone Spikes', max: 5, reqBaseLevel: 10,
            desc: '+10% Reflect Damage and +5% Armor.',
            masteryPerk: 'Bone Armor now releases a wave of bone shards when a layer is lost.',
            mod: { reflectPct: 10, pctArmor: 5 },
            icon: 'ra-dripping-blade'
        }
    ],
    poison_dagger: [
        {
            id: 'pd_toxic', name: 'Plague Strike', max: 5, reqBaseLevel: 1,
            desc: '+15% Poison Damage and +0.5s duration.',
            masteryPerk: 'Poison Dagger hits release a small Poison Nova.',
            mod: { poisDmgPct: 15 },
            icon: 'ra-dripping-blade'
        },
        {
            id: 'pd_infect', name: 'Contagion', max: 5, reqBaseLevel: 5,
            desc: '+10% Poison Damage and +10% Infection Chance.',
            masteryPerk: 'Poison Dagger kills now automatically trigger a small Poison Nova.',
            mod: { poisDmgPct: 10 },
            icon: 'ra-biohazard'
        }
    ],
    toxic_spores: [
        {
            id: 'ts_decay', name: 'Necrotic Decay', max: 5, reqBaseLevel: 10,
            desc: '+5% Healing reduction and +10% Poison duration.',
            masteryPerk: 'Your poison spells also reduce enemy damage dealt by 10%.',
            mod: { healRedPct: 5 },
            icon: 'ra-bubbles'
        },
        {
            id: 'ts_lethal', name: 'Deadly Poison', max: 5, reqBaseLevel: 15,
            desc: '+20% Poison Damage and +5% Crit Chance.',
            masteryPerk: 'Toxic Spores now reduces enemy all resistance by 15% for 4s.',
            mod: { poisDmgPct: 20, critChance: 5 },
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
        },
        {
            id: 'ce_vile', name: 'Vile Burst', max: 5, reqBaseLevel: 15,
            desc: '+15% Poison Damage conversion and +10% Radius.',
            masteryPerk: 'Corpse Explosion now leaves a toxic cloud that deals 20% damage per second.',
            mod: { poisConvPct: 15, radiusPct: 10 },
            icon: 'ra-bubbles'
        }
    ],
    bone_mastery: [
        {
            id: 'bm_spirit', name: 'Bone Weaver', max: 5, reqBaseLevel: 1,
            desc: '+5% Bone spell damage and +2% Magic Pierce.',
            masteryPerk: 'Bone spells have a 10% chance to grant a free Bone Armor stack.',
            mod: { pctDmg: 5, magicPierce: 2 },
            icon: 'ra-broken-bone'
        },
        {
            id: 'bm_ossify', name: 'Ossification', max: 5, reqBaseLevel: 5,
            desc: '+10% Armor and +5% Health while using bone skills.',
            masteryPerk: 'Bone spells have a 10% chance to stun targets for 1s.',
            mod: { pctArmor: 10, pctHP: 5 },
            icon: 'ra-skeleton-arm'
        }
    ],
    blood_mastery: [
        {
            id: 'bm_sanguine', name: 'Blood Lord', max: 5, reqBaseLevel: 15,
            desc: '+2% HP and +0.5% Life Steal per level.',
            masteryPerk: 'While at full health, your life steal contributes to a blood shield.',
            mod: { pctHP: 2, lifeStealPct: 0.5 },
            icon: 'ra-droplet'
        },
        {
            id: 'bm_thirst', name: 'Sanguine Thirst', max: 5, reqBaseLevel: 20,
            desc: '+10% Healing efficiency and +5% Crit Multi.',
            masteryPerk: 'Blood spells now restore 1% of your maximum health on hit.',
            mod: { healEffPct: 10, critMulti: 5 },
            icon: 'ra-dripping-blade'
        }
    ],
    bone_spirit: [
        {
            id: 'bs_haunt', name: 'Vengeful Spirit', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +15% tracking speed.',
            masteryPerk: 'Bone Spirit has a 30% chance to not be consumed on hit.',
            mod: { pctDmg: 20 },
            icon: 'ra-ghost'
        },
        {
            id: 'bs_soul_eater', name: 'Soul Eater', max: 5, reqBaseLevel: 20,
            desc: '+15% Damage and +10% Mana restored on kill.',
            masteryPerk: 'Bone Spirit now explodes for 50% area damage upon hitting its target.',
            mod: { pctDmg: 15, manaOnKill: 10 },
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
        },
        {
            id: 'we_fragility', name: 'Brittle Bones', max: 5, reqBaseLevel: 5,
            desc: 'Enemies take +10% Physical Damage and have -5% Armor.',
            masteryPerk: 'Weakened enemies have a 15% chance to be stunned when hit.',
            mod: { physDmgTakenPct: 10, armorShredPct: 5 },
            icon: 'ra-broken-bone'
        }
    ],
    amplify_damage: [
        {
            id: 'ad_shred', name: 'Deep Vulnerability', max: 5, reqBaseLevel: 1,
            desc: 'Increases physical damage taken by an additional 5%.',
            masteryPerk: 'Amplify Damage also reduces enemy armor by 30%.',
            mod: { physDmgPct: 5 },
            icon: 'ra-shattered-sword'
        },
        {
            id: 'ad_echo', name: 'Echoing Curse', max: 5, reqBaseLevel: 5,
            desc: '+20% Curse Radius and +10% Duration.',
            masteryPerk: 'Amplify Damage now spreads to a nearby enemy when the target dies.',
            mod: { radiusPct: 20, durationPct: 10 },
            icon: 'ra-implosion'
        }
    ],
    decrepify: [
        {
            id: 'de_wither', name: 'Withering Bloom', max: 5, reqBaseLevel: 10,
            desc: '+5% Slow and +5% physical vulnerability.',
            masteryPerk: 'Decrepify duration is refreshed when the target is hit by a minion.',
            mod: { slowPct: 5 },
            icon: 'ra-pawn'
        },
        {
            id: 'de_exhaust', name: 'Exhaustion', max: 5, reqBaseLevel: 15,
            desc: 'Enemies deal 10% less damage and are slowed by an additional 5%.',
            masteryPerk: 'Decrepify now reduces enemy attack speed by an additional 20%.',
            mod: { enemyDmgRedPct: 10, slowPct: 5 },
            icon: 'ra-hourglass'
        }
    ],
    terror: [
        {
            id: 'te_nightmare', name: 'Living Nightmare', max: 5, reqBaseLevel: 5,
            desc: '+1s Fear duration and +10% Slow while fleeing.',
            masteryPerk: 'Terror has a 20% chance to stun enemies for 1s when it expires.',
            mod: { duration: 1, slowPct: 10 },
            icon: 'ra-ghost'
        },
        {
            id: 'te_dread', name: 'Dread Aura', max: 5, reqBaseLevel: 10,
            desc: '+15% Radius and +10% Slow effect.',
            masteryPerk: 'Enemies affected by Terror now also take 20% increased damage.',
            mod: { radiusPct: 15, slowPct: 10 },
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
        },
        {
            id: 'im_thorn_aura', name: 'Thorn Aura', max: 5, reqBaseLevel: 10,
            desc: '+15% Reflect Damage and +10% All Res while active.',
            masteryPerk: 'Iron Maiden now reflects 50% of spell damage back to the caster.',
            mod: { reflectPct: 15, allRes: 10 },
            icon: 'ra-shield'
        }
    ],
    confuse: [
        {
            id: 'co_chaos', name: 'Chaotic Minds', max: 5, reqBaseLevel: 10,
            desc: '+2s duration and +10% Enemy Attack Speed while confused.',
            masteryPerk: 'Confused enemies deal 50% more damage to their allies.',
            mod: { duration: 2 },
            icon: 'ra-implosion'
        },
        {
            id: 'co_paranoia', name: 'Paranoia', max: 5, reqBaseLevel: 15,
            desc: 'Confused enemies deal +20% damage and take +10% damage.',
            masteryPerk: 'Confused enemies now have a 10% chance to cast their primary skill on allies.',
            mod: { enemyDmgDealtPct: 20, enemyDmgTakenPct: 10 },
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
        },
        {
            id: 'ltc_siphon', name: 'Siphon Soul', max: 5, reqBaseLevel: 15,
            desc: '+15% Healing and +5% Max HP bonus.',
            masteryPerk: 'Life Tap now heals all nearby allies for 50% of the primary effect.',
            mod: { healPct: 15, pctHP: 5 },
            icon: 'ra-heart-towers'
        }
    ],
    revive_elite: [
        {
            id: 're_master', name: 'Spirit Weaver', max: 5, reqBaseLevel: 15,
            desc: '+15% Revive damage and +10% duration.',
            masteryPerk: 'Revived enemies now have a 50% chance to spawn a skeleton when they die.',
            mod: { petDmgPct: 15 },
            icon: 'ra-ghost'
        },
        {
            id: 're_vengeance', name: 'Vengeful Spirits', max: 5, reqBaseLevel: 20,
            desc: '+20% Revive Damage and +10% Attack Speed.',
            masteryPerk: 'Revived elites now grant 10% of their primary stat to the master.',
            mod: { petDmgPct: 20, petIas: 10 },
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
        },
        {
            id: 'lr_chaos', name: 'Elemental Chaos', max: 5, reqBaseLevel: 25,
            desc: 'Reduces enemy resistance by an additional 5% and adds 10% Chaos damage.',
            masteryPerk: 'Lower Resist now removes all elemental immunities from enemies.',
            mod: { resRedPct: 5 },
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
        },
        {
            id: 'bp_spikes', name: 'Spiked Prison', max: 5, reqBaseLevel: 25,
            desc: '+15% Reflect Damage and +10% Armor for the prison.',
            masteryPerk: 'Enemies in Bone Prison take 30% increased physical damage.',
            mod: { reflectPct: 15 },
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
        },
        {
            id: 'cm_eternal', name: 'Eternal Doom', max: 5, reqBaseLevel: 35,
            desc: '+15% Curse effect and +10% Cooldown Reduction for curses.',
            masteryPerk: 'Casting a curse now restores 5% of your maximum Mana.',
            mod: { curseEffectPct: 15, cdRedPct: 10 },
            icon: 'ra-sun-glow'
        }
    ]
};
