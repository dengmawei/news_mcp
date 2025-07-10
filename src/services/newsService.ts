import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import { DatabaseService } from './databaseService.js';
import { LoggerService } from './loggerService.js';

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scrape';
  category: string;
  language: string;
  isActive: boolean;
  lastUpdate?: Date;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: Date;
  category: string;
  tags: string[];
  imageUrl?: string;
  author?: string;
}

export class NewsService {
  private databaseService: DatabaseService;
  private logger: LoggerService;
  private sources: NewsSource[] = [
    {
      id: 'techcrunch-ai',
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
      type: 'rss',
      category: 'general',
      language: 'en',
      isActive: true,
    },
    {
      id: 'venturebeat-ai',
      name: 'VentureBeat AI',
      url: 'https://venturebeat.com/category/ai/feed/',
      type: 'rss',
      category: 'business',
      language: 'en',
      isActive: true,
    },
    {
      id: 'mit-tech-review',
      name: 'MIT Technology Review',
      url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
      type: 'rss',
      category: 'research',
      language: 'en',
      isActive: true,
    },
    {
      id: 'ai-news',
      name: 'AI News',
      url: 'https://artificialintelligence-news.com/feed/',
      type: 'rss',
      category: 'general',
      language: 'en',
      isActive: true,
    },
    {
      id: 'the-verge-ai',
      name: 'The Verge AI',
      url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
      type: 'rss',
      category: 'products',
      language: 'en',
      isActive: true,
    },
  ];

  private parser: Parser;

  constructor() {
    this.databaseService = new DatabaseService();
    this.logger = new LoggerService();
    this.parser = new Parser({
      customFields: {
        item: ['media:content', 'media:thumbnail', 'dc:creator'],
      },
    });
  }

