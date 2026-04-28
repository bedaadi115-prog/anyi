import re
import os

filepath = r"d:\Downloads\安忆\src\App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = re.sub(
    r"import \{ auth, db, app \} from '\./tcb';",
    "import { v4 as uuidv4 } from 'uuid';",
    content
)

# 2. UserProfileSettings
# In UserProfileSettings: 
# const updateData = { name: name.trim(), avatar: avatar.trim() };
# const res = await db.collection('users').where({ _id: currentUser.id }).update(updateData);
# if (res.updated === 0) { await db.collection('users').doc(currentUser.id).update(updateData); }
user_profile_update_regex = r"const updateData = \{ name: name\.trim\(\), avatar: avatar\.trim\(\) \};\n\s*const res = await db\.collection\('users'\)\.where\(\{ _id: currentUser\.id \}\)\.update\(updateData\);\n\s*if \(res\.updated === 0\) \{\n\s*await db\.collection\('users'\)\.doc\(currentUser\.id\)\.update\(updateData\);\n\s*\}"
user_profile_new = """const updateData = { name: name.trim(), avatar: avatar.trim() };
      await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });"""
content = re.sub(user_profile_update_regex, user_profile_new, content)

# 3. Avatar upload logic
# Find: <input type="text" value={avatar} onChange={e => setAvatar(e.target.value)} ... />
avatar_input_regex = r"<input\s+type=\"text\"\s+value=\{avatar\}\s+onChange=\{e => setAvatar\(e\.target\.value\)\}\s+className=\"w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-\[#5A5A40\]/30 transition-all placeholder-\[#2c2c2c\]/30\"\s+placeholder=\"https://example\.com/avatar\.jpg\"\s+/>"
avatar_new_input = """<div className="flex gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                setIsSubmitting(true);
                try {
                  const res = await fetch('/api/upload', { method: 'POST', body: formData }).then(r => r.json());
                  if (res.url) setAvatar(res.url);
                } catch (err) {
                  setMessage('上传失败');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 transition-all placeholder-[#2c2c2c]/30"
            />
          </div>"""
content = re.sub(avatar_input_regex, avatar_new_input, content)


# 4. Auth initialization
auth_init_regex = r"const loginState = await auth\.getLoginState\(\);\n\s*if \(!loginState\) \{\n\s*await auth\.anonymousAuthProvider\(\)\.signIn\(\);\n\s*\}"
content = re.sub(auth_init_regex, "", content)

auth_fetch_regex = r"const res = await db\.collection\('users'\)\.doc\(localUid\)\.get\(\);\n\s*if \(res\.data && res\.data\.length > 0\) \{\n\s*const userDoc = res\.data\[0\];"
auth_fetch_new = """const res = await fetch(`/api/users/${localUid}`).then(r => r.json());
          if (res && res.length > 0) {
            const userDoc = res[0];"""
content = re.sub(auth_fetch_regex, auth_fetch_new, content)


# 5. Fetch Data in useEffect
fetch_forum_regex = r"const forumRes = await db\.collection\('forum_posts'\)\.orderBy\('created_at', 'desc'\)\.limit\(100\)\.get\(\);\n\s*setForumPosts\(\(forumRes\.data \|\| \[\]\)\.map\(\(doc: any\) => \(\{ \.\.\.doc, id: doc\._id \|\| doc\.id \} as ForumPost\)\)\);"
fetch_forum_new = """const forumRes = await fetch('/api/forum_posts').then(r => r.json());
        setForumPosts((forumRes || []).map((doc: any) => ({ ...doc, id: doc._id || doc.id } as ForumPost)));"""
content = re.sub(fetch_forum_regex, fetch_forum_new, content)

fetch_mem_regex = r"const memRes = await db\.collection\('memorials'\)\.where\(\{ status: db\.command\.in\(\['accepted', 'completed'\]\) \}\)\.orderBy\('created_at', 'desc'\)\.limit\(50\)\.get\(\);\n\s*setMemorials\(\(memRes\.data \|\| \[\]\)\.map\(\(doc: any\) => \(\{ \.\.\.doc, id: doc\._id \|\| doc\.id \} as Memorial\)\)\);"
fetch_mem_new = """const memRes = await fetch('/api/memorials?status=accepted,completed').then(r => r.json());
        setMemorials((memRes || []).map((doc: any) => ({ ...doc, id: doc._id || doc.id } as Memorial)));"""
