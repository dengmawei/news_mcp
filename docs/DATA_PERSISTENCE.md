# 数据持久化功能说明

## 概述

AI新闻MCP服务现在支持完整的数据持久化功能，所有新闻数据都会保存到SQLite数据库中，提供更好的性能和可靠性。

## 主要特性

### 1. 自动数据同步
- 服务启动时自动从新闻源获取最新数据
- 每30分钟自动同步一次（可配置）
- 支持强制同步和增量同步
- 智能去重，避免重复数据

### 2. 数据库存储
- 使用SQLite轻量级数据库
- 支持新闻源、新闻内容、摘要的完整存储
- 自动管理数据关系和外键约束
- 支持数据清理和归档

### 3. 缓存优化
- 三层缓存架构：Redis + 内存 + 数据库
- 智能缓存策略，减少重复请求
- 缓存命中率监控和统计

### 4. 数据管理
- 支持按时间范围清理旧数据
- 数据库统计信息查看
- 同步状态监控
- 错误处理和日志记录

## 数据库结构

### 主要表结构

```sql
-- 新闻源表
news_sources (
  id, name, url, type, category, language, 
  isActive, lastUpdate, createdAt, updatedAt
)

-- 新闻内容表
news_items (
  id, title, description, content, url, sourceId,
  publishedAt, category, tags, imageUrl, author,
  createdAt, updatedAt
)

-- 新闻摘要表
news_summaries (
  id, newsId, summary, keyPoints, sentiment,
  impact, relatedTopics, createdAt, updatedAt
)

-- 缓存表
cache_entries (
  key, value, expiresAt, createdAt
)
```

## 使用方法

### 1. 初始化数据库

```bash
# 生成Prisma客户端
npm run db:generate

# 创建数据库表
npm run db:push

# 初始化默认新闻源
npm run db:init
```

### 2. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 3. 数据同步

```bash
# 强制同步所有新闻源
npm run db:sync

# 查看数据库统计
npm run db:stats

# 清理旧数据（30天前）
npm run db:cleanup
```

### 4. 测试数据持久化

```bash
# 运行持久化功能测试
npm run test:persistence
```

## MCP工具

### 新增的数据管理工具

1. **sync_news_data** - 同步新闻数据
   ```json
   {
     "force": false,
     "sources": ["TechCrunch AI", "VentureBeat AI"],
     "maxAge": 30
   }
   ```

2. **get_sync_status** - 获取同步状态
   ```json
   {}
   ```

3. **get_database_stats** - 获取数据库统计
   ```json
   {}
   ```

4. **cleanup_old_data** - 清理旧数据
   ```json
   {
     "daysOld": 30
   }
   ```

## 配置选项

### 环境变量

```env
# 数据库配置
DATABASE_URL="file:./dev.db"

# Redis配置（可选）
REDIS_URL="redis://localhost:6379"

# 日志级别
LOG_LEVEL="info"

# 同步间隔（分钟）
SYNC_INTERVAL=30
```

### 同步选项

```typescript
interface SyncOptions {
  force?: boolean;        // 强制同步
  sources?: string[];     // 指定新闻源
  maxAge?: number;        // 最大同步间隔（分钟）
}
```

## 性能优化

### 1. 数据库优化
- 使用索引优化查询性能
- 定期清理过期数据
- 批量操作减少数据库连接

### 2. 缓存策略
- 热点数据优先缓存
- 缓存过期时间管理
- 缓存穿透保护

### 3. 并发处理
- 并行获取多个新闻源
- 异步处理非关键操作
- 错误隔离和重试机制

## 监控和日志

### 日志级别
- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息
- `debug`: 调试信息

### 关键指标
- 同步成功率
- 数据获取数量
- 缓存命中率
- 数据库操作耗时

### 日志文件
- `logs/error.log`: 错误日志
- `logs/combined.log`: 完整日志

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库文件权限
   ls -la dev.db
   
   # 重新初始化数据库
   npm run db:push
   ```

2. **同步失败**
   ```bash
   # 检查网络连接
   curl -I https://techcrunch.com/tag/artificial-intelligence/feed/
   
   # 强制重新同步
   npm run db:sync
   ```

3. **数据不一致**
   ```bash
   # 清理缓存
   npm run db:cleanup
   
   # 重新同步数据
   npm run db:sync
   ```

### 调试模式

```bash
# 启用调试日志
LOG_LEVEL=debug npm run dev

# 查看详细同步信息
npm run test:persistence
```

## 扩展功能

### 1. 自定义新闻源
在 `src/services/newsService.ts` 中添加新的新闻源：

```typescript
{
  id: 'custom-source',
  name: 'Custom News Source',
  url: 'https://example.com/feed',
  type: 'rss',
  category: 'general',
  language: 'en',
  isActive: true,
}
```

### 2. 数据导出
```bash
# 导出新闻数据
sqlite3 dev.db "SELECT * FROM news_items;" > news_export.csv
```

### 3. 备份和恢复
```bash
# 备份数据库
cp dev.db dev.db.backup

# 恢复数据库
cp dev.db.backup dev.db
```

## 总结

数据持久化功能为AI新闻MCP服务提供了：

- **可靠性**: 数据持久存储，服务重启不丢失
- **性能**: 缓存优化，快速响应
- **可扩展性**: 模块化设计，易于扩展
- **可维护性**: 完整的监控和日志系统

通过这些功能，服务可以稳定地为用户提供最新的AI新闻信息。 