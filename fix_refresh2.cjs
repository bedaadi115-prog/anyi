const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.replace(/await fetch\(`.*?`, \{\s*method: 'PUT'[\s\S]*?\}\);/g, match => {
  if (match.includes('setRefreshTrigger')) return match;
  return match + '\nsetRefreshTrigger(prev => prev + 1);';
});
fs.writeFileSync('src/App.tsx', c);
console.log('Replaced PUT');