content = re.sub(fetch_mem_regex, fetch_mem_new, content)

fetch_user_mem_regex = r"const userMemRes = await db\.collection\('memorials'\)\.where\(\{ author_id: currentUser\.id \}\)\.orderBy\('created_at', 'desc'\)\.get\(\);\n\s*setUserMemorials\(\(userMemRes\.data \|\| \[\]\)\.map\(\(doc: any\) => \(\{ \.\.\.doc, id: doc\._id \|\| doc\.id \} as Memorial\)\)\);"
fetch_user_mem_new = """const userMemRes = await fetch(`/api/memorials?author_id=${currentUser.id}`).then(r => r.json());
        setUserMemorials((userMemRes || []).map((doc: any) => ({ ...doc, id: doc._id || doc.id } as Memorial)));"""
content = re.sub(fetch_user_mem_regex, fetch_user_mem_new, content)

fetch_admin_mem_regex = r"const adminMemRes = await db\.collection\('memorials'\)\.orderBy\('created_at', 'desc'\)\.get\(\);\n\s*setAdminMemorials\(\(adminMemRes\.data \|\| \[\]\)\.map\(\(doc: any\) => \(\{ \.\.\.doc, id: doc\._id \|\| doc\.id \} as Memorial\)\)\);"
fetch_admin_mem_new = """const adminMemRes = await fetch('/api/memorials').then(r => r.json());
          setAdminMemorials((adminMemRes || []).map((doc: any) => ({ ...doc, id: doc._id || doc.id } as Memorial)));"""
content = re.sub(fetch_admin_mem_regex, fetch_admin_mem_new, content)

fetch_comments_regex = r"const commentsRes = await db\.collection\('comments'\)\.get\(\);\n\s*const commentsByMemorial: Record<string, Comment\[\]> = \{\};\n\s*\(\(commentsRes\.data \|\| \[\]\)\ as any\)\.forEach\(\(doc: any\) => \{"
fetch_comments_new = """const commentsRes = await fetch('/api/comments').then(r => r.json());
        const commentsByMemorial: Record<string, Comment[]> = {};
        (commentsRes || []).forEach((doc: any) => {"""
content = re.sub(fetch_comments_regex, fetch_comments_new, content)
# Also fix the fallback in forEach if any
content = content.replace("(commentsRes.data || []).forEach((doc: any) => {", "(commentsRes || []).forEach((doc: any) => {")


# 6. Chat messages
chat_fetch_regex = r"const res = await db\.collection\('messages'\)\.where\(\{ memorial_id: (.*?)\.id \}\)\.orderBy\('created_at', 'asc'\)\.get\(\);\n\s*set.*?Messages\(\(res\.data \|\| \[\]\)\.map\(\(doc: any\) => \(\{ \.\.\.doc, id: doc\._id \|\| doc\.id \} as Message\)\)\);"
def replace_chat(match):
    mem_var = match.group(1)
    func_name = "setMessages" if "currentChatMemorial" in mem_var else "setInlineChatMessages"
    return f"""const res = await fetch(`/api/messages?memorial_id=${{{mem_var}.id}}`).then(r => r.json());
          {func_name}((res || []).map((doc: any) => ({{ ...doc, id: doc._id || doc.id }} as Message)));"""

content = re.sub(chat_fetch_regex, replace_chat, content)


# 7. handleAuthSubmit
auth_submit_fetch_regex = r"const usersRes = await db\.collection\('users'\)\.where\(\{ username: uName\.trim\(\) \}\)\.get\(\);\n\s*const existingUser = usersRes\.data\[0\];"
auth_submit_fetch_new = """const usersRes = await fetch(`/api/users?username=${uName.trim()}`).then(r => r.json());
      const existingUser = usersRes[0];"""
