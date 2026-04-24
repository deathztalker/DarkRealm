const fs = require('fs');
const path = 'src/main.js';
let content = fs.readFileSync(path, 'utf8').split('\n');

// Remove lines 823 to 933 (0-indexed: 822 to 932)
// But wait, the line numbers might have changed if I made edits, but I haven't yet.
// However, the duplications are clear.

const newUtils = `// ——— UTILITIES & SYSTEMS ———

function unlockAchievement(id, name) {
    if (unlockedAchievements.has(id)) return;
    unlockedAchievements.add(id);
    const pop = $('achievement-popup');
    if (pop) {
        pop.querySelector('.ach-name').textContent = name;
        pop.classList.add('active');
        if (input.isMobile) input.vibrate([20, 50, 100]);
        setTimeout(() => pop.classList.remove('active'), 4000);
    }
}

function updateWeather(dt) {
    if (state !== 'GAME' || !player) return;
    const theme = window.currentTheme || 'town';
    if (theme === 'snow') fx.emitBlizzard(renderer.width, renderer.height);
    else if (theme === 'desert') fx.emitSand(renderer.width, renderer.height);
    else if (theme === 'hell') fx.emitEmbers(renderer.width, renderer.height);
    else if (theme === 'jungle' || theme === 'temple' || theme === 'grass') fx.emitRain(renderer.width, renderer.height);
}

async function fadeTransition(action) {
    const fade = $('fade-overlay');
    if (fade) fade.classList.add('active');
    await new Promise(r => setTimeout(r, 500));
    await action();
    if (fade) fade.classList.remove('active');
}

function checkSecretAchievement(enemy) {
    if (enemy.isBoss && bossDamageTaken === 0) {
        unlockAchievement('secret_immortal', 'The Untouchable (Defeat boss without taking damage)');
    }
}

bus.on('player:damaged', (amt) => {
    if (bossFightActive) bossDamageTaken += amt;
});

let lastSentX = 0, lastSentY = 0;
let bossFightActive = false;
let bossDamageTaken = 0;
`;

// Splice out the redundant part (823 to 933) and insert newUtils
// 823 is index 822. Count is 933 - 823 + 1 = 111
content.splice(822, 111, newUtils);

// Now handle the garbage at the end.
// Based on previous view, gameLoop ends around 1209.
// But there's stuff like "ctx.fillStyle = '#88aaff';" at 1210.
// We want to find the LAST closing brace of gameLoop and discard everything after it until the next real function or the end of file remnants.
// Actually, looking at 1413, there's another requestAnimationFrame(gameLoop).

// I'll search for the first "function gameLoop" and keep it until its closing brace.
let joined = content.join('\n');
const gameLoopStart = joined.indexOf('function gameLoop');
if (gameLoopStart !== -1) {
    // Find the end of gameLoop. It starts with { and ends with }
    // We need to account for nested braces.
    let braceCount = 0;
    let started = false;
    let gameLoopEnd = -1;
    for (let i = gameLoopStart; i < joined.length; i++) {
        if (joined[i] === '{') { braceCount++; started = true; }
        else if (joined[i] === '}') {
            braceCount--;
            if (started && braceCount === 0) {
                gameLoopEnd = i + 1;
                break;
            }
        }
    }
    
    if (gameLoopEnd !== -1) {
        // Now look for what comes after.
        // If the next significant text is "requestAnimationFrame(gameLoop)" or duplicate rendering logic, we cut it.
        // In the previous view, from 1210 to 1414 was redundant.
        // Let's just cut everything from gameLoopEnd to the next function definition or a known anchor.
        
        const nextPart = joined.substring(gameLoopEnd, gameLoopEnd + 2000);
        if (nextPart.includes('requestAnimationFrame(gameLoop)')) {
            // It's the redundant block.
            // We want to remove it until we hit the next real function like "function checkInteractions" (seen at 1416).
            const nextFunc = joined.indexOf('function ', gameLoopEnd);
            if (nextFunc !== -1) {
                joined = joined.substring(0, gameLoopEnd) + '\n\n' + joined.substring(nextFunc);
            }
        }
    }
}

// Remove window.rescueSharedItems
joined = joined.replace(/window\.rescueSharedItems = async function \(\) \{[\s\S]*?\}\n/g, '');

fs.writeFileSync(path, joined);
console.log('Cleanup complete.');
