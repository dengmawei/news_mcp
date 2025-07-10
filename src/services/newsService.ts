import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

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
    this.parser = new Parser({
      customFields: {
        item: ['media:content', 'media:thumbnail', 'dc:creator'],
      },
    });
  }

  async getNewsSources(includeStatus: boolean = false): Promise<NewsSource[]> {
    if (includeStatus) {
      // 检查每个源的状态
      const sourcesWithStatus = await Promise.all(
        this.sources.map(async (source) => {
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
    return this.sources;
  }

  async fetchNewsFromSource(source: NewsSource): Promise<NewsItem[]> {
    try {
      switch (source.type) {
        case 'rss':
          return await this.fetchFromRSS(source);
        case 'api':
          return await this.fetchFromAPI(source);
        case 'scrape':
          return await this.fetchFromScraping(source);
        default:
          throw new Error(`不支持的新闻源类型: ${source.type}`);
      }
    } catch (error) {
      console.error(`从 ${source.name} 获取新闻失败:`, error);
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
    // 这里可以实现从数据库或缓存中获取特定新闻的逻辑
    // 目前返回null，实际实现中需要存储新闻数据
    return null;
  }

  async saveNews(newsItems: NewsItem[]): Promise<void> {
    // 这里可以实现保存新闻到数据库的逻辑
    console.log(`保存 ${newsItems.length} 条新闻`);
  }
} 