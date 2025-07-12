import express from 'express';
import { NewsService } from './services/newsService.js';
import { NewsAggregator } from './services/newsAggregator.js';
import { NewsAnalyzer } from './services/newsAnalyzer.js';
import { DataSyncService } from './services/dataSyncService.js';
import { LoggerService } from './services/loggerService.js';

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 服务实例
const newsService = new NewsService();
const newsAggregator = new NewsAggregator();
const newsAnalyzer = new NewsAnalyzer();
const dataSyncService = new DataSyncService();
const logger = new LoggerService();

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ai-news-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 获取最新AI新闻
app.get('/api/news/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    
    const news = await newsAggregator.getLatestNews(limit, category);
    res.json({ success: true, data: news });
  } catch (error) {
    logger.error('获取最新新闻失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 搜索AI新闻
app.get('/api/news/search', async (req, res) => {
  try {
    const query = req.query.query as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const dateRange = (req.query.dateRange as string) || 'week';
    
    if (!query) {
      return res.status(400).json({ success: false, error: '查询参数是必需的' });
    }
    
    const results = await newsAggregator.searchNews(query, limit, dateRange as 'today' | 'week' | 'month');
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('搜索新闻失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 获取新闻摘要
app.get('/api/news/:newsId/summary', async (req, res) => {
  try {
    const { newsId } = req.params;
    const includeKeyPoints = req.query.includeKeyPoints !== 'false';
    
    const summary = await newsAnalyzer.getNewsSummary(newsId, includeKeyPoints);
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('获取新闻摘要失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 获取AI趋势分析
app.get('/api/trends', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'month';
    const includeStats = req.query.includeStats !== 'false';
    
    const trends = await newsAnalyzer.getAITrends(timeframe as 'week' | 'month' | 'quarter', includeStats);
    res.json({ success: true, data: trends });
  } catch (error) {
    logger.error('获取趋势分析失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 获取新闻源列表
app.get('/api/sources', async (req, res) => {
  try {
    const includeStatus = req.query.includeStatus === 'true';
    
    const sources = await newsService.getNewsSources(includeStatus);
    res.json({ success: true, data: sources });
  } catch (error) {
    logger.error('获取新闻源失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 同步新闻数据
app.post('/api/sync', async (req, res) => {
  try {
    const { force = false, sources, maxAge = 30 } = req.body;
    
    const result = await dataSyncService.syncNews({ force, sources, maxAge });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('同步新闻数据失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 获取同步状态
app.get('/api/sync/status', async (req, res) => {
  try {
    const status = await dataSyncService.getSyncStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('获取同步状态失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 获取数据库统计
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await dataSyncService.getDatabaseStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('获取数据库统计失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 清理旧数据
app.delete('/api/cleanup', async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    
    const deletedCount = await dataSyncService.cleanupOldData(daysOld);
    res.json({ success: true, data: { deletedCount, daysOld } });
  } catch (error) {
    logger.error('清理旧数据失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// MCP工具调用接口
app.post('/api/mcp/tools', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: '工具名称是必需的' });
    }
    
    let result;
    switch (name) {
      case 'get_latest_ai_news':
        const { limit = 10, category } = args || {};
        result = await newsAggregator.getLatestNews(limit, category);
        break;
      case 'search_ai_news':
        const { query, limit: searchLimit = 10, dateRange = 'week' } = args || {};
        if (!query) {
          return res.status(400).json({ success: false, error: '查询参数是必需的' });
        }
        result = await newsAggregator.searchNews(query, searchLimit, dateRange);
        break;
      case 'get_news_summary':
        const { newsId, includeKeyPoints = true } = args || {};
        if (!newsId) {
          return res.status(400).json({ success: false, error: '新闻ID是必需的' });
        }
        result = await newsAnalyzer.getNewsSummary(newsId, includeKeyPoints);
        break;
      case 'get_ai_trends':
        const { timeframe = 'month', includeStats = true } = args || {};
        result = await newsAnalyzer.getAITrends(timeframe, includeStats);
        break;
      case 'get_news_sources':
        const { includeStatus = false } = args || {};
        result = await newsService.getNewsSources(includeStatus);
        break;
      case 'sync_news_data':
        const { force = false, sources, maxAge = 30 } = args || {};
        result = await dataSyncService.syncNews({ force, sources, maxAge });
        break;
      case 'get_sync_status':
        result = await dataSyncService.getSyncStatus();
        break;
      case 'get_database_stats':
        result = await dataSyncService.getDatabaseStats();
        break;
      case 'cleanup_old_data':
        const { daysOld = 30 } = args || {};
        const deletedCount = await dataSyncService.cleanupOldData(daysOld);
        result = { deletedCount, daysOld };
        break;
      default:
        return res.status(400).json({ success: false, error: `未知的工具: ${name}` });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('MCP工具调用失败', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// 获取可用工具列表
app.get('/api/mcp/tools', (req, res) => {
  const tools = [
    {
      name: 'get_latest_ai_news',
      description: '获取最新的AI应用相关新闻',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '返回的新闻数量，默认10条', default: 10 },
          category: { type: 'string', description: '新闻分类', enum: ['general', 'research', 'products', 'business'] }
        }
      }
    },
    {
      name: 'search_ai_news',
      description: '搜索特定主题的AI新闻',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          limit: { type: 'number', description: '返回的新闻数量，默认10条', default: 10 },
          dateRange: { type: 'string', description: '日期范围', enum: ['today', 'week', 'month'], default: 'week' }
        },
        required: ['query']
      }
    },
    {
      name: 'get_news_summary',
      description: '获取新闻摘要和关键信息',
      inputSchema: {
        type: 'object',
        properties: {
          newsId: { type: 'string', description: '新闻ID' },
          includeKeyPoints: { type: 'boolean', description: '是否包含关键要点', default: true }
        },
        required: ['newsId']
      }
    },
    {
      name: 'get_ai_trends',
      description: '获取AI领域趋势分析',
      inputSchema: {
        type: 'object',
        properties: {
          timeframe: { type: 'string', description: '时间范围', enum: ['week', 'month', 'quarter'], default: 'month' },
          includeStats: { type: 'boolean', description: '是否包含统计数据', default: true }
        }
      }
    },
    {
      name: 'get_news_sources',
      description: '获取支持的新闻源列表',
      inputSchema: {
        type: 'object',
        properties: {
          includeStatus: { type: 'boolean', description: '是否包含源状态信息', default: false }
        }
      }
    },
    {
      name: 'sync_news_data',
      description: '同步新闻数据到数据库',
      inputSchema: {
        type: 'object',
        properties: {
          force: { type: 'boolean', description: '强制同步，忽略时间限制', default: false },
          sources: { type: 'array', items: { type: 'string' }, description: '指定要同步的新闻源名称列表' },
          maxAge: { type: 'number', description: '最大同步间隔（分钟）', default: 30 }
        }
      }
    },
    {
      name: 'get_sync_status',
      description: '获取数据同步状态',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'get_database_stats',
      description: '获取数据库统计信息',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'cleanup_old_data',
      description: '清理旧数据',
      inputSchema: {
        type: 'object',
        properties: {
          daysOld: { type: 'number', description: '删除多少天前的数据', default: 30 }
        }
      }
    }
  ];
  
  res.json({ success: true, data: tools });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('未处理的错误', { error: err.message, stack: err.stack });
  res.status(500).json({ 
    success: false, 
    error: '内部服务器错误' 
  });
});

// 404处理 - 修复路由模式
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: '接口不存在',
    availableEndpoints: [
      'GET /health',
      'GET /api/news/latest',
      'GET /api/news/search',
      'GET /api/news/:newsId/summary',
      'GET /api/trends',
      'GET /api/sources',
      'POST /api/sync',
      'GET /api/sync/status',
      'GET /api/stats',
      'DELETE /api/cleanup',
      'GET /api/mcp/tools',
      'POST /api/mcp/tools'
    ]
  });
});

export default app; 