const fs = require('fs');
let code = fs.readFileSync('d:/Downloads/安忆/src/App.tsx', 'utf8');

const trackingViewCode = `  const renderUserOrderTrackingView = () => {
    return (
      <>
        {userMemorials.length === 0 ? (
          <div className="text-center py-20">
            <Flower2 className="w-12 h-12 text-[#5A5A40]/20 mx-auto mb-4" />
            <p className="text-[#2c2c2c]/60">您还没有发布过追思记录</p>
            <p className="text-[#2c2c2c]/40 text-sm mt-2">点击首页的"发布追思"按钮开始</p>
          </div>
        ) : (
          userMemorials.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#2c2c2c]/5 overflow-hidden shadow-sm mb-4">
              <div className="px-6 py-5 border-b border-white/20 bg-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[15px] font-bold text-[#2c2c2c] tracking-tight">{m.name || (m.type === 'festival' ? '节日祭祀' : '个人追思')}</span>
                  <span className="text-[11px] text-[#2c2c2c]/40 font-bold uppercase tracking-widest">{formatTime(m.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { key: 'pending_payment', label: '待付费' },
                    { key: 'pending_order', label: '待审核' },
                    { key: 'accepted', label: '已接单' },
                    { key: 'in_progress', label: '进行中' },
                    { key: 'pending_acceptance', label: '待验收' },
                    { key: 'completed', label: '已完成' }
                  ].map((step, i, arr) => {
                    const statusOrder = ['pending_payment', 'pending_order', 'accepted', 'in_progress', 'pending_acceptance', 'completed'];
                    const currentIdx = statusOrder.indexOf(m.status);
                    const stepIdx = statusOrder.indexOf(step.key);
                    const isActive = stepIdx <= currentIdx;
                    const isCurrent = step.key === m.status;
                    return (
                      <React.Fragment key={step.key}>
                        <div className={\`flex flex-col items-center flex-1\`}>
                          <div className={\`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all shadow-md \${
                            isCurrent ? 'bg-[#5A5A40] text-white ring-4 ring-[#5A5A40]/20' :
                            isActive ? 'bg-[#5A5A40] text-white' :
                            'bg-white/40 text-[#2c2c2c]/20 border border-white/40'
                          }\`}>
                            {isActive ? '✓' : i + 1}
                          </div>
                          <span className={\`text-[10px] mt-1.5 font-bold uppercase tracking-tighter \${isCurrent ? 'text-[#5A5A40]' : isActive ? 'text-[#2c2c2c]/60' : 'text-[#2c2c2c]/20'}\`}>{step.label}</span>
                        </div>
                        {i < arr.length - 1 && (
                          <div className={\`h-1 flex-1 mt-[-24px] rounded-full \${stepIdx < currentIdx ? 'bg-[#5A5A40]' : 'bg-white/20'}\`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                <div className="flex flex-wrap gap-3 text-xs">
                  {(m as any).plan && (
                    <div className="bg-[#5A5A40]/5 rounded-lg px-3 py-1.5">
                      <span className="text-[#2c2c2c]/40">方案：</span>
                      <span className="font-bold text-[#5A5A40]">¥{(m as any).plan}</span>
                    </div>
                  )}
                  {m.event_date && (
                    <div className="bg-[#f5f5f0] rounded-lg px-3 py-1.5">
                      <span className="text-[#2c2c2c]/40">日期：</span>
                      <span className="font-medium text-[#2c2c2c]">{m.event_date}</span>
                    </div>
                  )}
                  <div className="bg-[#f5f5f0] rounded-lg px-3 py-1.5">
                    <span className="text-[#2c2c2c]/40">类型：</span>
                    <span className="font-medium text-[#2c2c2c]">{m.type === 'festival' ? '节日祭祀' : '个人追思'}</span>
                  </div>
                </div>

                <p className="text-sm text-[#2c2c2c]/70 whitespace-pre-wrap bg-[#f5f5f0]/50 rounded-xl p-3">{m.message}</p>

                {(m as any).progress_images && (m as any).progress_images.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200/50">
                    <span className="text-[10px] text-blue-700 font-bold block mb-2">📸 管理员提交的进度图片</span>
                    <div className="flex flex-wrap gap-2">
                      {(m as any).progress_images.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">查看图片{i+1}</a>
                      ))}
                    </div>
                  </div>
                )}

                {m.status === 'completed' && (m.completion_images || m.completion_remarks) && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200/50">
                    <span className="text-[10px] text-green-700 font-bold block mb-2">✅ 已完成</span>
                    {m.completion_remarks && <p className="text-xs text-green-800">📝 {m.completion_remarks}</p>}
                    {m.completion_images && <p className="text-xs text-green-800 mt-1">📸 <a href={m.completion_images} target="_blank" rel="noreferrer" className="underline">查看实拍</a></p>}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 bg-[#f5f5f0]/50 border-t border-[#2c2c2c]/5 flex gap-2">
                {m.status === 'pending_payment' && (
                  <button onClick={() => { setPendingMemorialId(m.id); setPaymentModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-[#5A5A40] text-white rounded-xl text-xs font-medium hover:bg-[#4a4a35] transition-colors shadow-sm">
                    <QrCode className="w-3.5 h-3.5" /> 立即支付
                  </button>
                )}
                {m.status === 'pending_acceptance' && (
                  pendingAcceptId === m.id ? (
                    <div className="flex items-center gap-2">
                      <button onClick={async () => {
                        try {
                          const res = await db.collection('memorials').where({ _id: m.id }).update({ status: 'completed', completed_at: new Date().toISOString() });
                          if (res.updated === 0) {
                            await db.collection('memorials').doc(m.id).update({ status: 'completed', completed_at: new Date().toISOString() });
                          }
                        } catch(e) {
                          console.error('验收失败:', e);
                          alert('验收失败: ' + (e.message || e));
                        }
                        setPendingAcceptId(null);
                      }} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 transition-colors shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5" /> 确认完成
                      </button>
                      <button onClick={() => setPendingAcceptId(null)} className="px-3 py-2 text-xs text-[#2c2c2c]/50 hover:bg-[#f5f5f0] rounded-xl transition-colors">
                        取消
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setPendingAcceptId(m.id)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 transition-colors shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5" /> 确认验收
                    </button>
                  )
                )}
                <button onClick={() => setInlineChatMemorial(m)} className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#5A5A40] border border-[#5A5A40]/20 rounded-xl text-xs font-medium hover:bg-[#5A5A40]/5 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> 联系管理员
                </button>
              </div>
            </motion.div>
          ))
        )}
      </>
    );
  };
`;

const regex = /  const renderUserOrderTrackingView = \(\) => \{\r?\n    return \(\r?\n  \};\r?\n/;
if(regex.test(code)) {
    code = code.replace(regex, trackingViewCode);
    fs.writeFileSync('d:/Downloads/安忆/src/App.tsx', code);
    console.log('Fixed');
} else {
    console.log('Regex did not match');
}
