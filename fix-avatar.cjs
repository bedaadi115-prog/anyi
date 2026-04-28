const fs = require('fs');
let code = fs.readFileSync('d:/Downloads/安忆/src/App.tsx', 'utf8');

const newHandleFileChange = `  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('图片不能超过 5MB');
      return;
    }

    setIsSubmitting(true);
    setMessage('正在处理图片...');
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAvatar(dataUrl);
          setMessage('图片处理成功！请点击"保存个人资料"');
          setIsSubmitting(false);
        };
        img.onerror = () => {
          setMessage('读取图片失败');
          setIsSubmitting(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setMessage('读取文件失败');
        setIsSubmitting(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('处理图片失败:', err);
      setMessage('图片处理失败: ' + (err.message || err));
      setIsSubmitting(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };`;

// Replace the old handleFileChange
code = code.replace(/  const handleFileChange = async \([\s\S]*?finally \{\r?\n      setIsSubmitting\(false\);\r?\n      if \(fileInputRef\.current\) \{\r?\n        fileInputRef\.current\.value = '';\r?\n      \}\r?\n    \}\r?\n  \};/, newHandleFileChange);

fs.writeFileSync('d:/Downloads/安忆/src/App.tsx', code);
console.log('Fixed avatar upload');
