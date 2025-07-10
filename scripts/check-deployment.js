#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 检查项目部署准备状态...\n');

let allChecksPassed = true;

// 检查1: TypeScript配置
console.log('1️⃣ 检查TypeScript配置...');
try {
  const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
  
  if (tsConfig.compilerOptions.allowJs === false) {
    console.log('   ✅ allowJs设置为false');
  } else {
    console.log('   ❌ allowJs应该设置为false');
    allChecksPassed = false;
  }
  
  if (tsConfig.compilerOptions.checkJs === false) {
    console.log('   ✅ checkJs设置为false');
  } else {
    console.log('   ❌ checkJs应该设置为false');
    allChecksPassed = false;
  }
  
  if (tsConfig.include.includes('src/**/*.ts')) {
    console.log('   ✅ include配置正确');
  } else {
    console.log('   ❌ include应该包含src/**/*.ts');
    allChecksPassed = false;
  }
  
  if (tsConfig.exclude.includes('**/*.js')) {
    console.log('   ✅ exclude配置正确');
  } else {
    console.log('   ❌ exclude应该包含**/*.js');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ 无法读取tsconfig.json');
  allChecksPassed = false;
}

// 检查2: 构建文件
console.log('\n2️⃣ 检查构建文件...');
if (existsSync('dist/index.js')) {
  console.log('   ✅ dist/index.js存在');
} else {
  console.log('   ❌ dist/index.js不存在，请运行npm run build');
  allChecksPassed = false;
}

if (existsSync('dist/services/')) {
  console.log('   ✅ dist/services/目录存在');
} else {
  console.log('   ❌ dist/services/目录不存在');
  allChecksPassed = false;
}

// 检查3: Vercel配置
console.log('\n3️⃣ 检查Vercel配置...');
if (existsSync('vercel.json')) {
  console.log('   ✅ vercel.json存在');
  try {
    const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf8'));
    if (vercelConfig.builds && vercelConfig.builds[0].src === 'dist/index.js') {
      console.log('   ✅ vercel.json配置正确');
    } else {
      console.log('   ❌ vercel.json构建配置不正确');
      allChecksPassed = false;
    }
  } catch (error) {
    console.log('   ❌ vercel.json格式错误');
    allChecksPassed = false;
  }
} else {
  console.log('   ❌ vercel.json不存在');
  allChecksPassed = false;
}

// 检查4: 环境变量示例
console.log('\n4️⃣ 检查环境变量配置...');
if (existsSync('env.example')) {
  console.log('   ✅ env.example存在');
  const envExample = readFileSync('env.example', 'utf8');
  
  if (envExample.includes('DEEPSEEK_API_KEY')) {
    console.log('   ✅ 包含DeepSeek API配置');
  } else {
    console.log('   ⚠️  缺少DeepSeek API配置');
  }
  
  if (envExample.includes('OPENAI_API_KEY')) {
    console.log('   ✅ 包含OpenAI API配置');
  } else {
    console.log('   ⚠️  缺少OpenAI API配置');
  }
  
  if (envExample.includes('DATABASE_URL')) {
    console.log('   ✅ 包含数据库配置');
  } else {
    console.log('   ❌ 缺少数据库配置');
    allChecksPassed = false;
  }
} else {
  console.log('   ❌ env.example不存在');
  allChecksPassed = false;
}

// 检查5: 依赖项
console.log('\n5️⃣ 检查依赖项...');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts.build) {
    console.log('   ✅ build脚本存在');
  } else {
    console.log('   ❌ build脚本不存在');
    allChecksPassed = false;
  }
  
  if (packageJson.scripts.start) {
    console.log('   ✅ start脚本存在');
  } else {
    console.log('   ❌ start脚本不存在');
    allChecksPassed = false;
  }
  
  if (packageJson.dependencies['@modelcontextprotocol/sdk']) {
    console.log('   ✅ MCP SDK依赖存在');
  } else {
    console.log('   ❌ MCP SDK依赖缺失');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ 无法读取package.json');
  allChecksPassed = false;
}

// 检查6: 源代码文件
console.log('\n6️⃣ 检查源代码文件...');
const requiredFiles = [
  'src/index.ts',
  'src/services/aiService.ts',
  'src/services/newsService.ts',
  'src/services/newsAnalyzer.ts'
];

requiredFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`   ✅ ${file}存在`);
  } else {
    console.log(`   ❌ ${file}不存在`);
    allChecksPassed = false;
  }
});

// 检查7: 尝试构建
console.log('\n7️⃣ 测试构建过程...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('   ✅ 构建成功');
} catch (error) {
  console.log('   ❌ 构建失败');
  console.log(`   错误: ${error.message}`);
  allChecksPassed = false;
}

// 总结
console.log('\n📋 检查结果总结:');
if (allChecksPassed) {
  console.log('🎉 所有检查通过！项目已准备好部署到Vercel。');
  console.log('\n📝 部署前检查清单:');
  console.log('   ✅ 配置环境变量（DEEPSEEK_API_KEY或OPENAI_API_KEY）');
  console.log('   ✅ 配置数据库URL（DATABASE_URL）');
  console.log('   ✅ 确保所有API密钥有效');
  console.log('   ✅ 测试本地运行：npm start');
} else {
  console.log('❌ 发现一些问题，请修复后重新检查。');
  console.log('\n🔧 修复建议:');
  console.log('   1. 运行 npm run build 确保构建成功');
  console.log('   2. 检查tsconfig.json配置');
  console.log('   3. 确保所有必需文件存在');
  console.log('   4. 验证环境变量配置');
}

console.log('\n📚 更多信息请参考: docs/VERCEL_DEPLOYMENT.md'); 