content = re.sub(auth_submit_fetch_regex, auth_submit_fetch_new, content)

auth_submit_add_regex = r"const res = await db\.collection\('users'\)\.add\(\{\n\s*username: uName\.trim\(\),\n\s*password: uPass,\n\s*name: uName\.trim\(\),\n\s*email: email,\n\s*role: assignedRole,\n\s*created_at: db\.serverDate\(\)\n\s*\}\);"
auth_submit_add_new = """const uid = uuidv4();
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uid,
            username: uName.trim(),
            password: uPass,
            name: uName.trim(),
            email: email,
            role: assignedRole,
            created_at: new Date().toISOString()
          })
        });
        const res = { id: uid };"""
content = re.sub(auth_submit_add_regex, auth_submit_add_new, content)


# 8. handleForumSubmit
forum_add_regex = r"await db\.collection\('forum_posts'\)\.add\(\{\n\s*user_id: currentUser\.id,\n\s*content: forumInput\.trim\(\),\n\s*created_at: db\.serverDate\(\),\n\s*user_name: currentUser\.name,\n\s*user_role: currentUser\.role,\n\s*user_avatar: currentUser\.avatar \|\| ''\n\s*\}\);"
forum_add_new = """await fetch('/api/forum_posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          user_id: currentUser.id,
          content: forumInput.trim(),
          created_at: new Date().toISOString(),
          user_name: currentUser.name,
          user_role: currentUser.role,
          user_avatar: currentUser.avatar || ''
        })
      });"""
content = re.sub(forum_add_regex, forum_add_new, content)

# 9. handlePersonSubmit / handleFestivalSubmit
memorial_add_regex = r"const docRef = await db\.collection\('memorials'\)\.add\(\{([^}]*?)created_at: db\.serverDate\(\),([^}]*?)\}\);"
def replace_memorial(match):
    pre = match.group(1)
    post = match.group(2)
    return f"""const uid = uuidv4();
      await fetch('/api/memorials', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{{pre}created_at: new Date().toISOString(),{post}, id: uid}})
      }});
      const docRef = {{ id: uid }};"""
content = re.sub(memorial_add_regex, replace_memorial, content)

# 10. handleCommentSubmit
comment_add_regex = r"await db\.collection\('comments'\)\.add\(\{\n\s*memorial_id: memorialId,\n\s*user_id: currentUser\.id,\n\s*content: content\.trim\(\),\n\s*created_at: db\.serverDate\(\),\n\s*user_name: currentUser\.name\n\s*\}\);"
comment_add_new = """await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          memorial_id: memorialId,
          user_id: currentUser.id,
          content: content.trim(),
          created_at: new Date().toISOString(),
          user_name: currentUser.name
        })
      });"""
content = re.sub(comment_add_regex, comment_add_new, content)

# 11. Payment / Accept / Complete (Updates to Memorials)
update_mem_status_regex = r"await db\.collection\('memorials'\)\.doc\((.*?)\)\.update\(\{ status: '(.*?)' \}\);"
def replace_mem_status(match):
    id_var = match.group(1)
    status_val = match.group(2)
    return f"""await fetch(`/api/memorials/${{{id_var}}}`, {{
        method: 'PUT',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ status: '{status_val}' }})
      }});"""
content = re.sub(update_mem_status_regex, replace_mem_status, content)

update_mem_complete_regex = r"await db\.collection\('memorials'\)\.doc\((.*?)\)\.update\(\{([^}]*?)\}\);"
def replace_mem_complete(match):
    id_var = match.group(1)
    props = match.group(2)
    if "status:" not in props and "status :" not in props:
        return match.group(0) # Not a status update
    return f"""await fetch(`/api/memorials/${{{id_var}}}`, {{
        method: 'PUT',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{{props}}})
      }});"""
content = re.sub(update_mem_complete_regex, replace_mem_complete, content)

# 12. db.serverDate() to new Date().toISOString()
content = content.replace("db.serverDate()", "new Date().toISOString()")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx refactored successfully")
