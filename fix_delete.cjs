const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update handleDelete to refresh the UI
content = content.replace(
  /const handleDelete = async \(id: string\) => \{[\s\S]*?alert\('删除失败'\);\s*\n\s*\}\s*\n\s*\};/,
  `const handleDelete = async (id: string) => {
    if (!confirm('确定要撤销这条记录吗？撤销后将无法恢复。')) return;
    try {
      await fetch(\`/api/memorials/\${id}\`, { method: 'DELETE' });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('撤销失败');
    }
  };`
);

// 2. Add the delete button to renderUserOrderTrackingView
content = content.replace(
  /<span className="text-\[11px\] text-\[#2c2c2c\]\/40 font-bold uppercase tracking-widest">\{formatTime\(m\.created_at\)\}<\/span>\s*<\/div>\s*<div className="flex items-center gap-1">/,
  `<div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#2c2c2c]/40 font-bold uppercase tracking-widest">{formatTime(m.created_at)}</span>
                    <button onClick={() => handleDelete(m.id)} className="text-[11px] px-2 py-1 bg-red-50 text-red-500 rounded-md hover:bg-red-100 font-bold transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3" />撤销</button>
                  </div>
                </div>
                <div className="flex items-center gap-1">`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Added delete button to user order tracking view');
