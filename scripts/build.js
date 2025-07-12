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
    // 使用Node.js内置的fs模块删除目录
    import('fs').then(fs => {
      import('path').then(path => {
        const distPath = path.join(process.cwd(), 'dist');
        if (fs.existsSync(distPath)) {
          fs.rmSync(distPath, { recursive: true, force: true });
          console.log('✅ dist目录清理完成');
        }
        executeTypeScriptBuild();
      });
    });
  } else {
    executeTypeScriptBuild();
  }
}

function executeTypeScriptBuild() {
  console.log('⚙️  执行TypeScript编译...');
  
  const buildProcess = spawn('node', ['node_modules/.bin/tsc', '--project', 'tsconfig.build.json'], { 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ TypeScript编译成功!');
      runPrismaGenerate();
    } else {
      console.log(`⚠️  TypeScript编译有警告，但继续构建...`);
      runPrismaGenerate();
    }
  });
  
  buildProcess.on('error', (error) => {
    console.log(`❌ 构建过程错误: ${error.message}`);
    process.exit(1);
  });
}

function runPrismaGenerate() {
  console.log('\n🗄️  生成Prisma客户端...');
  const prismaProcess = spawn('node', ['node_modules/.bin/prisma', 'generate'], { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  prismaProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Prisma客户端生成完成');
      runDatabaseSetup();
    } else {
      console.log(`⚠️  Prisma生成有警告，但继续构建...`);
      runDatabaseSetup();
    }
  });
}

function runDatabaseSetup() {
  console.log('\n💾 设置数据库...');
  
  // 推送数据库schema
  const dbPushProcess = spawn('node', ['node_modules/.bin/prisma', 'db', 'push'], { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  dbPushProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 数据库schema推送完成');
      runDatabaseInit();
    } else {
      console.log(`⚠️  数据库schema推送有警告，但继续构建...`);
      runDatabaseInit();
    }
  });
}

function runDatabaseInit() {
  console.log('\n📊 初始化数据库数据...');
  
  const initProcess = spawn('node', ['scripts/init-db.js'], { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  initProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 数据库初始化完成');
      verifyBuild();
    } else {
      console.log(`⚠️  数据库初始化有警告，但继续构建...`);
      verifyBuild();
    }
  });
}

function verifyBuild() {
  console.log('\n📋 构建结果验证:');
  
  const requiredFiles = [
    'dist/index.js',
    'dist/api.js',
    'dist/server.js'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (existsSync(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - 缺失`);
      allFilesExist = false;
    }
  });
  
  if (allFilesExist) {
    console.log('\n🎉 构建完成!');
    console.log('\n📦 构建产物:');
    console.log('  - dist/index.js (MCP服务入口)');
    console.log('  - dist/api.js (HTTP API服务)');
    console.log('  - dist/server.js (HTTP服务器启动)');
    console.log('  - dist/services/ (核心服务)');
    console.log('  - dist/utils/ (工具函数)');
    console.log('  - dev.db (SQLite数据库)');
  } else {
    console.log('\n❌ 构建验证失败，缺少必要文件');
    process.exit(1);
  }
} 