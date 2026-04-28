const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 441: const commentsRes = await db.collection('comments').get(); -> await fetch('/api/comments').then(r=>r.json());
content = content.replace(
  /const commentsRes = await db\.collection\('comments'\)\.get\(\);/,
  "const commentsRes = await fetch('/api/comments').then(r=>r.json());"
);

// 860: await db.collection('messages').add({ ... })
content = content.replace(
  /await db\.collection\('messages'\)\.add\(\{([\s\S]*?)created_at: new Date\(\)\.toISOString\(\)\s*\}\);/g,
  "await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: uuidv4(), $1 created_at: new Date().toISOString() }) });"
);

// Fallback for messages.add if they don't have created_at match
content = content.replace(
  /await db\.collection\('messages'\)\.add\(\{/g,
  "await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: uuidv4(), "
);

// 875: await db.collection('memorials').doc(id).remove();
content = content.replace(
  /await db\.collection\('memorials'\)\.doc\((.*?)\)\.remove\(\);/g,
  "await fetch(`/api/memorials/${$1}`, { method: 'DELETE' });"
);

// forum_posts update
content = content.replace(
  /await db\.collection\('forum_posts'\)\.doc\((.*?)\)\.update\((.*?)\);/g,
  "await fetch(`/api/forum_posts/${$1}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify($2) });"
);

// forum_posts remove
content = content.replace(
  /await db\.collection\('forum_posts'\)\.doc\((.*?)\)\.remove\(\);/g,
  "await fetch(`/api/forum_posts/${$1}`, { method: 'DELETE' });"
);

// memorials update
content = content.replace(
  /await db\.collection\('memorials'\)\.where\(\{ _id: m\.id \}\)\.update\((.*?)\);/g,
  "await fetch(`/api/memorials/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify($1) });"
);

content = content.replace(
  /await db\.collection\('memorials'\)\.doc\((.*?)\)\.update\((.*?)\);/g,
  "await fetch(`/api/memorials/${$1}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify($2) });"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed remaining db calls!");
