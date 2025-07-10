#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('正在初始化数据库...');

    // 创建默认新闻源
    const defaultSources = [
      {
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
        type: 'rss',
        category: 'general',
        language: 'en'
      },
      {
        name: 'VentureBeat AI',
        url: 'https://venturebeat.com/category/ai/feed/',
        type: 'rss',
        category: 'business',
        language: 'en'
      },
      {
        name: 'MIT Technology Review',
        url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
        type: 'rss',
        category: 'research',
        language: 'en'
      },
      {
        name: 'AI News',
        url: 'https://artificialintelligence-news.com/feed/',
        type: 'rss',
        category: 'general',
        language: 'en'
      },
      {
        name: 'The Verge AI',
        url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
        type: 'rss',
        category: 'products',
        language: 'en'
      }
    ];

    for (const source of defaultSources) {
      await prisma.newsSource.upsert({
        where: { name: source.name },
        update: {},
        create: source
      });
      console.log(`✓ 创建新闻源: ${source.name}`);
    }

    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (process.argv[1] && process.argv[1].endsWith('init-db.js')) {
  initDatabase();
}

export { initDatabase }; 