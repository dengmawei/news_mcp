import { DatabaseService } from '../services/databaseService.js';
import { NewsItem, NewsSource } from '../services/newsService.js';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    newsSource: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn()
    },
    newsItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn()
    },
    newsSummary: {
      upsert: jest.fn(),
      findUnique: jest.fn()
    },
    cacheEntry: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockPrisma: any;

  const mockNewsItem: NewsItem = {
    id: 'test-1',
    title: '测试新闻标题',
    description: '测试新闻描述',
    url: 'https://example.com/test',
    source: 'Test Source',
    publishedAt: new Date(),
    category: 'test',
    tags: ['test', 'ai'],
    author: 'Test Author'
  };

  const mockNewsSource: NewsSource = {
    id: 'source-1',
    name: 'Test Source',
    url: 'https://example.com/feed',
    type: 'rss',
    category: 'test',
    language: 'en',
    isActive: true,
    lastUpdate: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    databaseService = new DatabaseService();
    mockPrisma = (databaseService as any).prisma;
  });

  afterEach(async () => {
    await databaseService.disconnect();
  });

  describe('新闻源管理', () => {
    it('应该能够创建新闻源', async () => {
      const sourceData = {
        name: 'New Source',
        url: 'https://example.com/feed',
        type: 'rss' as const,
        category: 'general',
        language: 'en'
      };

      mockPrisma.newsSource.create.mockResolvedValue({
        id: 'new-source-id',
        ...sourceData,
        isActive: true,
        lastUpdate: new Date()
      });

      const result = await databaseService.createNewsSource(sourceData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(sourceData.name);
      expect(result.url).toBe(sourceData.url);
      expect(mockPrisma.newsSource.create).toHaveBeenCalledWith({
        data: sourceData
      });
    });

    it('应该能够获取新闻源列表', async () => {
      mockPrisma.newsSource.findMany.mockResolvedValue([mockNewsSource]);

      const result = await databaseService.getNewsSources();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe(mockNewsSource.name);
      expect(mockPrisma.newsSource.findMany).toHaveBeenCalledWith({
        where: { isActive: true }
      });
    });

    it('应该能够更新新闻源状态', async () => {
      mockPrisma.newsSource.update.mockResolvedValue({});

      await databaseService.updateNewsSourceStatus('source-1', false);
      
      expect(mockPrisma.newsSource.update).toHaveBeenCalledWith({
        where: { id: 'source-1' },
        data: { 
          isActive: false,
          lastUpdate: expect.any(Date)
        }
      });
    });
  });

  describe('新闻管理', () => {
    it('应该能够保存新闻', async () => {
      mockPrisma.newsSource.findFirst.mockResolvedValue(mockNewsSource);
      mockPrisma.newsItem.findUnique.mockResolvedValue(null);
      mockPrisma.newsItem.create.mockResolvedValue(mockNewsItem);

      await databaseService.saveNews([mockNewsItem]);
      
      expect(mockPrisma.newsSource.findFirst).toHaveBeenCalledWith({
        where: { name: mockNewsItem.source }
      });
      expect(mockPrisma.newsItem.findUnique).toHaveBeenCalledWith({
        where: { url: mockNewsItem.url }
      });
      expect(mockPrisma.newsItem.create).toHaveBeenCalled();
    });

    it('应该能够根据ID获取新闻', async () => {
      mockPrisma.newsItem.findUnique.mockResolvedValue({
        ...mockNewsItem,
        source: mockNewsSource
      });

      const result = await databaseService.getNewsById('test-1');
      
      expect(result).toBeDefined();
      expect(result?.title).toBe(mockNewsItem.title);
      expect(result?.source).toBe(mockNewsItem.source);
      expect(mockPrisma.newsItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-1' },
        include: { source: true }
      });
    });

    it('应该能够获取最新新闻', async () => {
      mockPrisma.newsItem.findMany.mockResolvedValue([{
        ...mockNewsItem,
        source: mockNewsSource
      }]);

      const result = await databaseService.getLatestNews(5);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(mockPrisma.newsItem.findMany).toHaveBeenCalledWith({
        where: {},
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take: 5
      });
    });

    it('应该能够按分类获取新闻', async () => {
      mockPrisma.newsItem.findMany.mockResolvedValue([{
        ...mockNewsItem,
        source: mockNewsSource
      }]);

      const result = await databaseService.getLatestNews(5, 'test');
      
      expect(result).toBeDefined();
      expect(mockPrisma.newsItem.findMany).toHaveBeenCalledWith({
        where: { category: 'test' },
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take: 5
      });
    });

    it('应该能够搜索新闻', async () => {
      mockPrisma.newsItem.findMany.mockResolvedValue([{
        ...mockNewsItem,
        source: mockNewsSource
      }]);

      const result = await databaseService.searchNews('测试', 5);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockPrisma.newsItem.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: '测试', mode: 'insensitive' } },
            { description: { contains: '测试', mode: 'insensitive' } },
            { tags: { has: '测试' } }
          ]
        },
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take: 5
      });
    });
  });

  describe('新闻摘要管理', () => {
    it('应该能够保存新闻摘要', async () => {
      const summaryData = {
        summary: '测试摘要',
        keyPoints: ['要点1', '要点2'],
        sentiment: 'positive' as const,
        impact: 'high' as const,
        relatedTopics: ['topic1', 'topic2']
      };

      mockPrisma.newsSummary.upsert.mockResolvedValue({});

      await databaseService.saveNewsSummary('news-1', summaryData);
      
      expect(mockPrisma.newsSummary.upsert).toHaveBeenCalledWith({
        where: { newsId: 'news-1' },
        update: summaryData,
        create: {
          newsId: 'news-1',
          ...summaryData
        }
      });
    });

    it('应该能够获取新闻摘要', async () => {
      const mockSummary = {
        id: 'summary-1',
        newsId: 'news-1',
        summary: '测试摘要',
        keyPoints: ['要点1', '要点2'],
        sentiment: 'positive',
        impact: 'high',
        relatedTopics: ['topic1', 'topic2'],
        news: {
          source: mockNewsSource
        }
      };

      mockPrisma.newsSummary.findUnique.mockResolvedValue(mockSummary);

      const result = await databaseService.getNewsSummary('news-1');
      
      expect(result).toBeDefined();
      expect(result?.summary).toBe('测试摘要');
      expect(result?.sentiment).toBe('positive');
      expect(result?.impact).toBe('high');
    });
  });

  describe('统计信息', () => {
    it('应该能够获取新闻统计', async () => {
      const mockStats = {
        totalNews: 100,
        totalSources: 5,
        newsByCategory: [
          { category: 'general', count: 50 },
          { category: 'business', count: 30 }
        ],
        newsBySource: [
          { source: { name: 'Source 1' }, count: 20 },
          { source: { name: 'Source 2' }, count: 15 }
        ]
      };

      mockPrisma.newsItem.count.mockResolvedValue(mockStats.totalNews);
      mockPrisma.newsSource.count.mockResolvedValue(mockStats.totalSources);
      mockPrisma.newsItem.groupBy
        .mockResolvedValueOnce(mockStats.newsByCategory)
        .mockResolvedValueOnce(mockStats.newsBySource);

      const result = await databaseService.getNewsStats();
      
      expect(result).toBeDefined();
      expect(result.totalNews).toBe(100);
      expect(result.totalSources).toBe(5);
      expect(Array.isArray(result.newsByCategory)).toBe(true);
      expect(Array.isArray(result.newsBySource)).toBe(true);
    });
  });

  describe('数据清理', () => {
    it('应该能够清理旧新闻', async () => {
      mockPrisma.newsItem.deleteMany.mockResolvedValue({ count: 10 });

      const result = await databaseService.cleanupOldNews(30);
      
      expect(result).toBe(10);
      expect(mockPrisma.newsItem.deleteMany).toHaveBeenCalledWith({
        where: {
          publishedAt: {
            lt: expect.any(Date)
          }
        }
      });
    });
  });

  describe('错误处理', () => {
    it('应该在数据库操作失败时抛出错误', async () => {
      mockPrisma.newsItem.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(databaseService.getNewsById('invalid-id')).rejects.toThrow('Database error');
    });

    it('应该在保存新闻时处理重复URL', async () => {
      mockPrisma.newsSource.findFirst.mockResolvedValue(mockNewsSource);
      mockPrisma.newsItem.findUnique.mockResolvedValue(mockNewsItem); // 已存在

      await databaseService.saveNews([mockNewsItem]);
      
      // 应该不会调用create，因为新闻已存在
      expect(mockPrisma.newsItem.create).not.toHaveBeenCalled();
    });
  });
}); 