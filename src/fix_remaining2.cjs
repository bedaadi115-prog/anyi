const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// multi-line update
content = content.replace(
  /await db\.collection\('forum_posts'\)\.doc\((.*?)\)\.update\(([\s\S]*?)\);/g,
  "await fetch(`/api/forum_posts/${$1}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify($2) });"
);

// double check for any other db
content = content.replace(
  /await db\.collection\((.*?)\)\.doc\((.*?)\)\.update\(([\s\S]*?)\);/g,
  "await fetch(`/api/${$1.replace(/'/g, '')}/${$2}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify($3) });"
);

fs.writeFileSync('src/App.tsx', content);
