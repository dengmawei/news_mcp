import { NewsService } from './newsService.js';
import { DatabaseService } from './databaseService.js';
import { LoggerService } from './loggerService.js';
import { NewsItem, NewsSource } from './newsService.js';

export interface SyncOptions {
  force?: boolean; // 强制同步，忽略时间限制
  sources?: string[]; // 指定要同步的新闻源
  maxAge?: number; // 最大同步间隔（分钟）
}

export interface SyncResult {
  success: boolean;
  sourcesProcessed: number;
  newsAdded: number;
  errors: string[];
  duration: number;
}

export class DataSyncService {
  private newsService: NewsService;
  private databaseService: DatabaseService;
  private logger: LoggerService;
  private lastSyncTime: Map<string, number> = new Map();
  private readonly DEFAULT_MAX_AGE = 30; // 默认30分钟

  constructor() {
    this.newsService = new NewsService();
    this.databaseService = new DatabaseService();
    this.logger = new LoggerService();
  }

  async syncNews(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      sourcesProcessed: 0,
      newsAdded: 0,
      errors: [],
      duration: 0
    };

    try {
      this.logger.info('开始同步新闻数据', { options });

      // 获取所有新闻源
      const allSources = await this.newsService.getNewsSources();
      let sourcesToSync = allSources;

      // 如果指定了特定源，则只同步这些源
      if (options.sources && options.sources.length > 0) {
        sourcesToSync = allSources.filter(source => 
          options.sources!.includes(source.name)
        );
      }

      // 并行处理所有新闻源
      const syncPromises = sourcesToSync.map(source => 
        this.syncSource(source, options)
      );

      const syncResults = await Promise.allSettled(syncPromises);

      // 统计结果
      syncResults.forEach((promiseResult, index) => {
        const source = sourcesToSync[index];
        
        if (promiseResult.status === 'fulfilled') {
          const sourceResult = promiseResult.value;
          result.sourcesProcessed++;
          result.newsAdded += sourceResult.newsAdded;
          
          if (sourceResult.errors.length > 0) {
            result.errors.push(`${source.name}: ${sourceResult.errors.join(', ')}`);
          }
          
          this.logger.info('新闻源同步完成', {
            source: source.name,
            newsAdded: sourceResult.newsAdded,
            duration: sourceResult.duration
          });
        } else {
          result.errors.push(`${source.name}: ${promiseResult.reason.message}`);
          this.logger.error('新闻源同步失败', {
            source: source.name,
            error: promiseResult.reason.message
          });
        }
      });

      result.duration = Date.now() - startTime;
      
      this.logger.info('新闻同步完成', {
        sourcesProcessed: result.sourcesProcessed,
        newsAdded: result.newsAdded,
        errors: result.errors.length,
        duration: result.duration
      });

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`同步失败: ${error instanceof Error ? error.message : String(error)}`);
      result.duration = Date.now() - startTime;
      
      this.logger.error('新闻同步失败', { error: error instanceof Error ? error.message : String(error) });
      return result;
    }
  }

  private async syncSource(source: NewsSource, options: SyncOptions): Promise<{ newsAdded: number; errors: string[]; duration: number }> {
    const startTime = Date.now();
    const result = {
      newsAdded: 0,
      errors: [] as string[],
      duration: 0
    };

    try {
      // 检查是否需要同步
      if (!options.force && !this.shouldSyncSource(source, options.maxAge)) {
        this.logger.debug('跳过新闻源同步', { 
          source: source.name, 
          lastSync: this.lastSyncTime.get(source.id) 
        });
        return result;
      }

      // 获取新闻
      const newsItems = await this.newsService.fetchNewsFromSource(source);
      
      if (newsItems.length > 0) {
        // 保存到数据库
        await this.newsService.saveNews(newsItems);
        result.newsAdded = newsItems.length;
        
        // 更新同步时间
        this.lastSyncTime.set(source.id, Date.now());
        
        this.logger.info('新闻源同步成功', {
          source: source.name,
          newsCount: newsItems.length
        });
      } else {
        this.logger.debug('新闻源无新内容', { source: source.name });
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      this.logger.error('新闻源同步失败', {
        source: source.name,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  private shouldSyncSource(source: NewsSource, maxAge?: number): boolean {
    const lastSync = this.lastSyncTime.get(source.id);
    if (!lastSync) {
      return true; // 从未同步过
    }

    const age = Date.now() - lastSync;
    const maxAgeMs = (maxAge || this.DEFAULT_MAX_AGE) * 60 * 1000;
    
    return age >= maxAgeMs;
  }

  async getSyncStatus(): Promise<{
    lastSyncTimes: { [sourceId: string]: Date };
    totalSources: number;
    activeSources: number;
  }> {
    const sources = await this.newsService.getNewsSources();
    const activeSources = sources.filter(s => s.isActive);
    
    const lastSyncTimes: { [sourceId: string]: Date } = {};
    this.lastSyncTime.forEach((timestamp, sourceId) => {
      lastSyncTimes[sourceId] = new Date(timestamp);
    });

    return {
      lastSyncTimes,
      totalSources: sources.length,
      activeSources: activeSources.length
    };
  }

  async cleanupOldData(daysOld: number = 30): Promise<number> {
    try {
      const deletedCount = await this.databaseService.cleanupOldNews(daysOld);
      this.logger.info('清理旧数据完成', { daysOld, deletedCount });
      return deletedCount;
    } catch (error) {
      this.logger.error('清理旧数据失败', { daysOld, error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }

  async getDatabaseStats(): Promise<{
    totalNews: number;
    totalSources: number;
    newsByCategory: { category: string; count: number }[];
    newsBySource: { source: string; count: number }[];
  }> {
    try {
      const stats = await this.databaseService.getNewsStats();
      this.logger.info('获取数据库统计信息', stats);
      return stats;
    } catch (error) {
      this.logger.error('获取数据库统计信息失败', { error: error instanceof Error ? error.message : String(error) });
      return {
        totalNews: 0,
        totalSources: 0,
        newsByCategory: [],
        newsBySource: []
      };
    }
  }

  async startPeriodicSync(intervalMinutes: number = 30): Promise<void> {
    this.logger.info('启动定期同步', { intervalMinutes });
    
    const sync = async () => {
      try {
        await this.syncNews();
      } catch (error) {
        this.logger.error('定期同步失败', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    // 立即执行一次同步
    await sync();

    // 设置定期同步
    setInterval(sync, intervalMinutes * 60 * 1000);
  }

  async disconnect(): Promise<void> {
    try {
      await this.databaseService.disconnect();
      this.logger.info('数据同步服务已断开连接');
    } catch (error) {
      this.logger.error('断开数据同步服务连接失败', { error: error instanceof Error ? error.message : String(error) });
    }
  }
} 