  async getNewsSources(includeStatus: boolean = false): Promise<NewsSource[]> {
    try {
      // 首先尝试从数据库获取新闻源
      const dbSources = await this.databaseService.getNewsSources();
      
      if (dbSources.length > 0) {
        this.logger.info('从数据库获取新闻源', { count: dbSources.length });
        
        if (includeStatus) {
          // 检查每个源的状态
          const sourcesWithStatus = await Promise.all(
            dbSources.map(async (source) => {
              try {
                const response = await axios.head(source.url, { timeout: 5000 });
                return {
                  ...source,
                  isActive: response.status === 200,
                  lastUpdate: new Date(),
                };
              } catch (error) {
                return {
                  ...source,
                  isActive: false,
                  lastUpdate: new Date(),
                };
              }
            })
          );
          return sourcesWithStatus;
        }
        return dbSources;
      }
      
      // 如果数据库中没有新闻源，使用默认配置并保存到数据库
      this.logger.info('数据库中没有新闻源，使用默认配置');
      
      for (const source of this.sources) {
        try {
          await this.databaseService.createNewsSource(source);
        } catch (error) {
          this.logger.error('创建新闻源失败', { source: source.name, error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      return includeStatus ? await this.getNewsSources(true) : this.sources;
    } catch (error) {
      this.logger.error('获取新闻源失败', { error: error instanceof Error ? error.message : String(error) });
      return this.sources; // 降级到默认配置
    }
  }

  async fetchNewsFromSource(source: NewsSource): Promise<NewsItem[]> {
    const startTime = Date.now();
    
    try {
      let newsItems: NewsItem[] = [];
      
      switch (source.type) {
        case 'rss':
          newsItems = await this.fetchFromRSS(source);
          break;
        case 'api':
          newsItems = await this.fetchFromAPI(source);
          break;
        case 'scrape':
          newsItems = await this.fetchFromScraping(source);
          break;
        default:
          throw new Error(`不支持的新闻源类型: ${source.type}`);
      }
      
      // 保存新闻到数据库
      if (newsItems.length > 0) {
        await this.saveNews(newsItems);
        this.logger.logNewsFetch(source.name, newsItems.length, Date.now() - startTime);
      }
      
      return newsItems;
    } catch (error) {
      this.logger.logNewsError(source.name, error as Error);
      return [];
    }
  }

  private async fetchFromRSS(source: NewsSource): Promise<NewsItem[]> {
    const feed = await this.parser.parseURL(source.url);
    
    return feed.items.map((item, index) => ({
      id: `${source.id}-${Date.now()}-${index}`,
      title: item.title || '',
      description: item.contentSnippet || item.content || '',
      content: item.content,
      url: item.link || '',
      source: source.name,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      category: source.category,
      tags: this.extractTags(item),
      imageUrl: this.extractImageUrl(item),
      author: item.creator || item.author || '',
    }));
  }

  private async fetchFromAPI(source: NewsSource): Promise<NewsItem[]> {
    // 这里可以集成各种新闻API，如NewsAPI、GNews等
    // 示例实现
    const response = await axios.get(source.url);
    return response.data.articles?.map((article: any, index: number) => ({
      id: `${source.id}-${Date.now()}-${index}`,
      title: article.title || '',
      description: article.description || '',
      content: article.content,
      url: article.url || '',
      source: source.name,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      category: source.category,
      tags: article.tags || [],
      imageUrl: article.urlToImage,
      author: article.author || '',
    })) || [];
  }

  private async fetchFromScraping(source: NewsSource): Promise<NewsItem[]> {
    const response = await axios.get(source.url);
    const $ = cheerio.load(response.data);
    
    const articles: NewsItem[] = [];
    
    // 这里需要根据具体网站结构来解析
    // 示例：假设网站有 .article 类的元素
    $('.article').each((index, element) => {
      const $el = $(element);
      articles.push({
        id: `${source.id}-${Date.now()}-${index}`,
        title: $el.find('.title').text().trim(),
        description: $el.find('.description').text().trim(),
        url: $el.find('a').attr('href') || '',
        source: source.name,
        publishedAt: new Date(),
        category: source.category,
        tags: [],
        imageUrl: $el.find('img').attr('src'),
        author: $el.find('.author').text().trim(),
      });
    });
    
    return articles;
  }

  private extractTags(item: any): string[] {
    const tags: string[] = [];
    
    // 从标题和描述中提取可能的标签
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
    
    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural network', 'chatgpt', 'gpt', 'llm', 'large language model',
      'computer vision', 'nlp', 'natural language processing', 'robotics',
      'autonomous', 'automation', 'algorithm', 'data science'
    ];
    
    aiKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return tags;
  }

  private extractImageUrl(item: any): string | undefined {
    // 尝试从不同的字段中提取图片URL
    if (item['media:content'] && item['media:content'].$.url) {
      return item['media:content'].$.url;
    }
    
    if (item['media:thumbnail'] && item['media:thumbnail'].$.url) {
      return item['media:thumbnail'].$.url;
    }
    
    // 从内容中提取图片URL
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/);
      if (imgMatch) {
        return imgMatch[1];
      }
    }
    
    return undefined;
  }

  async getNewsById(newsId: string): Promise<NewsItem | null> {
    try {
      const news = await this.databaseService.getNewsById(newsId);
      if (news) {
        this.logger.debug('从数据库获取新闻', { newsId, title: news.title });
      }
      return news;
    } catch (error) {
      this.logger.error('获取新闻失败', { newsId, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  async saveNews(newsItems: NewsItem[]): Promise<void> {
    if (newsItems.length === 0) {
      return;
    }
    
    try {
      const startTime = Date.now();
      await this.databaseService.saveNews(newsItems);
      const duration = Date.now() - startTime;
      
      this.logger.info('新闻保存成功', {
        count: newsItems.length,
        duration: `${duration}ms`
      });
    } catch (error) {
      this.logger.error('保存新闻失败', {
        count: newsItems.length,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getLatestNews(limit: number = 10, category?: string): Promise<NewsItem[]> {
    try {
      const news = await this.databaseService.getLatestNews(limit, category);
      this.logger.debug('获取最新新闻', { limit, category, count: news.length });
      return news;
    } catch (error) {
      this.logger.error('获取最新新闻失败', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async searchNews(query: string, limit: number = 10): Promise<NewsItem[]> {
    try {
      const news = await this.databaseService.searchNews(query, limit);
      this.logger.debug('搜索新闻', { query, limit, count: news.length });
      return news;
    } catch (error) {
      this.logger.error('搜索新闻失败', { query, error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async getNewsByCategory(category: string, limit: number = 10): Promise<NewsItem[]> {
    try {
      const news = await this.databaseService.getNewsByCategory(category, limit);
      this.logger.debug('按分类获取新闻', { category, limit, count: news.length });
      return news;
    } catch (error) {
      this.logger.error('按分类获取新闻失败', { category, error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async getNewsBySource(sourceName: string, limit: number = 10): Promise<NewsItem[]> {
    try {
      const news = await this.databaseService.getNewsBySource(sourceName, limit);
      this.logger.debug('按来源获取新闻', { sourceName, limit, count: news.length });
      return news;
    } catch (error) {
      this.logger.error('按来源获取新闻失败', { sourceName, error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async cleanupOldNews(daysOld: number = 30): Promise<number> {
    try {
      const deletedCount = await this.databaseService.cleanupOldNews(daysOld);
      this.logger.info('清理旧新闻', { daysOld, deletedCount });
      return deletedCount;
    } catch (error) {
      this.logger.error('清理旧新闻失败', { daysOld, error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.databaseService.disconnect();
      this.logger.info('数据库连接已关闭');
    } catch (error) {
      this.logger.error('关闭数据库连接失败', { error: error instanceof Error ? error.message : String(error) });
    }
  }
} 