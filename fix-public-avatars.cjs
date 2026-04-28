const fs = require('fs');
let code = fs.readFileSync('d:/Downloads/安忆/src/App.tsx', 'utf8');

// 1. Add user_avatar when creating forum post
code = code.replace(
  /user_name: currentUser\.name,\r?\n\s*user_role: currentUser\.role\r?\n\s*\}\);/,
  `user_name: currentUser.name,
          user_role: currentUser.role,
          user_avatar: currentUser.avatar || ''
        });`
);

// 2. Add user_avatar when creating forum comment
code = code.replace(
  /user_name: currentUser\.name,\r?\n\s*content: forumCommentInput\.trim\(\),\r?\n\s*created_at: new Date\(\)\.toISOString\(\)\r?\n\s*\}/,
  `user_name: currentUser.name,
          user_avatar: currentUser.avatar || '',
          content: forumCommentInput.trim(),
          created_at: new Date().toISOString()
        }`
);

// 3. Render avatar in forum post
code = code.replace(
  /\{post\.user_role === 'admin' \? <Shield className="w-6 h-6 text-\[#5A5A40\]" \/> : <User className="w-6 h-6 text-\[#5A5A40\]" \/>\}/,
  `{post.user_avatar ? <img src={post.user_avatar} alt="avatar" className="w-full h-full object-cover" /> : (post.user_role === 'admin' ? <Shield className="w-6 h-6 text-[#5A5A40]" /> : <User className="w-6 h-6 text-[#5A5A40]" />)}`
);

// We need to add 'overflow-hidden' to the parent div of the post avatar so it is contained in the rounded-xl
code = code.replace(
  /<div className="w-12 h-12 rounded-xl bg-\[#5A5A40\]\/10 flex items-center justify-center shrink-0 border border-\[#5A5A40\]\/5 shadow-sm transition-all group-hover\/post:scale-105 group-hover\/post:bg-\[#5A5A40\]\/20">/,
  `<div className="w-12 h-12 rounded-xl bg-[#5A5A40]/10 flex items-center justify-center shrink-0 border border-[#5A5A40]/5 shadow-sm transition-all group-hover/post:scale-105 group-hover/post:bg-[#5A5A40]/20 overflow-hidden">`
);

// 4. Render avatar in forum comment
code = code.replace(
  /<div className="w-8 h-8 rounded-full bg-\[#5A5A40\]\/10 flex items-center justify-center shrink-0">/,
  `<div className="w-8 h-8 rounded-full bg-[#5A5A40]/10 flex items-center justify-center shrink-0 overflow-hidden">`
);

code = code.replace(
  /\{post\.user_role === 'admin' \? <Shield className="w-4 h-4 text-\[#5A5A40\]" \/> : <User className="w-4 h-4 text-\[#5A5A40\]" \/>\}/g,
  `{comment.user_avatar ? <img src={comment.user_avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#5A5A40]" />}`
); // Wait, the existing code for comments is probably just <User className="w-4 h-4... />

// Let's refine the forum comment replacement
code = code.replace(
  /<div className="w-8 h-8 rounded-full bg-\[#5A5A40\]\/10 flex items-center justify-center shrink-0 overflow-hidden">\r?\n\s*<User className="w-4 h-4 text-\[#5A5A40\]" \/>/,
  `<div className="w-8 h-8 rounded-full bg-[#5A5A40]/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {comment.user_avatar ? <img src={comment.user_avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#5A5A40]" />}`
);

fs.writeFileSync('d:/Downloads/安忆/src/App.tsx', code);
console.log('Avatars applied to public forum');
