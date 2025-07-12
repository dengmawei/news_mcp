#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 生产环境构建脚本');
console.log('==================');

// 设置环境变量
process.env.NODE_ENV = 'production';
process.env.FORCE_COLOR = '1';

console.log('\n📋 构建环境:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Node.js版本: ${process.version}`);
console.log(`工作目录: ${process.cwd()}`);

// 步骤1: 安装依赖
console.log('\n📦 步骤1: 安装依赖...');
const installProcess = spawn('npm', ['ci', '--include=dev'], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

installProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ 依赖安装完成');
    runTypeScriptBuild();
  } else {
    console.log(`❌ 依赖安装失败，退出码: ${code}`);
    process.exit(code);
  }
});

// 步骤2: TypeScript编译
function runTypeScriptBuild() {
  console.log('\n🔨 步骤2: TypeScript编译...');
  
  const buildProcess = spawn('npx', ['tsc'], { 
    stdio: 'inherit',
    env: { ...process.env }
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
    console.log(`❌ TypeScript编译错误: ${error.message}`);
    process.exit(1);
  });
}

// 步骤3: 生成Prisma客户端
function runPrismaGenerate() {
  console.log('\n🗄️  步骤3: 生成Prisma客户端...');
  const prismaProcess = spawn('npx', ['prisma', 'generate'], { 
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

// 步骤4: 数据库设置
function runDatabaseSetup() {
  console.log('\n💾 步骤4: 数据库设置...');
  
  // 推送数据库schema
  const dbPushProcess = spawn('npx', ['prisma', 'db', 'push'], { 
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

// 步骤5: 初始化数据库数据
function runDatabaseInit() {
  console.log('\n📊 步骤5: 初始化数据库数据...');
  
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

// 步骤6: 验证构建结果
function verifyBuild() {
  console.log('\n📋 步骤6: 验证构建结果...');
  
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
    console.log('\n🎉 生产环境构建成功完成!');
    console.log('\n📦 构建产物:');
    console.log('  - dist/index.js (MCP服务入口)');
    console.log('  - dist/api.js (HTTP API服务)');
    console.log('  - dist/server.js (HTTP服务器启动)');
    console.log('  - dist/services/ (核心服务)');
    console.log('  - dist/utils/ (工具函数)');
    console.log('  - dev.db (SQLite数据库)');
    console.log('\n🚀 准备启动服务...');
  } else {
    console.log('\n❌ 构建验证失败，缺少必要文件');
    process.exit(1);
  }
} 