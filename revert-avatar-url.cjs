const fs = require('fs');
let code = fs.readFileSync('d:/Downloads/安忆/src/App.tsx', 'utf8');

const newComponent = `const UserProfileSettings = ({ currentUser, setCurrentUser, db }: any) => {
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
    } catch (e: any) {
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
};`;

code = code.replace(/const UserProfileSettings = \(\{ currentUser, setCurrentUser, db, app \}: any\) => \{[\s\S]*?\}\s*;\s*export default function App/, newComponent + '\n\nexport default function App');

// We also need to remove the app prop where UserProfileSettings is called, if we want
code = code.replace(/<UserProfileSettings currentUser=\{currentUser\} setCurrentUser=\{setCurrentUser\} db=\{db\} app=\{app\} \/>/, '<UserProfileSettings currentUser={currentUser} setCurrentUser={setCurrentUser} db={db} />');

fs.writeFileSync('d:/Downloads/安忆/src/App.tsx', code);
console.log('Reverted to URL only avatar settings');
