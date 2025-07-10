#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查是否已构建
import { existsSync } from 'fs';
const distPath = join(__dirname, '..', 'dist');

if (!existsSync(distPath)) {
  console.log('正在构建项目...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('构建完成，启动服务...');
      startServer();
    } else {
      console.error('构建失败');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  serverProcess.on('close', (code) => {
    console.log(`服务已停止，退出码: ${code}`);
  });
  
  // 处理进程信号
  process.on('SIGINT', () => {
    console.log('正在关闭服务...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('正在关闭服务...');
    serverProcess.kill('SIGTERM');
  });
} 