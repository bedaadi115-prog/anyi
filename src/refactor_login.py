import re
import os

filepath = r"d:\Downloads\云端追思 (1)\src\App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace state variables for Auth Form
old_state = r"// Auth Form State\n  const \[authMode, setAuthMode\] = useState\w*\('login'\);\n  const \[username, setUsername\] = useState\(''\);\n  const \[password, setPassword\] = useState\(''\);\n  const \[authError, setAuthError\] = useState\(''\);"
new_state = """  // Auth Form State - User
  const [userAuthMode, setUserAuthMode] = useState<'login' | 'register'>('login');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userAuthError, setUserAuthError] = useState('');
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);

  // Auth Form State - Admin
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);"""

content = re.sub(r"// Auth Form State.*?useState\(''\);", new_state, content, flags=re.DOTALL)
# Need to remove isAuthSubmitting as well
content = re.sub(r"const \[isAuthSubmitting, setIsAuthSubmitting\] = useState\(false\);\n", "", content)

# 2. Replace handleAuth with generic handleAuthSubmit
old_handle_auth = r"const handleAuth = async \(e: React\.FormEvent\) => \{.*?\n  \};\n\n  const handleLogout"
new_handle_auth = """  const handleAuthSubmit = async (
    e: React.FormEvent, 
    role: 'user' | 'admin', 
    mode: 'login' | 'register',
    uName: string, 
    uPass: string, 
    setError: (msg: string) => void, 
    setSubmitting: (val: boolean) => void
  ) => {
    e.preventDefault();
    if (!uName.trim() || !uPass.trim()) {
      setError('请输入账号和密码');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    const email = `${uName.trim()}@system.local`;
    
    try {
      const usersRes = await db.collection('users').where({ username: uName.trim() }).get();
      const existingUser = usersRes.data[0];

      if (mode === 'login') {
        if (!existingUser || existingUser.password !== uPass) {
          setError('账号或密码错误');
          setSubmitting(false);
          return;
        }
        if (role === 'admin' && existingUser.role !== 'admin') {
          setError('该账号无管理员权限');
          setSubmitting(false);
          return;
        }
        localStorage.setItem('yjas_uid', existingUser._id);
        setCurrentUser({
          id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        });
      } else {
        if (existingUser) {
          setError('该账号已被注册');
          setSubmitting(false);
          return;
        }
        
        // Ensure new registrations through 'user' form are strictly 'user' role
        const res = await db.collection('users').add({
          username: uName.trim(),
          password: uPass,
          name: uName.trim(),
          email: email,
          role: 'user',
          created_at: db.serverDate()
        });
        
        localStorage.setItem('yjas_uid', res.id);
        setCurrentUser({
          id: res.id,
          email: email,
          name: uName.trim(),
          role: 'user'
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(mode === 'login' ? '登录失败，请重试' : '注册失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout"""
content = re.sub(old_handle_auth, new_handle_auth, content, flags=re.DOTALL)


