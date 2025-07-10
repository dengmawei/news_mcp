import { NewsService, NewsItem, NewsSource } from './newsService.js';
import { DatabaseService } from './databaseService.js';
import { LoggerService } from './loggerService.js';

export interface SearchFilters {
  category?: string;
  dateRange?: 'today' | 'week' | 'month';
  source?: string;
  tags?: string[];
}

export class NewsAggregator {
  private newsService: NewsService;
  private databaseService: DatabaseService;
  private logger: LoggerService;
  private cache: Map<string, { data: NewsItem[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    this.newsService = new NewsService();
    this.databaseService = new DatabaseService();
    this.logger = new LoggerService();
  }

  async getLatestNews(limit: number = 10, category?: string): Promise<NewsItem[]> {
    const cacheKey = `latest_${category || 'all'}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      this.logger.logCacheHit(cacheKey, 'memory');
      return cached.data.slice(0, limit);
    }

    try {
      // 首先尝试从数据库获取新闻
      let news = await this.databaseService.getLatestNews(limit, category);
      
      // 如果数据库中的新闻数量不足，则进行实时抓取
      if (news.length < limit) {
        this.logger.info('数据库新闻数量不足，进行实时抓取', {
          required: limit,
          available: news.length,
          category
        });
        
        const sources = await this.newsService.getNewsSources();
        const allNews: NewsItem[] = [];

        // 并行获取所有源的新闻
        const newsPromises = sources.map(source => 
          this.newsService.fetchNewsFromSource(source)
        );
        
        const newsResults = await Promise.allSettled(newsPromises);
        
        newsResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allNews.push(...result.value);
          } else {
            this.logger.error('获取新闻失败', { 
              source: sources[index].name, 
              error: result.reason.message 
            });
          }
        });

        // 按发布时间排序
        allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

        // 过滤分类
        let filteredNews = allNews;
        if (category) {
          filteredNews = allNews.filter(news => news.category === category);
        }

        news = filteredNews.slice(0, limit);
      } else {
        this.logger.info('从数据库获取新闻', { count: news.length, category });
      }

      // 缓存结果
      this.cache.set(cacheKey, {
        data: news,
        timestamp: Date.now()
      });

      return news;
    } catch (error) {
      this.logger.error('获取最新新闻失败', { error: error.message });
      return [];
    }
  }

  async searchNews(
    query: string, 
    limit: number = 10, 
    dateRange: 'today' | 'week' | 'month' = 'week',
    filters?: SearchFilters
  ): Promise<NewsItem[]> {
    const cacheKey = `search_${query}_${limit}_${dateRange}_${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      this.logger.logCacheHit(cacheKey, 'memory');
      return cached.data.slice(0, limit);
    }

    try {
      // 首先尝试从数据库搜索
      let results = await this.databaseService.searchNews(query, limit * 2); // 获取更多结果用于过滤
      
      // 应用日期过滤
      const dateFiltered = this.filterByDateRange(results, dateRange);
      
      // 应用其他过滤条件
      let filtered = this.applyFilters(dateFiltered, filters);
      
      // 如果数据库搜索结果不足，则从所有新闻中搜索
      if (filtered.length < limit) {
        this.logger.info('数据库搜索结果不足，从所有新闻中搜索', {
          query,
          required: limit,
          available: filtered.length
        });
        
        // 获取所有新闻
        const allNews = await this.getLatestNews(1000); // 获取更多新闻用于搜索
        
        // 应用日期过滤
        const dateFilteredAll = this.filterByDateRange(allNews, dateRange);
        
        // 应用其他过滤条件
        let filteredAll = this.applyFilters(dateFilteredAll, filters);
        
        // 搜索匹配
        const searchResults = this.searchInNews(filteredAll, query);
        filtered = searchResults;
      }
      
      const result = filtered.slice(0, limit);
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      this.logger.info('新闻搜索完成', { 
        query, 
        results: result.length,
        totalSearched: filtered.length 
      });

      return result;
    } catch (error) {
      this.logger.error('搜索新闻失败', { query, error: error.message });
      return [];
    }
  }

  private filterByDateRange(news: NewsItem[], dateRange: string): NewsItem[] {
    const now = new Date();
    const cutoffDate = new Date();

    switch (dateRange) {
      case 'today':
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return news;
    }

    return news.filter(item => item.publishedAt >= cutoffDate);
  }

  private applyFilters(news: NewsItem[], filters?: SearchFilters): NewsItem[] {
    if (!filters) return news;

    let filtered = news;

    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.source) {
      filtered = filtered.filter(item => item.source === filters.source);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item => 
        filters.tags!.some(tag => item.tags.includes(tag))
      );
    }

