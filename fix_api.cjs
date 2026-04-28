const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// replace .bind(...) with .bind(...[...].map(v => v === undefined ? null : v))
// but we have to be careful with .bind(username) etc.
content = content.replace(/\.bind\((.*?)\)/g, (match, args) => {
    if (args.includes('...[')) return match; // already fixed
    return `.bind(...[${args}].map(v => v === undefined ? null : v))`;
});

fs.writeFileSync('functions/api/[[route]].ts', content);
console.log("Fixed bind undefined to null");
