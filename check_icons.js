const fs = require('fs');
const itemsFile = fs.readFileSync('src/data/items.js', 'utf8');
const regex = /icon:\s*'([^']+)'/g;
let match;
const requiredIcons = new Set();
while ((match = regex.exec(itemsFile)) !== null) {
    requiredIcons.add(match[1]);
}
const missing = [];
requiredIcons.forEach(icon => {
    if (!fs.existsSync('assets/' + icon + '.png')) {
        missing.push(icon);
    }
});
console.log('Missing item icons:');
console.log(missing.join('\n'));
