import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { NewsService } from './services/newsService.js';
import { NewsAggregator } from './services/newsAggregator.js';
import { NewsAnalyzer } from './services/newsAnalyzer.js';
import { DataSyncService } from './services/dataSyncService.js';
import { LoggerService } from './services/loggerService.js';

class AINewsMCPServer {
  private server: Server;
  private newsService: NewsService;
  private newsAggregator: NewsAggregator;
  private newsAnalyzer: NewsAnalyzer;
  private dataSyncService: DataSyncService;
  private logger: LoggerService;

  constructor() {
    this.server = new Server(
      {
        name: 'ai-news-mcp',
        version: '1.0.0',
        capabilities: {
          tools: {},
        },
      }
    );

    this.newsService = new NewsService();
    this.newsAggregator = new NewsAggregator();
    this.newsAnalyzer = new NewsAnalyzer();
    this.dataSyncService = new DataSyncService();
    this.logger = new LoggerService();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 获取最新AI新闻
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_latest_ai_news',
            description: '获取最新的AI应用相关新闻',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: '返回的新闻数量，默认10条',
                  default: 10,
                },
                category: {
                  type: 'string',
                  description: '新闻分类（可选）：general, research, products, business',
                  enum: ['general', 'research', 'products', 'business'],
                },
              },
            },
          },
          {
            name: 'search_ai_news',
            description: '搜索特定主题的AI新闻',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索关键词',
                },
                limit: {
                  type: 'number',
                  description: '返回的新闻数量，默认10条',
                  default: 10,
                },
                dateRange: {
                  type: 'string',
                  description: '日期范围：today, week, month',
                  enum: ['today', 'week', 'month'],
                  default: 'week',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_news_summary',
            description: '获取新闻摘要和关键信息',
            inputSchema: {
              type: 'object',
              properties: {
                newsId: {
                  type: 'string',
                  description: '新闻ID',
                },
                includeKeyPoints: {
                  type: 'boolean',
                  description: '是否包含关键要点',
                  default: true,
                },
              },
              required: ['newsId'],
            },
          },
          {
            name: 'get_ai_trends',
            description: '获取AI领域趋势分析',
            inputSchema: {
              type: 'object',
              properties: {
                timeframe: {
                  type: 'string',
                  description: '时间范围：week, month, quarter',
                  enum: ['week', 'month', 'quarter'],
                  default: 'month',
                },
                includeStats: {
                  type: 'boolean',
                  description: '是否包含统计数据',
                  default: true,
                },
              },
            },
          },
          {
            name: 'get_news_sources',
            description: '获取支持的新闻源列表',
            inputSchema: {
              type: 'object',
              properties: {
                includeStatus: {
                  type: 'boolean',
                  description: '是否包含源状态信息',
                  default: false,
                },
              },
            },
          },
          {
            name: 'sync_news_data',
            description: '同步新闻数据到数据库',
            inputSchema: {
              type: 'object',
              properties: {
                force: {
                  type: 'boolean',
                  description: '强制同步，忽略时间限制',
                  default: false,
                },
                sources: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '指定要同步的新闻源名称列表',
                },
                maxAge: {
                  type: 'number',
                  description: '最大同步间隔（分钟）',
                  default: 30,
                },
              },
            },
          },
          {
            name: 'get_sync_status',
            description: '获取数据同步状态',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_database_stats',
            description: '获取数据库统计信息',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'cleanup_old_data',
            description: '清理旧数据',
            inputSchema: {
              type: 'object',
              properties: {
                daysOld: {
                  type: 'number',
                  description: '删除多少天前的数据',
                  default: 30,
                },
              },
            },
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_latest_ai_news':
            return await this.handleGetLatestNews(args);
          case 'search_ai_news':
            return await this.handleSearchNews(args);
          case 'get_news_summary':
            return await this.handleGetNewsSummary(args);
          case 'get_ai_trends':
            return await this.handleGetAITrends(args);
          case 'get_news_sources':
            return await this.handleGetNewsSources(args);
          case 'sync_news_data':
            return await this.handleSyncNewsData(args);
          case 'get_sync_status':
            return await this.handleGetSyncStatus(args);
          case 'get_database_stats':
            return await this.handleGetDatabaseStats(args);
          case 'cleanup_old_data':
            return await this.handleCleanupOldData(args);
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        this.logger.error('工具调用失败', { tool: name, error: error.message });
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
            },
          ],
        };
      }
    });
  }

  private async handleGetLatestNews(args: any) {
    const { limit = 10, category } = args;
    const news = await this.newsAggregator.getLatestNews(limit, category);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(news, null, 2),
        },
      ],
    };
  }

  private async handleSearchNews(args: any) {
    const { query, limit = 10, dateRange = 'week' } = args;
    const results = await this.newsAggregator.searchNews(query, limit, dateRange);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async handleGetNewsSummary(args: any) {
    const { newsId, includeKeyPoints = true } = args;
    const summary = await this.newsAnalyzer.getNewsSummary(newsId, includeKeyPoints);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private async handleGetAITrends(args: any) {
    const { timeframe = 'month', includeStats = true } = args;
    const trends = await this.newsAnalyzer.getAITrends(timeframe, includeStats);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(trends, null, 2),
        },
      ],
    };
  }

  private async handleGetNewsSources(args: any) {
    const { includeStatus = false } = args;
    const sources = await this.newsService.getNewsSources(includeStatus);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sources, null, 2),
        },
      ],
    };
  }

  private async handleSyncNewsData(args: any) {
    const { force = false, sources, maxAge = 30 } = args;
    const result = await this.dataSyncService.syncNews({ force, sources, maxAge });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetSyncStatus(args: any) {
    const status = await this.dataSyncService.getSyncStatus();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  private async handleGetDatabaseStats(args: any) {
    const stats = await this.dataSyncService.getDatabaseStats();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  private async handleCleanupOldData(args: any) {
    const { daysOld = 30 } = args;
    const deletedCount = await this.dataSyncService.cleanupOldData(daysOld);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ deletedCount, daysOld }, null, 2),
        },
      ],
    };
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('AI新闻MCP服务已启动');
      
      // 启动定期数据同步（每30分钟）
      await this.dataSyncService.startPeriodicSync(30);
      
      this.logger.info('定期数据同步已启动');
    } catch (error) {
      this.logger.error('服务启动失败', { error: error.message });
      throw error;
    }
  }

  async shutdown() {
    try {
      await this.dataSyncService.disconnect();
      await this.newsService.disconnect();
      await this.newsAggregator.disconnect();
      await this.newsAnalyzer.disconnect();
      
      this.logger.info('AI新闻MCP服务已关闭');
    } catch (error) {
      this.logger.error('服务关闭失败', { error: error.message });
    }
  }
}

// 启动服务
const server = new AINewsMCPServer();

// 处理进程退出
process.on('SIGINT', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.shutdown();
  process.exit(0);
});

server.run().catch(console.error); 