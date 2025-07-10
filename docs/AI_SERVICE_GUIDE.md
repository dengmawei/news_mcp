# AI服务使用指南

## 概述

本项目集成了OpenAI API，提供智能新闻分析和摘要生成功能。当OpenAI API可用时，系统会使用AI进行深度分析；当API不可用时，会自动降级到规则基础分析。

## 功能特性

### 🤖 智能摘要生成
- 自动提取新闻关键信息
- 生成简洁的新闻摘要
- 识别关键要点
- 分析情感倾向（正面/负面/中性）
- 评估影响程度（高/中/低）
- 提取相关话题标签

### 📈 智能趋势分析
- 分析热门话题趋势
- 识别新兴话题
- 发现衰退话题
- 提供洞察分析
- 支持不同时间范围（周/月/季度）

## 配置

### 1. 环境变量配置

在 `.env` 文件中添加OpenAI API密钥：

```bash
# OpenAI API配置（用于智能摘要生成）
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. 获取OpenAI API密钥

1. 访问 [OpenAI官网](https://platform.openai.com/)
2. 注册或登录账户
3. 进入API Keys页面
4. 创建新的API密钥
5. 复制密钥到 `.env` 文件

## 使用方法

### 1. 测试AI服务

```bash
# 测试AI服务功能
npm run test:ai
```

### 2. 在代码中使用

```typescript
import { AIService } from './src/services/aiService.js';

const aiService = new AIService();

// 检查AI服务状态
if (aiService.isAIServiceEnabled()) {
  console.log('AI服务已启用');
} else {
  console.log('AI服务未启用，将使用规则基础分析');
}

// 生成新闻摘要
const summary = await aiService.generateNewsSummary({
  title: '新闻标题',
  content: '新闻内容',
  description: '新闻描述',
  includeKeyPoints: true
});

// 分析趋势
const trends = await aiService.analyzeTrends({
  newsData: [...], // 新闻数据数组
  timeframe: 'month'
});
```

### 3. 在NewsAnalyzer中使用

```typescript
import { NewsAnalyzer } from './src/services/newsAnalyzer.js';

const analyzer = new NewsAnalyzer();

// 获取新闻摘要（自动使用AI服务）
const summary = await analyzer.getNewsSummary(newsId);

// 获取AI趋势分析
const trends = await analyzer.getAITrends('month');

// 测试AI服务连接
const isConnected = await analyzer.testAIService();
```

## API响应格式

### 新闻摘要响应

```typescript
interface AISummaryResponse {
  summary: string;           // 新闻摘要
  keyPoints: string[];       // 关键要点
  sentiment: 'positive' | 'negative' | 'neutral';  // 情感倾向
  impact: 'high' | 'medium' | 'low';               // 影响程度
  relatedTopics: string[];   // 相关话题
}
```

### 趋势分析响应

```typescript
interface AITrendAnalysisResponse {
  topTopics: Array<{
    topic: string;
    frequency: number;
    trend: 'rising' | 'stable' | 'declining';
    reasoning: string;
  }>;
  emergingTopics: string[];  // 新兴话题
  decliningTopics: string[]; // 衰退话题
  insights: string[];        // 洞察分析
}
```

## 降级机制

当OpenAI API不可用时，系统会自动降级到规则基础分析：

### 规则基础摘要生成
- 基于关键词的情感分析
- 简单的摘要提取（前两句）
- 预定义的关键点识别
- 基于词汇的影响度评估

### 规则基础趋势分析
- 基于频率统计的热门话题
- 简单的趋势判断算法
- 基础的数据洞察

## 成本控制

### 1. Token使用优化
- 摘要生成限制在1000 tokens以内
- 趋势分析限制在1500 tokens以内
- 新闻数据量限制在50条以内

### 2. 缓存机制
- 摘要结果会保存到数据库
- 避免重复的AI调用
- 支持摘要更新和刷新

### 3. 错误处理
- API调用失败时自动降级
- 详细的错误日志记录
- 优雅的异常处理

## 监控和调试

### 1. 日志监控
```bash
# 查看AI服务日志
tail -f logs/app.log | grep "AI"
```

### 2. 连接测试
```bash
# 测试OpenAI连接
npm run test:ai
```

### 3. 性能监控
- 记录API调用次数
- 监控响应时间
- 跟踪错误率

## 最佳实践

### 1. 环境配置
- 使用环境变量管理API密钥
- 不同环境使用不同的API密钥
- 定期轮换API密钥

### 2. 错误处理
- 始终检查AI服务状态
- 实现优雅的降级机制
- 记录详细的错误信息

### 3. 性能优化
- 合理设置token限制
- 使用缓存减少API调用
- 批量处理数据

### 4. 成本管理
- 监控API使用量
- 设置使用限制
- 优化prompt设计

## 故障排除

### 常见问题

1. **API密钥无效**
   - 检查API密钥是否正确
   - 确认账户余额充足
   - 验证API密钥权限

2. **网络连接问题**
   - 检查网络连接
   - 确认防火墙设置
   - 验证代理配置

3. **响应解析失败**
   - 检查prompt格式
   - 验证JSON响应格式
   - 查看错误日志

### 调试步骤

1. 运行AI服务测试
2. 检查环境变量配置
3. 查看详细错误日志
4. 验证网络连接
5. 测试API密钥有效性

## 更新日志

- **v1.0.0**: 初始AI服务实现
- 支持OpenAI GPT-3.5-turbo模型
- 实现智能摘要和趋势分析
- 添加降级机制和错误处理 