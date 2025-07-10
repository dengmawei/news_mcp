# AI新闻MCP服务

这是一个基于Model Context Protocol (MCP)的AI新闻聚合服务，专注于收集和提供最新的AI应用相关新闻。

## 功能特性

- 🔍 实时抓取多个AI新闻源
- 📰 支持RSS订阅和网页爬取
- 🎯 智能分类和标签
- 📊 新闻摘要和关键信息提取
- 🔄 定时更新新闻内容
- 📱 支持多种新闻源格式
- 💾 使用SQLite轻量级数据库
- 🚀 支持Redis缓存（可选）
- 🤖 集成DeepSeek和OpenAI AI服务
- 📈 智能趋势分析和洞察

## 支持的新闻源

- TechCrunch AI
- VentureBeat AI
- MIT Technology Review
- AI News
- 更多...

## 技术栈

- **后端**: Node.js + TypeScript
- **数据库**: SQLite (轻量级，无需安装数据库服务器)
- **缓存**: Redis (可选)
- **ORM**: Prisma
- **协议**: Model Context Protocol (MCP)
- **AI服务**: DeepSeek API / OpenAI API

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
```bash
cp env.example .env
# 编辑.env文件，添加必要的API密钥
```

3. 初始化数据库：
```bash
npm run db:generate  # 生成Prisma客户端
npm run db:push      # 创建数据库表
npm run db:init      # 初始化默认新闻源
```

4. 构建项目：
```bash
npm run build
```

5. 运行服务：
```bash
npm start
```

## 开发

```bash
npm run dev
```

## 测试

```bash
# 运行所有测试
npm test

# 测试AI服务
npm run test:ai

# 测试DeepSeek API
npm run test:deepseek

# 测试数据持久化
npm run test:persistence
```

## 数据库管理

```bash
# 查看数据库
npm run db:studio

# 创建迁移
npm run db:migrate

# 推送数据库变更
npm run db:push
```

## 配置

在`.env`文件中配置以下变量：
- `DATABASE_URL`: SQLite数据库文件路径（默认: "file:./dev.db"）
- `NEWS_API_KEY`: 新闻API密钥（可选）
- `DEEPSEEK_API_KEY`: DeepSeek API密钥（优先使用）
- `OPENAI_API_KEY`: OpenAI API密钥（备选）
- `REDIS_URL`: Redis连接URL（可选）
- `PORT`: 服务端口（默认3000）

### AI服务配置优先级
1. 优先使用DeepSeek API（配置`DEEPSEEK_API_KEY`）
2. 其次使用OpenAI API（配置`OPENAI_API_KEY`）
3. 如果都未配置，则使用规则基础分析

## 使用示例

```typescript
// 获取最新AI新闻
const news = await getLatestAINews();

// 搜索特定主题的新闻
const searchResults = await searchAINews("ChatGPT");

// 获取新闻摘要
const summary = await getNewsSummary(newsId);

// 获取AI趋势分析
const trends = await getAITrends('month');
```

## 部署

### 使用Docker

```bash
# 启动服务（包含Redis）
docker-compose up -d

# 仅启动主服务（使用SQLite）
docker-compose up ai-news-mcp
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

## AI服务说明

### DeepSeek API
- 默认模型：`deepseek-chat`
- API端点：`https://api.deepseek.com/v1`
- 支持功能：新闻摘要、情感分析、趋势分析

### OpenAI API
- 默认模型：`gpt-3.5-turbo`
- API端点：`https://api.openai.com/v1`
- 支持功能：新闻摘要、情感分析、趋势分析

### 降级机制
当AI API不可用时，系统会自动降级到规则基础分析，确保服务可用性。

## 许可证

MIT 
