#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';

console.log('🚀 生产环境启动脚本');
console.log('==================');

const prisma = new PrismaClient();

async function checkAndSetupDatabase() {
  try {
    console.log('\n🗄️  检查数据库状态...');
    
    // 检查数据库文件是否存在
    if (!existsSync('dev.db')) {
      console.log('⚠️  数据库文件不存在，正在初始化...');
      await setupDatabase();
    } else {
      console.log('✅ 数据库文件存在');
      
      // 检查数据库表是否存在
      try {
        await prisma.newsSource.findFirst();
        console.log('✅ 数据库表已存在');
      } catch (error) {
        console.log('⚠️  数据库表不存在，正在初始化...');
        await setupDatabase();
      }
    }
  } catch (error) {
    console.log(`❌ 数据库检查失败: ${error.message}`);
    console.log('🔄 尝试重新初始化数据库...');
    await setupDatabase();
  }
}

async function setupDatabase() {
  return new Promise((resolve, reject) => {
    console.log('\n📦 步骤1: 生成Prisma客户端...');
    const generateProcess = spawn('npx', ['prisma', 'generate'], { 
      stdio: 'inherit'
    });
    
    generateProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma客户端生成完成');
        pushDatabaseSchema();
      } else {
        console.log(`❌ Prisma生成失败，退出码: ${code}`);
        reject(new Error('Prisma生成失败'));
      }
    });
    
    function pushDatabaseSchema() {
      console.log('\n💾 步骤2: 推送数据库schema...');
      const pushProcess = spawn('npx', ['prisma', 'db', 'push'], { 
        stdio: 'inherit'
      });
      
      pushProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 数据库schema推送完成');
          initDatabaseData();
        } else {
          console.log(`❌ 数据库schema推送失败，退出码: ${code}`);
          reject(new Error('数据库schema推送失败'));
        }
      });
    }
    
    function initDatabaseData() {
      console.log('\n📊 步骤3: 初始化数据库数据...');
      const initProcess = spawn('node', ['scripts/init-db.js'], { 
        stdio: 'inherit'
      });
      
      initProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 数据库初始化完成');
          resolve();
        } else {
          console.log(`❌ 数据库初始化失败，退出码: ${code}`);
          reject(new Error('数据库初始化失败'));
        }
      });
    }
  });
}

async function startServer() {
  try {
    console.log('\n🚀 启动MCP服务...');
    
    const serverProcess = spawn('node', ['dist/index.js'], { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    serverProcess.on('close', (code) => {
      console.log(`\n🛑 服务已停止，退出码: ${code}`);
      process.exit(code);
    });
    
    serverProcess.on('error', (error) => {
      console.log(`\n❌ 服务启动错误: ${error.message}`);
      process.exit(1);
    });
    
    // 处理进程信号
    process.on('SIGINT', () => {
      console.log('\n🛑 收到SIGINT信号，正在关闭服务...');
      serverProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 收到SIGTERM信号，正在关闭服务...');
      serverProcess.kill('SIGTERM');
    });
    
  } catch (error) {
    console.log(`❌ 启动服务失败: ${error.message}`);
    process.exit(1);
  }
}

// 主函数
async function main() {
  try {
    await checkAndSetupDatabase();
    await startServer();
  } catch (error) {
    console.log(`❌ 启动失败: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 