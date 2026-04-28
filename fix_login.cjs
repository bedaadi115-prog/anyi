const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/existingUser\._id/g, 'existingUser.id');

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed existingUser.id');
