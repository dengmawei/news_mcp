# AI 新闻 MCP 服务使用指南

## 什么是 MCP？

MCP (Model Context Protocol) 是一个标准协议，允许 AI 助手通过工具调用与外部服务交互。这个 AI 新闻 MCP 服务提供了获取和搜索 AI 相关新闻的功能。

## 快速开始

### 1. 准备工作

确保您已经：
- 安装了项目依赖：`npm install`
- 构建了项目：`npm run build`
- 初始化了数据库：`npm run db:init`

### 2. 运行简单测试

```bash
# 设置环境变量
$env:DATABASE_URL="file:./dev.db"

# 运行简单测试
node examples/simple-mcp-test.js
```

### 3. 运行完整演示

```bash
# 运行完整功能演示
node examples/mcp-client-example.js
```

## 可用的工具

### 1. `get_latest_ai_news` - 获取最新 AI 新闻

**参数：**
- `limit` (可选): 返回的新闻数量，默认 10
- `category` (可选): 新闻分类，可选值：general, research, products, business

**示例：**
```javascript
const result = await client.callTool({
  name: 'get_latest_ai_news',
  arguments: { 
    limit: 5,
    category: 'research'
  }
});
```

### 2. `search_ai_news` - 搜索特定主题的 AI 新闻

**参数：**
- `query` (必需): 搜索关键词
- `limit` (可选): 返回的新闻数量，默认 10
- `dateRange` (可选): 日期范围，可选值：today, week, month，默认 week

**示例：**
```javascript
const result = await client.callTool({
  name: 'search_ai_news',
  arguments: { 
    query: 'ChatGPT',
    limit: 5,
    dateRange: 'week'
  }
});
```

### 3. `get_news_summary` - 获取新闻摘要

**参数：**
- `newsId` (必需): 新闻 ID
- `includeKeyPoints` (可选): 是否包含关键要点，默认 true

**示例：**
```javascript
const result = await client.callTool({
  name: 'get_news_summary',
  arguments: { 
    newsId: 'news-123',
    includeKeyPoints: true
  }
});
```

### 4. `get_ai_trends` - 获取 AI 趋势分析

**参数：**
- `timeframe` (可选): 时间范围，可选值：week, month, quarter，默认 month
- `includeStats` (可选): 是否包含统计数据，默认 true

**示例：**
```javascript
const result = await client.callTool({
  name: 'get_ai_trends',
  arguments: { 
    timeframe: 'month',
    includeStats: true
  }
});
```

### 5. `get_news_sources` - 获取新闻源列表

**参数：**
- `includeStatus` (可选): 是否包含源状态信息，默认 false

**示例：**
```javascript
const result = await client.callTool({
  name: 'get_news_sources',
  arguments: { 
    includeStatus: true
  }
});
```

## 基本使用模式

### 1. 创建 MCP 客户端

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({
  name: 'my-ai-news-client',
  version: '1.0.0'
});
```

### 2. 连接到 MCP 服务器

```javascript
const transport = new StdioClientTransport({
  command: 'node',
  args: ['path/to/your/project/dist/index.js'],
  env: { 
    DATABASE_URL: 'file:./dev.db'
  }
});

await client.connect(transport);
```

### 3. 调用工具

```javascript
// 获取工具列表
const tools = await client.listTools();

// 调用特定工具
const result = await client.callTool({
  name: 'get_latest_ai_news',
  arguments: { limit: 5 }
});

// 解析结果
const news = JSON.parse(result.content[0].text);
```

### 4. 关闭连接

```javascript
await client.close();
```

## 错误处理

```javascript
try {
  const result = await client.callTool({
    name: 'get_latest_ai_news',
    arguments: { limit: 5 }
  });
  
  const news = JSON.parse(result.content[0].text);
  console.log('获取新闻成功:', news);
} catch (error) {
  console.error('调用失败:', error.message);
  
  // 根据错误类型进行处理
  if (error.message.includes('工具不存在')) {
    console.log('请检查工具名称是否正确');
  } else if (error.message.includes('参数错误')) {
    console.log('请检查参数格式是否正确');
  }
}
```

## 集成到其他应用

### 在 Node.js 应用中使用

```javascript
import { MCPClientExample } from './examples/mcp-client-example.js';

const client = new MCPClientExample();
await client.connect();

// 获取最新新闻
const news = await client.getLatestNews(10);

// 搜索特定主题
const searchResults = await client.searchNews('AI', 5);

await client.disconnect();
```

### 在 Web 应用中使用

```javascript
// 通过 WebSocket 或其他方式连接到 MCP 服务
// 然后使用相同的工具调用模式
```

## 常见问题

### Q: 如何添加新的新闻源？
A: 修改 `scripts/init-db.js` 文件中的 `defaultSources` 数组，然后重新运行 `npm run db:init`。

### Q: 如何修改新闻分类？
A: 在调用 `get_latest_ai_news` 时使用 `category` 参数，或在数据库中添加新的分类。

### Q: 如何自定义新闻摘要生成？
A: 修改 `src/services/newsAnalyzer.ts` 中的摘要生成逻辑，或集成 OpenAI API 进行智能摘要。

### Q: 如何提高性能？
A: 配置 Redis 缓存，或调整数据库查询优化。

## 扩展开发

### 添加新工具

1. 在 `src/index.ts` 的 `setupToolHandlers` 方法中添加新工具定义
2. 在 `CallToolRequestSchema` 处理中添加新的 case
3. 实现对应的处理方法

### 自定义数据处理

1. 修改 `src/services/` 目录下的相应服务
2. 更新数据库模型（如需要）
3. 重新构建和部署

## 支持

如果遇到问题，请检查：
1. 环境变量是否正确设置
2. 数据库是否已初始化
3. 项目是否已正确构建
4. 网络连接是否正常

更多信息请参考项目 README.md 文件。 