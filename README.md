# AI新闻MCP服务

一个基于Model Context Protocol (MCP)的智能AI新闻聚合服务，专注于收集、分析和提供最新的AI应用相关新闻。

## 📋 目录

- [功能特性](#功能特性)
- [技术架构](#技术架构)
- [支持的新闻源](#支持的新闻源)
- [安装部署](#安装部署)
- [使用指南](#使用指南)
- [AI服务配置](#ai服务配置)
- [部署指南](#部署指南)
- [开发指南](#开发指南)
- [故障排除](#故障排除)
- [许可证](#许可证)

## 🚀 功能特性

### 核心功能
- 🔍 **实时新闻抓取** - 支持RSS订阅和网页爬取
- 📰 **多源聚合** - 整合多个AI新闻源
- 🎯 **智能分类** - 自动分类和标签
- 📊 **AI摘要生成** - 智能新闻摘要和关键信息提取
- 🔄 **定时同步** - 自动更新新闻内容
- 💾 **数据持久化** - SQLite数据库存储
- 🚀 **Redis缓存** - 高性能缓存支持
- 🤖 **多AI服务** - 支持DeepSeek和OpenAI

### MCP工具
- `get_latest_ai_news` - 获取最新AI新闻
- `search_ai_news` - 搜索特定主题新闻
- `get_news_summary` - 获取新闻摘要
- `get_ai_trends` - 获取AI趋势分析
- `get_news_sources` - 获取新闻源列表
- `sync_news_data` - 同步新闻数据
- `get_sync_status` - 获取同步状态
- `get_database_stats` - 获取数据库统计

## 🏗️ 技术架构

### 技术栈
- **后端**: Node.js + TypeScript
- **数据库**: SQLite (轻量级，无需安装数据库服务器)
- **ORM**: Prisma
- **缓存**: Redis (可选)
- **协议**: Model Context Protocol (MCP)
- **AI服务**: DeepSeek API / OpenAI API
- **测试**: Jest
- **部署**: Vercel / Docker

### 项目结构
```
news_mcp/
├── src/
│   ├── services/          # 核心服务
│   │   ├── newsService.ts      # 新闻服务
│   │   ├── newsAggregator.ts   # 新闻聚合
│   │   ├── newsAnalyzer.ts     # 新闻分析
│   │   ├── aiService.ts        # AI服务
│   │   ├── databaseService.ts  # 数据库服务
│   │   ├── cacheService.ts     # 缓存服务
│   │   └── loggerService.ts    # 日志服务
│   └── index.ts           # MCP服务入口
├── prisma/               # 数据库配置
├── examples/             # 使用示例
├── scripts/              # 工具脚本
├── tests/                # 测试文件
└── docs/                 # 文档
```

## 📰 支持的新闻源

### 主要新闻源
- **TechCrunch AI** - AI技术和创业新闻
- **VentureBeat AI** - AI商业和投资新闻
- **MIT Technology Review** - 技术趋势和AI研究
- **AI News** - 综合AI新闻
- **Ars Technica** - 技术深度分析
- **The Verge** - 科技新闻和评论

### 新闻分类
- **general** - 综合AI新闻
- **research** - AI研究和技术
- **products** - AI产品发布
- **business** - AI商业和投资

## 🛠️ 安装部署

### 1. 环境要求
- Node.js 18+ 
- npm 或 yarn
- Git

### 2. 克隆项目
```bash
git clone <repository-url>
cd news_mcp
```

### 3. 安装依赖
```bash
npm install
```

### 4. 环境配置
```bash
# 复制环境变量模板
cp env.example .env

# 编辑.env文件，配置必要的API密钥
```

#### 必需的环境变量
```env
# 数据库配置
DATABASE_URL="file:./dev.db"

# AI服务配置（至少配置一个）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# 服务配置
NODE_ENV=development
PORT=3000
```

#### 可选的环境变量
```env
# 新闻API配置
NEWS_API_KEY=your_news_api_key_here
GNEWS_API_KEY=your_gnews_api_key_here

# Redis缓存配置
REDIS_URL=redis://localhost:6379

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log

# 缓存配置
CACHE_DURATION=300000
MAX_CACHE_SIZE=1000

# 同步配置
SYNC_INTERVAL=30
```

### 5. 初始化数据库
```bash
# 生成Prisma客户端
npm run db:generate

# 创建数据库表
npm run db:push

# 初始化默认新闻源
npm run db:init
```

### 6. 构建项目
```bash
npm run build
```

### 7. 运行服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 8. 验证安装
```bash
# 运行测试
npm test

# 测试MCP服务
npm run mcp:test

# 运行完整演示
npm run mcp:demo
```

## 📖 使用指南

### MCP客户端示例

#### 1. 基本使用
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// 创建客户端
const client = new Client({
  name: 'ai-news-client',
  version: '1.0.0'
});

// 连接传输
const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
  env: { DATABASE_URL: 'file:./dev.db' }
});

await client.connect(transport);
```

#### 2. 获取最新新闻
```javascript
const result = await client.callTool({
  name: 'get_latest_ai_news',
  arguments: { 
    limit: 5,
    category: 'research'
  }
});

const news = JSON.parse(result.content[0].text);
console.log('最新AI新闻:', news);
```

#### 3. 搜索特定主题
```javascript
const result = await client.callTool({
  name: 'search_ai_news',
  arguments: { 
    query: 'ChatGPT',
    limit: 10,
    dateRange: 'week'
  }
});
```

#### 4. 获取新闻摘要
```javascript
const result = await client.callTool({
  name: 'get_news_summary',
  arguments: { 
    newsId: 'news-123',
    includeKeyPoints: true
  }
});
```

#### 5. 获取趋势分析
```javascript
const result = await client.callTool({
  name: 'get_ai_trends',
  arguments: { 
    timeframe: 'month',
    includeStats: true
  }
});
```

### 运行示例
```bash
# 简单测试
node examples/simple-mcp-test.js

# 完整演示
node examples/mcp-client-example.js
```

## 🤖 AI服务配置

### 支持的AI服务

#### 1. DeepSeek API (推荐)
- **模型**: `deepseek-chat`
- **API端点**: `https://api.deepseek.com/v1`
- **功能**: 新闻摘要、情感分析、趋势分析

#### 2. OpenAI API (备选)
- **模型**: `gpt-3.5-turbo`
- **API端点**: `https://api.openai.com/v1`
- **功能**: 新闻摘要、情感分析、趋势分析

### 配置优先级
1. **DeepSeek API** (配置 `DEEPSEEK_API_KEY`)
2. **OpenAI API** (配置 `OPENAI_API_KEY`)
3. **规则基础分析** (无AI服务时自动降级)

### 获取API密钥

#### DeepSeek API
1. 访问 [DeepSeek平台](https://platform.deepseek.com/)
2. 注册或登录账户
3. 进入API Keys页面
4. 创建新的API密钥
5. 复制密钥到 `.env` 文件

#### OpenAI API
1. 访问 [OpenAI平台](https://platform.openai.com/)
2. 注册或登录账户
3. 进入API Keys页面
4. 创建新的API密钥
5. 复制密钥到 `.env` 文件

### 测试AI服务
```bash
# 测试AI服务功能
npm run test:ai

# 测试DeepSeek API
npm run test:deepseek

# 测试OpenAI API
npm run test:openai
```

### 降级机制
当AI API不可用时，系统会自动降级到规则基础分析：
- 基于关键词的情感分析
- 简单的摘要提取
- 预定义的关键点识别
- 基于词汇的影响度评估

## 🚀 部署指南

### Vercel部署 (推荐)

#### 1. 准备部署
```bash
# 验证部署配置
npm run check:deploy

# 构建项目
npm run build
```

#### 2. 部署到Vercel
```bash
# 使用Vercel CLI
npm i -g vercel
vercel login
vercel --prod
```

#### 3. 配置环境变量
在Vercel项目设置中添加：
```env
DATABASE_URL="file:./dev.db"
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=3000
```

### Docker部署

#### 1. 使用Docker Compose
```bash
# 启动完整服务（包含Redis）
docker-compose up -d

# 仅启动主服务（使用SQLite）
docker-compose up ai-news-mcp
```

#### 2. 使用Dockerfile
```bash
# 构建镜像
docker build -t ai-news-mcp .

# 运行容器
docker run -p 3000:3000 --env-file .env ai-news-mcp
```

### 本地部署
```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:push
npm run db:init

# 启动服务
npm start
```

## 🧪 开发指南

### 开发环境
```bash
# 启动开发模式
npm run dev

# 监听文件变化
npm run watch
```

### 测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm run test:ai
npm run test:persistence
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

### 数据库管理
```bash
# 查看数据库
npm run db:studio

# 创建迁移
npm run db:migrate

# 推送数据库变更
npm run db:push

# 重置数据库
npm run db:reset
```

### 数据同步
```bash
# 强制同步所有新闻源
npm run db:sync

# 查看数据库统计
npm run db:stats

# 清理旧数据（30天前）
npm run db:cleanup
```

### 代码质量
```bash
# 代码检查
npm run lint

# 类型检查
npm run type-check

# 格式化代码
npm run format
```

## 🔧 故障排除

### 常见问题

#### 1. TypeScript编译错误
**问题**: "Enable error reporting in type-checked JavaScript files"
**解决方案**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "allowJs": false,
    "checkJs": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.js"]
}
```

#### 2. 数据库连接错误
**问题**: 数据库文件不存在或权限错误
**解决方案**:
```bash
# 重新初始化数据库
npm run db:generate
npm run db:push
npm run db:init
```

#### 3. AI服务不可用
**问题**: API密钥无效或网络错误
**解决方案**:
- 检查API密钥是否正确配置
- 验证网络连接
- 查看错误日志: `tail -f logs/app.log`

#### 4. 新闻同步失败
**问题**: 新闻源不可访问或格式变化
**解决方案**:
```bash
# 检查同步状态
npm run db:stats

# 强制重新同步
npm run db:sync
```

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log

# 查看AI服务日志
tail -f logs/app.log | grep "AI\|DeepSeek\|OpenAI"
```

### 性能监控
```bash
# 查看数据库统计
npm run db:stats

# 查看缓存状态
npm run cache:status

# 查看同步状态
npm run sync:status
```

## 📚 更多资源

### 文档
- [MCP协议文档](https://modelcontextprotocol.io/)
- [Prisma文档](https://www.prisma.io/docs/)
- [DeepSeek API文档](https://platform.deepseek.com/docs)
- [OpenAI API文档](https://platform.openai.com/docs)

### 示例代码
- `examples/simple-mcp-test.js` - 简单MCP测试
- `examples/mcp-client-example.js` - 完整MCP客户端示例
- `examples/usage.md` - 使用示例文档

### 工具脚本
- `scripts/init-db.js` - 数据库初始化
- `scripts/start.js` - 服务启动
- `scripts/test-ai-service.js` - AI服务测试
- `scripts/test-deepseek.js` - DeepSeek API测试

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)。

### 许可证条款
- 允许商业使用
- 允许修改和分发
- 允许私人使用
- 不提供担保

### 贡献
欢迎提交Issue和Pull Request来改进项目。

---

**🎉 感谢使用AI新闻MCP服务！**

如有问题或建议，请查看[故障排除](#故障排除)部分或提交Issue。 
