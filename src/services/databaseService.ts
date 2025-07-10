import { PrismaClient } from '@prisma/client';
import { NewsItem, NewsSource } from './newsService.js';
import { NewsSummary } from './newsAnalyzer.js';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // 新闻源管理
  async createNewsSource(source: Omit<NewsSource, 'id' | 'isActive' | 'lastUpdate'>): Promise<NewsSource> {
    const dbSource = await this.prisma.newsSource.create({
      data: {
        name: source.name,
        url: source.url,
        type: source.type,
        category: source.category,
        language: source.language
      }
    });

    return this.mapDbSourceToNewsSource(dbSource);
  }

  async getNewsSources(): Promise<NewsSource[]> {
    const dbSources = await this.prisma.newsSource.findMany({
      where: { isActive: true }
    });

    return dbSources.map(this.mapDbSourceToNewsSource);
  }

  async updateNewsSourceStatus(id: string, isActive: boolean): Promise<void> {
    await this.prisma.newsSource.update({
      where: { id },
      data: { 
        isActive,
        lastUpdate: new Date()
      }
    });
  }

  // 新闻管理
  async saveNews(newsItems: NewsItem[]): Promise<void> {
    for (const news of newsItems) {
      try {
        // 查找或创建新闻源
        let source = await this.prisma.newsSource.findFirst({
          where: { name: news.source }
        });

        if (!source) {
          source = await this.prisma.newsSource.create({
            data: {
              name: news.source,
              url: '', // 需要从配置中获取
              type: 'rss',
              category: news.category,
              language: 'en'
            }
          });
        }

        // 检查新闻是否已存在
        const existingNews = await this.prisma.newsItem.findUnique({
          where: { url: news.url }
        });

        if (!existingNews) {
          await this.prisma.newsItem.create({
            data: {
              title: news.title,
              description: news.description,
              content: news.content,
              url: news.url,
              sourceId: source.id,
              publishedAt: news.publishedAt,
              category: news.category,
              tags: JSON.stringify(news.tags), // 转换为JSON字符串
              imageUrl: news.imageUrl,
              author: news.author
            }
          });
        }
      } catch (error) {
        console.error(`保存新闻失败: ${news.title}`, error);
      }
    }
  }

  async getNewsById(id: string): Promise<NewsItem | null> {
    const dbNews = await this.prisma.newsItem.findUnique({
      where: { id },
      include: { source: true }
    });

    if (!dbNews) return null;

    return this.mapDbNewsToNewsItem(dbNews);
  }

  async getLatestNews(limit: number = 10, category?: string): Promise<NewsItem[]> {
    const where = category ? { category } : {};
    
    const dbNews = await this.prisma.newsItem.findMany({
      where,
      include: { source: true },
      orderBy: { publishedAt: 'desc' },
      take: limit
    });

    return dbNews.map(this.mapDbNewsToNewsItem);
  }

  async searchNews(query: string, limit: number = 10): Promise<NewsItem[]> {
    const dbNews = await this.prisma.newsItem.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { tags: { contains: query } } // SQLite使用contains而不是has
        ]
      },
      include: { source: true },
      orderBy: { publishedAt: 'desc' },
      take: limit
    });

    return dbNews.map(this.mapDbNewsToNewsItem);
  }

  async getNewsByCategory(category: string, limit: number = 10): Promise<NewsItem[]> {
    return this.getLatestNews(limit, category);
  }

  async getNewsBySource(sourceName: string, limit: number = 10): Promise<NewsItem[]> {
    const dbNews = await this.prisma.newsItem.findMany({
      where: {
        source: {
          name: sourceName
        }
      },
      include: { source: true },
      orderBy: { publishedAt: 'desc' },
      take: limit
    });

    return dbNews.map(this.mapDbNewsToNewsItem);
  }

  // 新闻摘要管理
  async saveNewsSummary(newsId: string, summary: Omit<NewsSummary, 'id' | 'newsId' | 'source' | 'publishedAt'>): Promise<void> {
    await this.prisma.newsSummary.upsert({
      where: { newsId },
      update: {
        summary: summary.summary,
        keyPoints: JSON.stringify(summary.keyPoints), // 转换为JSON字符串
        sentiment: summary.sentiment,
        impact: summary.impact,
        relatedTopics: JSON.stringify(summary.relatedTopics) // 转换为JSON字符串
      },
      create: {
        newsId,
        summary: summary.summary,
        keyPoints: JSON.stringify(summary.keyPoints),
        sentiment: summary.sentiment,
        impact: summary.impact,
        relatedTopics: JSON.stringify(summary.relatedTopics)
      }
    });
  }

  async getNewsSummary(newsId: string): Promise<NewsSummary | null> {
    const dbSummary = await this.prisma.newsSummary.findUnique({
      where: { newsId },
      include: { news: { include: { source: true } } }
    });

    if (!dbSummary) return null;

    return {
      id: dbSummary.id,
      title: dbSummary.news.title,
      summary: dbSummary.summary,
      keyPoints: JSON.parse(dbSummary.keyPoints), // 解析JSON字符串
      sentiment: dbSummary.sentiment as 'positive' | 'negative' | 'neutral',
      impact: dbSummary.impact as 'high' | 'medium' | 'low',
      relatedTopics: JSON.parse(dbSummary.relatedTopics), // 解析JSON字符串
      source: dbSummary.news.source.name,
      publishedAt: dbSummary.news.publishedAt
    };
  }

  // 统计信息
  async getNewsStats(): Promise<{
    totalNews: number;
    totalSources: number;
    newsByCategory: { category: string; count: number }[];
    newsBySource: { source: string; count: number }[];
  }> {
    const [totalNews, totalSources, newsByCategory, newsBySource] = await Promise.all([
      this.prisma.newsItem.count(),
      this.prisma.newsSource.count({ where: { isActive: true } }),
      this.prisma.newsItem.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      this.prisma.newsItem.groupBy({
        by: ['sourceId'],
        _count: { sourceId: true }
      }).then(async (grouped: any[]) => {
        const sourceIds = grouped.map((g: any) => g.sourceId);
        const sources = await this.prisma.newsSource.findMany({
          where: { id: { in: sourceIds } }
        });
        return grouped.map((g: any) => ({
          ...g,
          source: sources.find((s: any) => s.id === g.sourceId)
        }));
      })
    ]);

    return {
      totalNews,
      totalSources,
      newsByCategory: newsByCategory.map((item: any) => ({
        category: item.category,
        count: item._count.category
      })),
      newsBySource: newsBySource.map((item: any) => ({
        source: item.source.name,
        count: item._count.sourceId
      }))
    };
  }

  // 数据清理
  async cleanupOldNews(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.newsItem.deleteMany({
      where: {
        publishedAt: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }

  // 映射函数
  private mapDbSourceToNewsSource(dbSource: any): NewsSource {
    return {
      id: dbSource.id,
      name: dbSource.name,
      url: dbSource.url,
      type: dbSource.type as 'rss' | 'api' | 'scrape',
      category: dbSource.category,
      language: dbSource.language,
      isActive: dbSource.isActive,
      lastUpdate: dbSource.lastUpdate
    };
  }

  private mapDbNewsToNewsItem(dbNews: any): NewsItem {
    return {
      id: dbNews.id,
      title: dbNews.title,
      description: dbNews.description,
      content: dbNews.content,
      url: dbNews.url,
      source: dbNews.source.name,
      publishedAt: dbNews.publishedAt,
      category: dbNews.category,
      tags: JSON.parse(dbNews.tags), // 解析JSON字符串
      imageUrl: dbNews.imageUrl,
      author: dbNews.author
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
} 