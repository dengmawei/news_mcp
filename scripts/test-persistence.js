#!/usr/bin/env node

import { DataSyncService } from '../src/services/dataSyncService.js';
import { NewsService } from '../src/services/newsService.js';
import { NewsAggregator } from '../src/services/newsAggregator.js';
import { NewsAnalyzer } from '../src/services/newsAnalyzer.js';
import { LoggerService } from '../src/services/loggerService.js';

const logger = new LoggerService();

async function testPersistence() {
  logger.info('开始测试数据持久化功能...');

  try {
    // 1. 测试数据同步服务
    logger.info('1. 测试数据同步服务');
    const dataSyncService = new DataSyncService();
    
    // 强制同步所有新闻源
    const syncResult = await dataSyncService.syncNews({ force: true });
    logger.info('数据同步结果:', syncResult);

    // 获取同步状态
    const syncStatus = await dataSyncService.getSyncStatus();
    logger.info('同步状态:', syncStatus);

    // 获取数据库统计
    const dbStats = await dataSyncService.getDatabaseStats();
    logger.info('数据库统计:', dbStats);

    // 2. 测试新闻服务
    logger.info('2. 测试新闻服务');
    const newsService = new NewsService();
    
    // 获取新闻源
    const sources = await newsService.getNewsSources();
    logger.info(`获取到 ${sources.length} 个新闻源`);

    // 获取最新新闻
    const latestNews = await newsService.getLatestNews(5);
    logger.info(`获取到 ${latestNews.length} 条最新新闻`);

    if (latestNews.length > 0) {
      // 测试获取单条新闻
      const firstNews = latestNews[0];
      const newsById = await newsService.getNewsById(firstNews.id);
      logger.info('通过ID获取新闻:', newsById ? '成功' : '失败');
    }

    // 3. 测试新闻聚合器
    logger.info('3. 测试新闻聚合器');
    const newsAggregator = new NewsAggregator();
    
    // 测试搜索功能
    const searchResults = await newsAggregator.searchNews('AI', 5);
    logger.info(`搜索"AI"得到 ${searchResults.length} 条结果`);

    // 测试按分类获取
    const categoryNews = await newsAggregator.getNewsByCategory('general', 3);
    logger.info(`按分类"general"获取到 ${categoryNews.length} 条新闻`);

    // 4. 测试新闻分析器
    logger.info('4. 测试新闻分析器');
    const newsAnalyzer = new NewsAnalyzer();
    
    // 测试趋势分析
    const trends = await newsAnalyzer.getAITrends('week');
    logger.info('AI趋势分析结果:', {
      topTopics: trends.topTopics.length,
      topSources: trends.topSources.length,
      sentimentDistribution: trends.sentimentDistribution
    });

    // 如果有新闻，测试摘要功能
    if (latestNews.length > 0) {
      const firstNews = latestNews[0];
      const summary = await newsAnalyzer.getNewsSummary(firstNews.id);
      logger.info('新闻摘要生成:', {
        title: summary.title,
        sentiment: summary.sentiment,
        impact: summary.impact,
        keyPointsCount: summary.keyPoints.length
      });
    }

    // 5. 测试数据清理
    logger.info('5. 测试数据清理');
    const cleanupResult = await dataSyncService.cleanupOldData(1); // 清理1天前的数据
    logger.info(`清理了 ${cleanupResult} 条旧数据`);

    // 6. 验证数据持久化
    logger.info('6. 验证数据持久化');
    
    // 重新获取数据，验证是否从数据库读取
    const newsAfterSync = await newsService.getLatestNews(5);
    logger.info(`重新获取到 ${newsAfterSync.length} 条新闻（应该从数据库读取）`);

    // 比较数据是否一致
    if (latestNews.length > 0 && newsAfterSync.length > 0) {
      const isDataPersisted = latestNews.some(news => 
        newsAfterSync.some(persistedNews => persistedNews.id === news.id)
      );
      logger.info('数据持久化验证:', isDataPersisted ? '成功' : '失败');
    }

    logger.info('数据持久化功能测试完成！');

    // 清理资源
    await dataSyncService.disconnect();
    await newsService.disconnect();
    await newsAggregator.disconnect();
    await newsAnalyzer.disconnect();

  } catch (error) {
    logger.error('测试过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (process.argv[1] && process.argv[1].endsWith('test-persistence.js')) {
  testPersistence();
}

export { testPersistence }; 