    return filtered;
  }

  private searchInNews(news: NewsItem[], query: string): NewsItem[] {
    const searchTerms = query.toLowerCase().split(' ');
    
    return news.filter(item => {
      const searchableText = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
      
      // 计算匹配度
      let score = 0;
      searchTerms.forEach(term => {
        if (searchableText.includes(term)) {
          score += 1;
          // 标题匹配给予更高权重
          if (item.title.toLowerCase().includes(term)) {
            score += 2;
          }
          // 标签匹配给予中等权重
          if (item.tags.some(tag => tag.toLowerCase().includes(term))) {
            score += 1;
          }
        }
      });
      
      return score > 0;
    }).sort((a, b) => {
      // 按匹配度排序
      const scoreA = this.calculateSearchScore(a, searchTerms);
      const scoreB = this.calculateSearchScore(b, searchTerms);
      return scoreB - scoreA;
    });
  }

  private calculateSearchScore(item: NewsItem, searchTerms: string[]): number {
    const searchableText = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
    let score = 0;
    
    searchTerms.forEach(term => {
      if (searchableText.includes(term)) {
        score += 1;
        if (item.title.toLowerCase().includes(term)) {
          score += 2;
        }
        if (item.tags.some(tag => tag.toLowerCase().includes(term))) {
          score += 1;
        }
      }
    });
    
    return score;
  }

  async getNewsByCategory(category: string, limit: number = 10): Promise<NewsItem[]> {
    return this.getLatestNews(limit, category);
  }

  async getNewsBySource(sourceName: string, limit: number = 10): Promise<NewsItem[]> {
    try {
      const news = await this.databaseService.getNewsBySource(sourceName, limit);
      this.logger.info('按来源获取新闻', { sourceName, count: news.length });
      return news;
    } catch (error) {
      this.logger.error('按来源获取新闻失败', { sourceName, error: error.message });
      
      // 降级到实时抓取
      const sources = await this.newsService.getNewsSources();
      const source = sources.find(s => s.name === sourceName);
      
      if (!source) {
        throw new Error(`未找到新闻源: ${sourceName}`);
      }

      const news = await this.newsService.fetchNewsFromSource(source);
      return news.slice(0, limit);
    }
  }

  async getTrendingTopics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<string[]> {
    try {
      const news = await this.getLatestNews(1000);
      const dateFiltered = this.filterByDateRange(news, timeframe);
      
      // 统计标签频率
      const tagCount: { [key: string]: number } = {};
      
      dateFiltered.forEach(item => {
        item.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      });
      
      // 返回最频繁的标签
      const trendingTopics = Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);
      
      this.logger.info('获取热门话题', { timeframe, count: trendingTopics.length });
      return trendingTopics;
    } catch (error) {
      this.logger.error('获取热门话题失败', { timeframe, error: error.message });
      return [];
    }
  }

  async refreshNews(): Promise<void> {
    try {
      this.logger.info('开始刷新新闻数据');
      
      const sources = await this.newsService.getNewsSources();
      const allNews: NewsItem[] = [];

      // 并行获取所有源的新闻
      const newsPromises = sources.map(source => 
        this.newsService.fetchNewsFromSource(source)
      );
      
      const newsResults = await Promise.allSettled(newsPromises);
      
      newsResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allNews.push(...result.value);
        } else {
          this.logger.error('获取新闻失败', { 
            source: sources[index].name, 
            error: result.reason.message 
          });
        }
      });

      this.logger.info('新闻刷新完成', { 
        sources: sources.length, 
        totalNews: allNews.length 
      });
      
      // 清空缓存
      this.clearCache();
    } catch (error) {
      this.logger.error('刷新新闻失败', { error: error.message });
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.info('缓存已清空');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  async disconnect(): Promise<void> {
    try {
      await this.databaseService.disconnect();
      this.logger.info('数据库连接已关闭');
    } catch (error) {
      this.logger.error('关闭数据库连接失败', { error: error.message });
    }
  }
} 