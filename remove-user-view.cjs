const fs = require('fs');
let lines = fs.readFileSync('d:/Downloads/安忆/src/App.tsx', 'utf8').split(/\r?\n/);

let startIdx = lines.findIndex(l => l.includes('/* ========= USER ORDER TRACKING VIEW ========= */'));
if (startIdx !== -1) {
  let endIdx = startIdx;
  let braces = 0;
  // We need to remove the wrapper that is:
  //                 ) : (
  //                   /* ========= USER ORDER TRACKING VIEW ========= */
  
  // Actually let's just find the closing tag for the wrapper
  let foundEnd = false;
  while(endIdx < lines.length) {
    if (lines[endIdx].includes('</motion.div>')) {
      // The user view ends with `)) ) )}` or something similar
      foundEnd = true;
    }
    if (foundEnd && lines[endIdx].includes(')}')) {
        endIdx++;
        break;
    }
    endIdx++;
  }
  
  // The line above startIdx is `) : (`
  lines.splice(startIdx - 1, endIdx - startIdx + 1);
  fs.writeFileSync('d:/Downloads/安忆/src/App.tsx', lines.join('\n'));
  console.log('Removed user view correctly. Lines removed:', endIdx - startIdx + 1);
} else {
  console.log('User view not found');
}
