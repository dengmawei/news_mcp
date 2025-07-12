#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🔨 AI News MCP 构建脚本');
console.log('========================');

// 检查环境
console.log('\n📋 环境检查:');
console.log(`Node.js版本: ${process.version}`);
console.log(`工作目录: ${process.cwd()}`);

// 检查必要文件
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'src/index.ts',
  'src/api.ts'
];

console.log('\n📁 文件检查:');
requiredFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - 缺失`);
    process.exit(1);
  }
});

// 检查node_modules
if (!existsSync('node_modules')) {
  console.log('\n📦 安装依赖...');
  const installProcess = spawn('npm', ['install'], { stdio: 'inherit' });
  
  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 依赖安装完成');
      runBuild();
    } else {
      console.log('❌ 依赖安装失败');
      process.exit(code);
    }
  });
} else {
  console.log('✅ node_modules 存在');
  runBuild();
}

function runBuild() {
  console.log('\n🔨 开始构建...');
  
  // 清理dist目录
  if (existsSync('dist')) {
    console.log('🧹 清理dist目录...');
    const rimraf = spawn('npx', ['rimraf', 'dist'], { stdio: 'inherit' });
    rimraf.on('close', () => {
      executeTypeScriptBuild();
    });
  } else {
    executeTypeScriptBuild();
  }
}

function executeTypeScriptBuild() {
  console.log('⚙️  执行TypeScript编译...');
  
  const buildProcess = spawn('npx', ['tsc', '--project', 'tsconfig.build.json'], { 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 构建成功!');
      
      // 验证构建结果
      const distFiles = [
        'dist/index.js',
        'dist/api.js',
        'dist/server.js'
      ];
      
      console.log('\n📋 构建结果验证:');
      distFiles.forEach(file => {
        if (existsSync(file)) {
          console.log(`  ✅ ${file}`);
        } else {
          console.log(`  ❌ ${file} - 缺失`);
        }
      });
      
      console.log('\n🎉 构建完成!');
    } else {
      console.log(`❌ 构建失败，退出码: ${code}`);
      process.exit(code);
    }
  });
  
  buildProcess.on('error', (error) => {
    console.log(`❌ 构建过程错误: ${error.message}`);
    process.exit(1);
  });
} 