import re
import os

filepath = r"d:\Downloads\云端追思 (1)\src\App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace imports
content = re.sub(
    r"import \{ auth, db \} from '\./firebase';\nimport \{ signInWithEmailAndPassword.*?from 'firebase/auth';\nimport \{ collection.*?from 'firebase/firestore';",
    "import { auth, db, app } from './tcb';",
    content,
    flags=re.DOTALL
)

# TCB uses _id, but we map it to id.
# For Auth, since we are faking it with a local state over anonymous auth, we need to handle handleAuth entirely differently.
# We will rewrite handleAuth and the onAuthStateChanged part.

# Find the useEffect for auth state
auth_effect_regex = r"useEffect\(\(\) => \{\n    const unsubscribe = onAuthStateChanged.*?return \(\) => unsubscribe\(\);\n  \}, \[\]\);"

new_auth_effect = """  useEffect(() => {
    const initAuth = async () => {
      try {
        const loginState = await auth.getLoginState();
        if (!loginState) {
          await auth.anonymousAuthProvider().signIn();
        }
        
        const localUid = localStorage.getItem('yjas_uid');
        if (localUid) {
          const res = await db.collection('users').doc(localUid).get();
          if (res.data && res.data.length > 0) {
            const userDoc = res.data[0];
            setCurrentUser({
              id: localUid,
              email: userDoc.email || '',
              name: userDoc.name,
              role: userDoc.role
            });
          } else {
            setCurrentUser(null);
            localStorage.removeItem('yjas_uid');
          }
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.error("Auth init error:", e);
        setCurrentUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    initAuth();
  }, []);"""

content = re.sub(auth_effect_regex, new_auth_effect, content, flags=re.DOTALL)

# Find snapshot queries
q_forum_regex = r"const qForum = query\(collection\(db, 'forum_posts'\), orderBy\('created_at', 'desc'\), limit\(100\)\);\n    const unsubForum = onSnapshot\(qForum, \(snapshot\) => \{\n      setForumPosts\(snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as ForumPost\)\)\);\n    \}\);"

new_q_forum = """    const watcherForum = db.collection('forum_posts').orderBy('created_at', 'desc').limit(100).watch({
      onChange: (snapshot) => {
        setForumPosts(snapshot.docs.map(doc => ({ ...doc, id: doc._id } as ForumPost)));
      },
      onError: (err) => console.error(err)
    });
    const unsubForum = () => watcherForum.close();"""

content = re.sub(q_forum_regex, new_q_forum, content)

# qMemorials
q_mem_regex = r"const qMemorials = query\(collection\(db, 'memorials'\), where\('status', 'in', \['accepted', 'completed'\]\), orderBy\('created_at', 'desc'\), limit\(50\)\);\n    const unsubMemorials = onSnapshot\(qMemorials, \(snapshot\) => \{\n      setMemorials\(snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as Memorial\)\)\);\n      setIsLoading\(false\);\n    \}\);"
new_q_mem = """    const watcherMemorials = db.collection('memorials').where({ status: db.command.in(['accepted', 'completed']) }).orderBy('created_at', 'desc').limit(50).watch({
      onChange: (snapshot) => {
        setMemorials(snapshot.docs.map(doc => ({ ...doc, id: doc._id } as Memorial)));
        setIsLoading(false);
      },
      onError: (err) => console.error(err)
    });
    const unsubMemorials = () => watcherMemorials.close();"""
content = re.sub(q_mem_regex, new_q_mem, content)

# qUserMemorials
q_umem_regex = r"const qUserMemorials = query\(collection\(db, 'memorials'\), where\('author_id', '==', currentUser\.id\), orderBy\('created_at', 'desc'\)\);\n    const unsubUserMemorials = onSnapshot\(qUserMemorials, \(snapshot\) => \{\n      setUserMemorials\(snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as Memorial\)\)\);\n    \}\);"
new_q_umem = """    const watcherUserMemorials = db.collection('memorials').where({ author_id: currentUser.id }).orderBy('created_at', 'desc').watch({
      onChange: (snapshot) => {
        setUserMemorials(snapshot.docs.map(doc => ({ ...doc, id: doc._id } as Memorial)));
      },
      onError: (err) => console.error(err)
    });
    const unsubUserMemorials = () => watcherUserMemorials.close();"""
content = re.sub(q_umem_regex, new_q_umem, content)

# qAdminMemorials
q_amem_regex = r"const qAdminMemorials = query\(collection\(db, 'memorials'\), orderBy\('created_at', 'desc'\)\);\n      unsubAdminMemorials = onSnapshot\(qAdminMemorials, \(snapshot\) => \{\n        setAdminMemorials\(snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as Memorial\)\)\);\n      \}\);"
new_q_amem = """      const watcherAdminMemorials = db.collection('memorials').orderBy('created_at', 'desc').watch({
        onChange: (snapshot) => {
          setAdminMemorials(snapshot.docs.map(doc => ({ ...doc, id: doc._id } as Memorial)));
        },
        onError: (err) => console.error(err)
      });
      unsubAdminMemorials = () => watcherAdminMemorials.close();"""
