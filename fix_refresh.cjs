const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('const [refreshTrigger, setRefreshTrigger] = useState(0);')) {
  content = content.replace(
    /const \[userMemorials, setUserMemorials\] = useState<Memorial\[\]>\(\[\]\);/,
    "const [userMemorials, setUserMemorials] = useState<Memorial[]>([]);\n  const [refreshTrigger, setRefreshTrigger] = useState(0);"
  );

  content = content.replace(
    /}, \[currentUser\]\);/g,
    "}, [currentUser, refreshTrigger]);"
  );
  
  content = content.replace(
    /setIsPublishModalOpen\(false\);/g,
    "setIsPublishModalOpen(false);\n      setRefreshTrigger(prev => prev + 1);"
  );
  
  content = content.replace(
    /setIsFestivalModalOpen\(false\);/g,
    "setIsFestivalModalOpen(false);\n      setRefreshTrigger(prev => prev + 1);"
  );
  
  // also update for forum posts
  content = content.replace(
    /setForumContent\(''\);/g,
    "setForumContent('');\n      setRefreshTrigger(prev => prev + 1);"
  );

  fs.writeFileSync('src/App.tsx', content);
  console.log("Added refresh trigger");
} else {
  console.log("Already added");
}