# 3. Replace the entire if (!currentUser) block
old_login_ui = r"if \(\!currentUser\) \{.*?\n  \}"
new_login_ui = """  if (!currentUser) {
    return (
      <div className="min-h-screen font-sans text-[#2c2c2c] flex flex-col items-center justify-center relative bg-cover bg-center overflow-y-auto" style={{ backgroundImage: `url('/cover-bg.jpg')` }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="relative z-10 w-full max-w-6xl px-4 py-12 flex flex-col items-center min-h-screen">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20 shadow-xl">
              <Flower2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium mb-3 tracking-wide drop-shadow-lg text-white">云端追思</h1>
            <p className="text-white/80 text-sm md:text-base font-light tracking-wider drop-shadow-md">跨越时空，寄托哀思</p>
          </motion.div>
          
          {/* Login Forms Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-16">
            
            {/* User Form */}
            <motion.form 
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              onSubmit={(e) => handleAuthSubmit(e, 'user', userAuthMode, userUsername, userPassword, setUserAuthError, setIsUserSubmitting)} 
              className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400/50 to-teal-500/50 transform origin-left transition-transform duration-500 group-hover:scale-x-100" />
              <h2 className="text-2xl font-serif font-semibold text-center text-white mb-2">
                用户通道
              </h2>
              <p className="text-white/60 text-xs text-center mb-8">{userAuthMode === 'login' ? '欢迎回来，缅怀故人' : '注册新账号，开启云端追思'}</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">用户账号</label>
                  <input
                    type="text"
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value)}
                    placeholder="请输入账号"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-emerald-400/50 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">密码</label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-emerald-400/50 outline-none transition-all"
                  />
                </div>
              </div>

              {userAuthError && (
                <p className="text-red-400 bg-red-400/10 rounded-lg py-2 text-sm mt-4 text-center border border-red-400/20">{userAuthError}</p>
              )}

              <button 
                type="submit"
                disabled={isUserSubmitting}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 py-3.5 rounded-xl font-medium text-base shadow-lg transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
              >
                {isUserSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <User className="w-5 h-5" />
                )}
                {userAuthMode === 'login' ? '登录进入' : '注册并进入'}
              </button>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUserAuthMode(userAuthMode === 'login' ? 'register' : 'login');
                    setUserAuthError('');
                  }}
                  className="text-sm text-white/70 font-medium hover:text-white transition-colors border-b border-white/30 pb-0.5"
                >
                  {userAuthMode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
                </button>
              </div>
            </motion.form>

            {/* Admin Form */}
            <motion.form 
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              onSubmit={(e) => handleAuthSubmit(e, 'admin', 'login', adminUsername, adminPassword, setAdminAuthError, setIsAdminSubmitting)} 
              className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-indigo-500/50 transform origin-left transition-transform duration-500 group-hover:scale-x-100" />
              <h2 className="text-2xl font-serif font-semibold text-center text-white mb-2 flex items-center justify-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" /> 管理员通道
              </h2>
              <p className="text-white/50 text-xs text-center mb-8">仅限系统管理员登录，负责平台运营</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">管理账号</label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="请输入管理账号"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">安全密码</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="请输入管理密码"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              {adminAuthError && (
                <p className="text-red-400 bg-red-400/10 rounded-lg py-2 text-sm mt-4 text-center border border-red-400/20">{adminAuthError}</p>
              )}

              <button 
                type="submit"
                disabled={isAdminSubmitting}
                className="w-full bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/50 py-3.5 rounded-xl font-medium text-base shadow-lg transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
              >
                {isAdminSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                管理员安全登录
              </button>
            </motion.form>
          </div>

          {/* Feature Cards Bottom Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <Flower2 className="w-5 h-5 text-emerald-300" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-white">云端追思</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed text-justify">
                搭建线上数字化缅怀空间，提供线上献花、追思文案发布、平台缅怀交流、虚拟纪念互动等服务，打破时空限制，以轻量化、无接触、无污染的方式寄托哀思，让传统祭祀情感在数字时代温情延续。
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-white">文化科普</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed text-justify">
                普及非遗祭祀礼仪、传统岁时习俗与正统道教文化，阐明祭祀是承载敬祖尽孝的民俗仪式，而非封建迷信，引导公众正确认识、理性传承传统文化。
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-400/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-teal-300" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-white">绿色代祭</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed text-justify">
                在合规道观等安全肃穆场所开展规范化代祭服务，同时推广竹浆、秸秆浆等环保祭祀纸张，以低污染、低烟尘、可降解的绿色形式，实现文明、安全、有仪式感的现代祭祀。
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }"""

import sys
# we have to find exactly where the `if (!currentUser) {` block starts and ends.
# The block ends with the ending tag `</div>\n    );\n  }`
match = re.search(r"  if \(\!currentUser\) \{.*?\n    \);\n  \}", content, flags=re.DOTALL)
if match:
    content = content[:match.start()] + new_login_ui + content[match.end():]
else:
    print("Could not find the if(!currentUser) block")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement successful")
