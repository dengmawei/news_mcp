#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 AI News MCP 服务启动器\n');

// 检查环境变量文件
if (!existsSync('.env')) {
  console.log('⚠️  警告: 未找到 .env 文件');
  console.log('请复制 env.example 到 .env 并配置必要的环境变量\n');
}

// 检查构建文件
if (!existsSync('dist/index.js')) {
  console.log('🔨 正在构建项目...');
  const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 构建完成\n');
      showMenu();
    } else {
      console.log('❌ 构建失败');
      process.exit(1);
    }
  });
} else {
  showMenu();
}

function showMenu() {
  console.log('请选择启动模式:');
  console.log('1. MCP服务 (标准模式)');
  console.log('2. HTTP API服务');
  console.log('3. 开发模式 (MCP)');
  console.log('4. 开发模式 (HTTP API)');
  console.log('5. 退出');
  
  process.stdin.once('data', (data) => {
    const choice = data.toString().trim();
    
    switch (choice) {
      case '1':
        console.log('\n🚀 启动MCP服务...');
        spawn('npm', ['start'], { stdio: 'inherit' });
        break;
      case '2':
        console.log('\n🌐 启动HTTP API服务...');
        spawn('npm', ['run', 'server'], { stdio: 'inherit' });
        break;
      case '3':
        console.log('\n🔧 启动开发模式 (MCP)...');
        spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
        break;
      case '4':
        console.log('\n🔧 启动开发模式 (HTTP API)...');
        spawn('npm', ['run', 'dev:server'], { stdio: 'inherit' });
        break;
      case '5':
        console.log('👋 再见!');
        process.exit(0);
        break;
      default:
        console.log('❌ 无效选择，请重新输入');
        showMenu();
    }
  });
} 