import fs from 'fs';
import path from 'path';

// 复制API目录到dist
const apiDir = path.join(process.cwd(), 'api');
const distApiDir = path.join(process.cwd(), 'dist', 'api');

// 确保dist目录存在
if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
  fs.mkdirSync(path.join(process.cwd(), 'dist'));
}

// 复制API文件
if (fs.existsSync(apiDir)) {
  if (!fs.existsSync(distApiDir)) {
    fs.mkdirSync(distApiDir, { recursive: true });
  }
  
  const files = fs.readdirSync(apiDir);
  files.forEach(file => {
    const ext = path.extname(file);
    // 只复制编译后的文件，不复制 .ts 源文件
    if (ext === '.ts') {
      console.log(`跳过文件: ${file} (TypeScript源文件)`);
      return;
    }
    
    const srcPath = path.join(apiDir, file);
    const destPath = path.join(distApiDir, file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`复制文件: ${srcPath} -> ${destPath}`);
    }
  });
  
  console.log('API文件复制完成');
} else {
  console.log('API目录不存在，跳过复制');
} 