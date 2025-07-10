import { NewsService } from '../services/newsService.js';
import { NewsAggregator } from '../services/newsAggregator.js';
import { NewsAnalyzer } from '../services/newsAnalyzer.js';
import { CacheService } from '../services/cacheService.js';
import { DatabaseService } from '../services/databaseService.js';

describe('集成测试', () => {
  let newsService: NewsService;
  let newsAggregator: NewsAggregator;
  let newsAnalyzer: NewsAnalyzer;
  let cacheService: CacheService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    // 初始化所有服务
    newsService = new NewsService();
    newsAggregator = new NewsAggregator();
    newsAnalyzer = new NewsAnalyzer();
    cacheService = new CacheService();
    databaseService = new DatabaseService();
  });

  afterAll(async () => {
    // 清理资源
    await cacheService.disconnect();
    await databaseService.disconnect();
  });

  describe('新闻获取流程', () => {
    it('应该能够完整获取和处理新闻', async () => {
      // 1. 获取新闻源
      const sources = await newsService.getNewsSources();
      expect(sources).toBeDefined();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);

      // 2. 从新闻源获取新闻
      if (sources.length > 0) {
        const source = sources[0];
        const news = await newsService.fetchNewsFromSource(source);
        
        expect(news).toBeDefined();
        expect(Array.isArray(news)).toBe(true);
        
        if (news.length > 0) {
          // 3. 测试新闻聚合
          const aggregatedNews = await newsAggregator.getLatestNews(5);
          expect(aggregatedNews).toBeDefined();
          expect(Array.isArray(aggregatedNews)).toBe(true);

          // 4. 测试新闻分析
          const newsItem = news[0];
          const summary = await newsAnalyzer.getNewsSummary(newsItem.id, true);
          expect(summary).toBeDefined();
          expect(summary.id).toBe(newsItem.id);
          expect(summary.title).toBe(newsItem.title);
        }
      }
    }, 30000); // 增加超时时间，因为需要网络请求

    it('应该能够搜索新闻', async () => {
      const searchResults = await newsAggregator.searchNews('AI', 5);
      expect(searchResults).toBeDefined();
      expect(Array.isArray(searchResults)).toBe(true);
    }, 30000);

    it('应该能够获取趋势分析', async () => {
      const trends = await newsAnalyzer.getAITrends('week');
      expect(trends).toBeDefined();
      expect(trends.timeframe).toBe('week');
      expect(trends.topTopics).toBeDefined();
      expect(trends.sentimentDistribution).toBeDefined();
    }, 30000);
  });

  describe('缓存集成', () => {
    it('应该能够缓存和获取数据', async () => {
      const testData = { test: 'data', timestamp: Date.now() };
      const cacheKey = 'test-cache-key';

      // 设置缓存
      await cacheService.set(cacheKey, testData, { ttl: 60 });
      
      // 获取缓存
      const cachedData = await cacheService.get(cacheKey);
      expect(cachedData).toBeDefined();
      expect(cachedData).toEqual(testData);

      // 删除缓存
      await cacheService.delete(cacheKey);
      const deletedData = await cacheService.get(cacheKey);
      expect(deletedData).toBeNull();
    });

    it('应该返回缓存统计', async () => {
      const stats = await cacheService.getStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('redis');
      expect(stats).toHaveProperty('memorySize');
      expect(stats).toHaveProperty('dbSize');
      expect(typeof stats.redis).toBe('boolean');
      expect(typeof stats.memorySize).toBe('number');
      expect(typeof stats.dbSize).toBe('number');
    });
  });

  describe('数据库集成', () => {
    it('应该能够保存和获取新闻', async () => {
      const testNews = {
        id: 'test-db-1',
        title: '测试新闻标题',
        description: '测试新闻描述',
        url: 'https://example.com/test-db',
        source: 'Test Source',
        publishedAt: new Date(),
        category: 'test',
        tags: ['test', 'ai'],
        author: 'Test Author'
      };

      // 保存新闻
      await databaseService.saveNews([testNews]);

      // 获取新闻
      const savedNews = await databaseService.getNewsById(testNews.id);
      expect(savedNews).toBeDefined();
      if (savedNews) {
        expect(savedNews.title).toBe(testNews.title);
        expect(savedNews.description).toBe(testNews.description);
      }
    });

    it('应该能够搜索新闻', async () => {
      const searchResults = await databaseService.searchNews('测试', 5);
      expect(searchResults).toBeDefined();
      expect(Array.isArray(searchResults)).toBe(true);
    });

    it('应该返回统计信息', async () => {
      const stats = await databaseService.getNewsStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalNews');
      expect(stats).toHaveProperty('totalSources');
      expect(stats).toHaveProperty('newsByCategory');
      expect(stats).toHaveProperty('newsBySource');
      expect(typeof stats.totalNews).toBe('number');
      expect(typeof stats.totalSources).toBe('number');
      expect(Array.isArray(stats.newsByCategory)).toBe(true);
      expect(Array.isArray(stats.newsBySource)).toBe(true);
    });
  });

  describe('错误处理和恢复', () => {
    it('应该在网络错误时优雅降级', async () => {
      // 测试无效的新闻源
      const invalidSource = {
        id: 'invalid',
        name: 'Invalid Source',
        url: 'https://invalid-url-that-does-not-exist.com/feed',
        type: 'rss' as const,
        category: 'test',
        language: 'en',
        isActive: true
      };

      const news = await newsService.fetchNewsFromSource(invalidSource);
      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      // 应该返回空数组而不是抛出错误
      expect(news.length).toBe(0);
    });

    it('应该在缓存失败时继续工作', async () => {
      // 测试缓存服务在Redis不可用时的行为
      const testData = { test: 'fallback' };
      const cacheKey = 'fallback-test';

      await cacheService.set(cacheKey, testData);
      const cachedData = await cacheService.get(cacheKey);
      
      // 即使Redis不可用，也应该通过内存缓存或数据库缓存工作
      expect(cachedData).toBeDefined();
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量新闻', async () => {
      const startTime = Date.now();
      
      // 获取大量新闻
      const news = await newsAggregator.getLatestNews(100);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    }, 15000);

    it('应该能够并发处理多个请求', async () => {
      const promises = [
        newsAggregator.getLatestNews(5),
        newsAggregator.searchNews('AI', 5),
        newsAnalyzer.getAITrends('week'),
        cacheService.getStats(),
        databaseService.getNewsStats()
      ];

      const results = await Promise.all(promises);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    }, 20000);
  });
}); 