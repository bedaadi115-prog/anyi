const fs = require('fs');
let code = fs.readFileSync('d:/Downloads/安忆/src/App.tsx', 'utf8');

// 1. Update AppUser interface
code = code.replace(
  /interface AppUser \{\r?\n    id: string;\r?\n    email: string;\r?\n    name: string;\r?\n    role: 'user' \| 'admin';\r?\n  \}/,
  `interface AppUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'user' | 'admin';
  }`
);

// 2. Add avatar to setCurrentUser in three places
code = code.replace(
  /name: userDoc.name,\r?\n                role: userDoc.role/,
  `name: userDoc.name,
                role: userDoc.role,
                avatar: userDoc.avatar`
);

code = code.replace(
  /name: existingUser.name,\r?\n            role: existingUser.role/,
  `name: existingUser.name,
            role: existingUser.role,
            avatar: existingUser.avatar`
);

code = code.replace(
  /name: uName.trim\(\),\r?\n            role: assignedRole as any/,
  `name: uName.trim(),
            role: assignedRole as any,
            avatar: ''`
);

// 3. Define UserProfileSettings component before App
const profileSettingsComponent = `
const UserProfileSettings = ({ currentUser, setCurrentUser, db }: any) => {
  const [name, setName] = React.useState(currentUser?.name || '');
  const [avatar, setAvatar] = React.useState(currentUser?.avatar || '');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      const updateData = { name: name.trim(), avatar: avatar.trim() };
      const res = await db.collection('users').where({ _id: currentUser.id }).update(updateData);
      if (res.updated === 0) {
        await db.collection('users').doc(currentUser.id).update(updateData);
      }
      setCurrentUser((prev: any) => ({ ...prev, ...updateData }));
      setMessage('保存成功！');
    } catch (e) {
      console.error(e);
      setMessage('保存失败: ' + (e.message || e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-[#5A5A40]/10 flex items-center justify-center overflow-hidden border-2 border-[#5A5A40]/20 shadow-md">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-[#5A5A40]" />
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#5A5A40] mb-1.5 ml-1">昵称</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 transition-all placeholder-[#2c2c2c]/30"
            placeholder="请输入您的昵称"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#5A5A40] mb-1.5 ml-1">头像图片地址 (URL)</label>
          <input 
            type="text" 
            value={avatar} 
            onChange={e => setAvatar(e.target.value)}
            className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 transition-all placeholder-[#2c2c2c]/30"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
      </div>

      {message && (
        <p className={\`text-center text-xs font-medium \${message.includes('成功') ? 'text-green-600' : 'text-red-500'}\`}>{message}</p>
      )}

      <button 
        onClick={handleSave} 
        disabled={isSubmitting}
        className="w-full bg-[#5A5A40] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-[#4a4a35] transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
        保存个人资料
      </button>
    </div>
  );
};
`;

code = code.replace(/export default function App\(\) \{/, profileSettingsComponent + '\nexport default function App() {');

// 4. Restore Profile button
code = code.replace(
  /\{currentUser\.role === 'admin' && \(\r?\n\s*<button \r?\n\s*onClick=\{([^}]+)\}\r?\n\s*className="([^"]+)"\r?\n\s*>\r?\n\s*<Shield className="w-3.5 h-3.5" \/>\r?\n\s*<span className="font-medium text-sm">管理中心<\/span>\r?\n\s*<\/button>\r?\n\s*\)\}/,
  `<button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-2 rounded-xl shadow-md hover:bg-[#4a4a35] transition-all hover:-translate-y-0.5"
            >
              {currentUser.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              <span className="font-medium text-sm">{currentUser.role === 'admin' ? '管理中心' : '个人中心'}</span>
            </button>`
);

// 5. Update Profile modal title text
code = code.replace(
  /<p className="text-sm text-\[#2c2c2c\]\/60">审核订单・确认付费・对接用户・跟踪进度<\/p>/,
  `<p className="text-sm text-[#2c2c2c]/60">{currentUser?.role === 'admin' ? '审核订单・确认付费・对接用户・跟踪进度' : '管理您的个人资料'}</p>`
);
code = code.replace(
  /<h3 className="text-xl font-serif font-bold text-\[#2c2c2c\]">订单管理中心<\/h3>/,
  `<h3 className="text-xl font-serif font-bold text-[#2c2c2c]">{currentUser?.role === 'admin' ? '订单管理中心' : '个人中心'}</h3>`
);

// 6. Restore ternary operator in Profile modal
// Find the beginning of admin view
code = code.replace(
  /\{\/\* ========= ADMIN ORDER MANAGEMENT VIEW ========= \*\/\}\r?\n\s*\{\(\(\) => \{/,
  `{currentUser?.role === 'admin' ? (
                  /* ========= ADMIN ORDER MANAGEMENT VIEW ========= */
                  (() => {`
);

// Find the end of admin view
code = code.replace(
  /                  \)\);\r?\n                  \}\)\(\)\}\r?\n              <\/div>/,
  `                  ));
                  })()
                ) : (
                  /* ========= USER PROFILE VIEW ========= */
                  <UserProfileSettings currentUser={currentUser} setCurrentUser={setCurrentUser} db={db} />
                )}
              </div>`
);


// 7. Render avatar instead of default icons where appropriate (Chat, Forum)
// Forum posts avatar:
code = code.replace(
  /<div className="w-10 h-10 rounded-full bg-\[#5A5A40\]\/10 flex items-center justify-center shrink-0">/,
  `<div className="w-10 h-10 rounded-full bg-[#5A5A40]/10 flex items-center justify-center shrink-0 overflow-hidden">`
);
code = code.replace(
  /\{post\.user_role === 'admin' \? <Shield className="w-5 h-5 text-\[#5A5A40\]" \/> : <User className="w-5 h-5 text-\[#5A5A40\]" \/>\}/,
  `{post.user_role === 'admin' ? <Shield className="w-5 h-5 text-[#5A5A40]" /> : <User className="w-5 h-5 text-[#5A5A40]" />}`
); // Need to fetch user avatars for forum posts? Maybe too complex. Just leave forum posts alone, or we can use generic.

// Modal header avatar:
code = code.replace(
  /\{currentUser\?\.role === 'admin' \? <Shield className="w-5 h-5 text-\[#5A5A40\]" \/> : <User className="w-5 h-5 text-\[#5A5A40\]" \/>\}/,
  `{currentUser?.role === 'admin' ? <Shield className="w-5 h-5 text-[#5A5A40]" /> : (currentUser?.avatar ? <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#5A5A40]" />)}`
);

// Header User Dropdown:
code = code.replace(
  /\{currentUser\.role === 'admin' \? '管理中心' : '用户'\}/,
  `{currentUser.name}`
);

fs.writeFileSync('d:/Downloads/安忆/src/App.tsx', code);
console.log('Profile settings added successfully');
