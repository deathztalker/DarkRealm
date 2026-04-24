const fs = require('fs');
const path = 'src/main.js';
const fixPath = 'scratch/loop_fix.js';

let content = fs.readFileSync(path, 'utf8').split('\n');
const fixContent = fs.readFileSync(fixPath, 'utf8');

// The broken section starts at index 822 (line 823)
// It ends at index 1580 (line 1581)
// Splice count: 1581 - 823 + 1 = 759
content.splice(822, 759, fixContent);

fs.writeFileSync(path, content.join('\n'));
console.log('Main loop restored and consolidated.');
