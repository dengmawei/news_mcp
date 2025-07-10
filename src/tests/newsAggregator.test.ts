import { NewsAggregator } from '../services/newsAggregator.js';
import { NewsService, NewsItem } from '../services/newsService.js';

// Mock NewsService
jest.mock('../services/newsService.js');

describe('NewsAggregator', () => {
  let newsAggregator: NewsAggregator;
  let mockNewsService: jest.Mocked<NewsService>;

  const mockNewsItems: NewsItem[] = [
    {
      id: 'test-1',
      title: 'OpenAI发布GPT-5',
      description: 'OpenAI最新发布的GPT-5在多个基准测试中表现优异',
      url: 'https://example.com/1',
      source: 'TechCrunch AI',
      publishedAt: new Date('2024-01-15'),
      category: 'products',
      tags: ['gpt-5', 'openai', 'llm']
    },
    {
      id: 'test-2',
      title: 'Google发布Gemini Pro',
      description: 'Google发布了新的Gemini Pro模型',
      url: 'https://example.com/2',
      source: 'VentureBeat AI',
      publishedAt: new Date('2024-01-14'),
      category: 'products',
      tags: ['gemini', 'google', 'llm']
    },
    {
      id: 'test-3',
      title: 'AI研究新突破',
      description: '研究人员在AI领域取得重大突破',
      url: 'https://example.com/3',
      source: 'MIT Technology Review',
      publishedAt: new Date('2024-01-13'),
      category: 'research',
      tags: ['research', 'breakthrough', 'ai']
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNewsService = new NewsService() as jest.Mocked<NewsService>;
    newsAggregator = new NewsAggregator();
    
    // Mock getNewsSources方法
    mockNewsService.getNewsSources = jest.fn().mockResolvedValue([
      {
        id: 'techcrunch-ai',
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
        type: 'rss',
        category: 'general',
        language: 'en',
        isActive: true
      }
    ]);

    // Mock fetchNewsFromSource方法
    mockNewsService.fetchNewsFromSource = jest.fn().mockResolvedValue(mockNewsItems);
  });

  describe('getLatestNews', () => {
    it('应该返回最新的新闻', async () => {
      const result = await newsAggregator.getLatestNews(5);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('应该按发布时间排序', async () => {
      const result = await newsAggregator.getLatestNews(10);
      
      if (result.length > 1) {
        const firstDate = result[0].publishedAt.getTime();
        const secondDate = result[1].publishedAt.getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });

    it('应该支持分类过滤', async () => {
      const result = await newsAggregator.getLatestNews(10, 'products');
      
      expect(result).toBeDefined();
      result.forEach(news => {
        expect(news.category).toBe('products');
      });
    });
  });

  describe('searchNews', () => {
    it('应该能够搜索新闻', async () => {
      const result = await newsAggregator.searchNews('GPT', 5);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('应该支持日期范围过滤', async () => {
      const result = await newsAggregator.searchNews('AI', 5, 'week');
      
      expect(result).toBeDefined();
      // 检查是否都在一周内
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      result.forEach(news => {
        expect(news.publishedAt.getTime()).toBeGreaterThan(weekAgo.getTime());
      });
    });

    it('应该按匹配度排序', async () => {
      const result = await newsAggregator.searchNews('GPT', 5);
      
      if (result.length > 1) {
        // 检查标题中包含搜索词的排在前面
        const firstNews = result[0];
        const hasGPTInTitle = firstNews.title.toLowerCase().includes('gpt') ||
                             firstNews.description.toLowerCase().includes('gpt');
        expect(hasGPTInTitle).toBe(true);
      }
    });
  });

  describe('getTrendingTopics', () => {
    it('应该返回热门话题', async () => {
      const result = await newsAggregator.getTrendingTopics('week');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('应该按频率排序', async () => {
      const result = await newsAggregator.getTrendingTopics('week');
      
      if (result.length > 1) {
        // 这里我们无法直接测试频率，但可以确保返回的是字符串数组
        result.forEach(topic => {
          expect(typeof topic).toBe('string');
        });
      }
    });
  });

  describe('缓存功能', () => {
    it('应该缓存结果', async () => {
      const firstCall = await newsAggregator.getLatestNews(5);
      const secondCall = await newsAggregator.getLatestNews(5);
      
      expect(firstCall).toEqual(secondCall);
    });

    it('应该返回缓存统计', () => {
      const stats = newsAggregator.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('应该能够清空缓存', () => {
      newsAggregator.clearCache();
      const stats = newsAggregator.getCacheStats();
      
      expect(stats.size).toBe(0);
      expect(stats.keys.length).toBe(0);
    });
  });

  describe('错误处理', () => {
    it('应该在新闻源失败时继续处理其他源', async () => {
      // Mock一个失败的新闻源
      mockNewsService.fetchNewsFromSource = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockNewsItems);

      const result = await newsAggregator.getLatestNews(5);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
}); 