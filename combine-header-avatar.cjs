const fs = require('fs');
let code = fs.readFileSync('d:/Downloads/安忆/src/App.tsx', 'utf8');

const regex = /<div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">[\s\S]*?<button onClick=\{handleLogout\}[\s\S]*?<\/div>\r?\n\s*<\/div>/;

const newBlock = `<div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
            <div className="relative group/user-menu">
              {/* Trigger */}
              <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md pl-1.5 pr-4 py-1.5 rounded-full border border-white/40 shadow-sm cursor-pointer hover:bg-white/60 transition-all">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#5A5A40]/20 flex items-center justify-center bg-[#5A5A40]/5 shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-[#5A5A40]" />
                  )}
                </div>
                <span className="text-sm text-[#5A5A40] font-bold">{currentUser.name}</span>
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover/user-menu:opacity-100 group-hover/user-menu:visible transition-all duration-300 origin-top-right z-50">
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden flex flex-col p-2">
                  <div className="px-3 py-2 border-b border-[#2c2c2c]/5 mb-1">
                    <p className="text-[10px] text-[#2c2c2c]/40 font-bold uppercase tracking-widest mb-1">{currentUser.role === 'admin' ? '管理员' : '普通用户'}</p>
                    <p className="text-sm font-bold text-[#5A5A40] truncate">{currentUser.name}</p>
                  </div>
                  
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#2c2c2c] hover:bg-[#5A5A40]/5 rounded-xl transition-colors text-left font-medium"
                  >
                    {currentUser.role === 'admin' ? <Shield className="w-4 h-4 text-[#5A5A40]" /> : <User className="w-4 h-4 text-[#5A5A40]" />}
                    {currentUser.role === 'admin' ? '管理中心' : '个人资料设置'}
                  </button>
                  
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left mt-1 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>`;

if(regex.test(code)) {
    code = code.replace(regex, newBlock);
    fs.writeFileSync('d:/Downloads/安忆/src/App.tsx', code);
    console.log('Combined avatar dropdown successful');
} else {
    console.log('Regex did not match!');
}
