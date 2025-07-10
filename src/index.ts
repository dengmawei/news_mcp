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

class AINewsMCPServer {
  private server: Server;
  private newsService: NewsService;
  private newsAggregator: NewsAggregator;
  private newsAnalyzer: NewsAnalyzer;

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
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('AI新闻MCP服务已启动');
  }
}

// 启动服务
const server = new AINewsMCPServer();
server.run().catch(console.error); 