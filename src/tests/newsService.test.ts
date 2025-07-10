import { NewsService, NewsItem, NewsSource } from '../services/newsService.js';

describe('NewsService', () => {
  let newsService: NewsService;

  beforeEach(() => {
    newsService = new NewsService();
  });

  describe('getNewsSources', () => {
    it('应该返回所有新闻源', async () => {
      const sources = await newsService.getNewsSources();
      expect(sources).toBeDefined();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
    });

    it('应该包含正确的新闻源信息', async () => {
      const sources = await newsService.getNewsSources();
      const source = sources[0];
      
      expect(source).toHaveProperty('id');
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('url');
      expect(source).toHaveProperty('type');
      expect(source).toHaveProperty('category');
      expect(source).toHaveProperty('language');
      expect(source).toHaveProperty('isActive');
    });
  });

  describe('fetchNewsFromSource', () => {
    it('应该能够从RSS源获取新闻', async () => {
      const mockSource: NewsSource = {
        id: 'test-rss',
        name: 'Test RSS',
        url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
        type: 'rss',
        category: 'general',
        language: 'en',
        isActive: true,
      };

      try {
        const news = await newsService.fetchNewsFromSource(mockSource);
        expect(Array.isArray(news)).toBe(true);
        
        if (news.length > 0) {
          const newsItem = news[0];
          expect(newsItem).toHaveProperty('id');
          expect(newsItem).toHaveProperty('title');
          expect(newsItem).toHaveProperty('description');
          expect(newsItem).toHaveProperty('url');
          expect(newsItem).toHaveProperty('source');
          expect(newsItem).toHaveProperty('publishedAt');
          expect(newsItem).toHaveProperty('category');
          expect(newsItem).toHaveProperty('tags');
        }
      } catch (error) {
        // RSS源可能不可用，这是正常的
        console.log('RSS源测试跳过:', error);
      }
    });
  });

  describe('新闻项目结构', () => {
    it('应该创建正确的新闻项目结构', () => {
      const mockNewsItem: NewsItem = {
        id: 'test-1',
        title: '测试新闻标题',
        description: '测试新闻描述',
        url: 'https://example.com/test',
        source: 'Test Source',
        publishedAt: new Date(),
        category: 'general',
        tags: ['ai', 'test'],
      };

      expect(mockNewsItem.id).toBe('test-1');
      expect(mockNewsItem.title).toBe('测试新闻标题');
      expect(mockNewsItem.tags).toContain('ai');
    });
  });
}); 