content = re.sub(q_amem_regex, new_q_amem, content)

# Comments listener
comments_regex = r"const unsubComments = onSnapshot\(collection\(db, 'comments'\), \(snapshot\) => \{\n      const commentsByMemorial: Record<string, Comment\[\]> = \{\};\n      snapshot\.docs\.forEach\(doc => \{\n        const data = \{ id: doc\.id, \.\.\.doc\.data\(\) \} as Comment;"
new_comments = """    const watcherComments = db.collection('comments').watch({
      onChange: (snapshot) => {
        const commentsByMemorial: Record<string, Comment[]> = {};
        snapshot.docs.forEach(doc => {
          const data = { ...doc, id: doc._id } as Comment;"""
content = re.sub(comments_regex, new_comments, content)
content = content.replace("unsubComments();", "unsubComments();\n    };") # Need to fix the extra brace from watch
# actually we need to be careful with the close of watcherComments
# Let's just use string replace for the end of comments watcher
content = content.replace("});\n\n      setMemorials(prev =>", "});\n\n      setMemorials(prev =>")
content = content.replace("setAdminMemorials(prev => prev.map(m => ({ ...m, comments: commentsByMemorial[m.id] || [] })));\n    });", "setAdminMemorials(prev => prev.map(m => ({ ...m, comments: commentsByMemorial[m.id] || [] })));\n      },\n      onError: (err) => console.error(err)\n    });\n    const unsubComments = () => watcherComments.close();")


# Chat listener
chat_regex = r"const q = query\(collection\(db, 'messages'\), where\('memorial_id', '==', currentChatMemorial\.id\), orderBy\('created_at', 'asc'\)\);\n      const unsub = onSnapshot\(q, \(snapshot\) => \{\n        setMessages\(snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as Message\)\)\);\n      \}\);\n      return \(\) => unsub\(\);"
new_chat = """      const watcherChat = db.collection('messages').where({ memorial_id: currentChatMemorial.id }).orderBy('created_at', 'asc').watch({
        onChange: (snapshot) => {
          setMessages(snapshot.docs.map(doc => ({ ...doc, id: doc._id } as Message)));
        },
        onError: (err) => console.error(err)
      });
      return () => watcherChat.close();"""
content = re.sub(chat_regex, new_chat, content)

# handleAuth
handle_auth_regex = r"const handleAuth = async \(e: React\.FormEvent\) => \{.*?\n  \};\n\n  const handleLogout = async \(\) => \{"
new_handle_auth = """  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError('请输入账号和密码');
      return;
    }
    
    setIsAuthSubmitting(true);
    setAuthError('');
    
    const email = `${username.trim()}@system.local`;
    
    try {
      const usersRes = await db.collection('users').where({ username: username.trim() }).get();
      const existingUser = usersRes.data[0];

      if (authMode === 'login') {
        if (!existingUser || existingUser.password !== password) {
          setAuthError('账号或密码错误');
          setIsAuthSubmitting(false);
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
          setAuthError('该账号已被注册');
          setIsAuthSubmitting(false);
          return;
        }
        
        let localRole = 'user';
        if (username.trim() === 'admin' || username.trim() === 'lvhaojie456') {
          localRole = 'admin';
        }
        
        const res = await db.collection('users').add({
          username: username.trim(),
          password: password,
          name: username.trim(),
          email: email,
          role: localRole,
          created_at: db.serverDate()
        });
        
        localStorage.setItem('yjas_uid', res.id);
        setCurrentUser({
          id: res.id,
          email: email,
          name: username.trim(),
          role: localRole as any
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(authMode === 'login' ? '登录失败，请重试' : '注册失败，请重试');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('yjas_uid');
    setCurrentUser(null);
  };"""
content = re.sub(handle_auth_regex, new_handle_auth, content, flags=re.DOTALL)

# other serverTimestamp() -> db.serverDate()
content = content.replace("serverTimestamp()", "db.serverDate()")

# addDoc
content = re.sub(r"await addDoc\(collection\(db, '(.*?)'\), \{", r"await db.collection('\1').add({", content)

# updateDoc
content = re.sub(r"await updateDoc\(doc\(db, '(.*?)', (.*?)\), \{", r"await db.collection('\1').doc(\2).update({", content)

# deleteDoc
content = re.sub(r"await deleteDoc\(doc\(db, '(.*?)', (.*?)\)\);", r"await db.collection('\1').doc(\2).remove();", content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement successful")
