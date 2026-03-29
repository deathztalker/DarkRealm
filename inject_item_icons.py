import re

js_code = """
function getIconForItem(iconStr) {
    if (!iconStr) return 'ra-circle';
    const s = iconStr.toLowerCase();
    
    // Weapons
    if (s.includes('sword') || s.includes('blade')) return 'ra-broadsword';
    if (s.includes('axe')) return 'ra-battered-axe';
    if (s.includes('mace') || s.includes('hammer') || s.includes('club')) return 'ra-hammer';
    if (s.includes('staff')) return 'ra-wooden-staff';
    if (s.includes('bow')) return 'ra-bow';
    if (s.includes('dagger')) return 'ra-daggers';
    if (s.includes('totem') || s.includes('idol')) return 'ra-totem';
    if (s.includes('wand')) return 'ra-crystal-wand';
    if (s.includes('orb') || s.includes('source')) return 'ra-gem-pendant';
    
    // Armor
    if (s.includes('cap') || s.includes('helm') || s.includes('circlet')) return 'ra-helmet';
    if (s.includes('armor') || s.includes('mail') || s.includes('robe')) return 'ra-chain-mail'; // or ra-vest
    if (s.includes('glove') || s.includes('gauntlet')) return 'ra-glove';
    if (s.includes('boot')) return 'ra-boot-stomp'; // boot
    if (s.includes('shield') || s.includes('buckler')) return 'ra-shield';
    if (s.includes('belt') || s.includes('sash')) return 'ra-belt-buckle';
    
    // Accessories & Consumables
    if (s.includes('ring')) return 'ra-diamond-ring';
    if (s.includes('amulet')) return 'ra-necklace';
    if (s.includes('hp') || s.includes('health') || (s.includes('potion') && s.includes('red'))) return 'ra-health-potion';
    if (s.includes('mp') || s.includes('mana') || (s.includes('potion') && s.includes('blue'))) return 'ra-ammo-bag'; // using ammo for mana temp or standard flask
    if (s.includes('potion')) return 'ra-potion';
    if (s.includes('rune_')) return 'ra-rune-stone';
    if (s.includes('gem_')) return 'ra-gem';
    if (s.includes('charm')) return 'ra-scroll-unfurled';
    if (s.includes('chest_open')) return 'ra-chest';
    
    // Gems specifics
    if (s.includes('ruby')) return 'ra-drop'; // red
    if (s.includes('sapphire')) return 'ra-crystal-cluster'; // blue
    if (s.includes('topaz')) return 'ra-sun'; // yellow
    if (s.includes('emerald')) return 'ra-leaf'; // green
    if (s.includes('diamond')) return 'ra-diamond'; // white
    if (s.includes('amethyst')) return 'ra-eye-shield'; // purple
    if (s.includes('skull')) return 'ra-skull';
    
    return 'ra-help';
}
"""

with open('src/main.js', 'r', encoding='utf-8') as f:
    main_js = f.read()

# Make sure we don't duplicate it
if "function getIconForItem" in main_js:
    main_js = re.sub(r'function getIconForItem\(iconStr\)\s*\{[\s\S]*?return.*\n\}', js_code.strip(), main_js)
else:
    # Append it after getIconForClass
    main_js = main_js.replace("function getIconForClass", js_code.strip() + "\n\nfunction getIconForClass")

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(main_js)

print("Injected getIconForItem!")
