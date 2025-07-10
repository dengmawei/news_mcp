# AI新闻MCP服务使用示例

## 基本使用

### 1. 获取最新AI新闻

```typescript
// 获取最新的10条AI新闻
const latestNews = await getLatestAINews({
  limit: 10
});

// 获取特定分类的新闻
const researchNews = await getLatestAINews({
  limit: 5,
  category: 'research'
});
```

### 2. 搜索特定主题的新闻

```typescript
// 搜索ChatGPT相关新闻
const chatgptNews = await searchAINews({
  query: 'ChatGPT',
  limit: 10,
  dateRange: 'week'
});

// 搜索多模态AI新闻
const multimodalNews = await searchAINews({
  query: 'multimodal AI',
  limit: 5,
  dateRange: 'month'
});
```

### 3. 获取新闻摘要

```typescript
// 获取新闻摘要和关键要点
const summary = await getNewsSummary({
  newsId: 'techcrunch-ai-1234567890-0',
  includeKeyPoints: true
});
```

### 4. 获取AI趋势分析

```typescript
// 获取月度趋势分析
const trends = await getAITrends({
  timeframe: 'month',
  includeStats: true
});
```

### 5. 获取新闻源列表

```typescript
// 获取所有支持的新闻源
const sources = await getNewsSources({
  includeStatus: true
});
```

## 高级用法

### 自定义新闻源

```typescript
// 在NewsService中添加自定义新闻源
const customSource: NewsSource = {
  id: 'my-ai-blog',
  name: '我的AI博客',
  url: 'https://myblog.com/ai/feed',
  type: 'rss',
  category: 'general',
  language: 'zh',
  isActive: true
};
```

### 集成OpenAI API进行智能摘要

```typescript
// 在NewsAnalyzer中集成OpenAI
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateAISummary(news: NewsItem): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: '你是一个AI新闻分析师，请为以下新闻生成简洁的摘要。'
      },
      {
        role: 'user',
        content: `请为以下新闻生成摘要：\n标题：${news.title}\n内容：${news.description}`
      }
    ]
  });
  
  return response.choices[0].message.content || '';
}
```

### 数据持久化

```typescript
// 使用数据库存储新闻数据
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function saveNewsToDatabase(newsItems: NewsItem[]): Promise<void> {
  for (const news of newsItems) {
    await prisma.news.create({
      data: {
        title: news.title,
        description: news.description,
        url: news.url,
        source: news.source,
        publishedAt: news.publishedAt,
        category: news.category,
        tags: news.tags,
        author: news.author || null,
        imageUrl: news.imageUrl || null
      }
    });
  }
}
```

## 错误处理

```typescript
try {
  const news = await getLatestAINews({ limit: 10 });
  console.log('获取新闻成功:', news);
} catch (error) {
  console.error('获取新闻失败:', error);
  
  // 根据错误类型进行不同处理
  if (error.message.includes('网络错误')) {
    // 重试逻辑
  } else if (error.message.includes('API限制')) {
    // 等待后重试
  }
}
```

## 性能优化

### 缓存策略

```typescript
// 使用Redis进行缓存
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedNews(key: string): Promise<NewsItem[] | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedNews(key: string, news: NewsItem[], ttl: number = 300): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(news));
}
```

### 并发控制

```typescript
// 限制并发请求数量
import pLimit from 'p-limit';

const limit = pLimit(5); // 最多5个并发请求

const newsPromises = sources.map(source => 
  limit(() => newsService.fetchNewsFromSource(source))
);
```

## 监控和日志

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// 在服务中使用
logger.info('开始获取新闻', { source: source.name });
logger.error('获取新闻失败', { source: source.name, error: error.message });
``` 