# Vercel部署指南

## 概述

本指南将帮助您解决在Vercel平台上部署AI新闻MCP服务时遇到的问题。

## 常见问题解决

### 1. "Enable error reporting in type-checked JavaScript files" 错误

这个错误通常是由于TypeScript配置问题导致的。

#### 解决方案：

1. **更新tsconfig.json配置**：
   ```json
   {
     "compilerOptions": {
       "allowJs": false,
       "checkJs": false
     },
     "include": [
       "src/**/*.ts",
       "src/**/*.tsx"
     ],
     "exclude": [
       "node_modules",
       "dist",
       "**/*.test.ts",
       "**/*.spec.ts",
       "**/*.js",
       "**/*.jsx"
     ]
   }
   ```

2. **确保项目结构**：
   - 所有源代码文件都应该是`.ts`或`.tsx`格式
   - 不要在`src`目录中包含`.js`文件

### 2. 环境变量配置

在Vercel部署时，需要配置以下环境变量：

#### 必需的环境变量：
```bash
# 数据库配置
DATABASE_URL="file:./dev.db"

# AI服务配置（至少配置一个）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# 服务配置
NODE_ENV=production
PORT=3000
```

#### 可选的环境变量：
```bash
# 新闻API配置
NEWS_API_KEY=your_news_api_key_here
GNEWS_API_KEY=your_gnews_api_key_here

# 缓存配置
CACHE_DURATION=300000
MAX_CACHE_SIZE=1000

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Redis缓存配置
REDIS_URL=redis://localhost:6379
```

### 3. 部署配置

#### vercel.json配置：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "dist/index.js": {
      "maxDuration": 30
    }
  }
}
```

## 部署步骤

### 1. 本地准备

```bash
# 安装依赖
npm install

# 生成Prisma客户端
npm run db:generate

# 构建项目
npm run build

# 测试构建结果
npm start
```

### 2. Vercel部署

#### 方法1：使用Vercel CLI
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel

# 生产环境部署
vercel --prod
```

#### 方法2：使用GitHub集成
1. 将代码推送到GitHub
2. 在Vercel控制台连接GitHub仓库
3. 配置环境变量
4. 部署项目

### 3. 环境变量配置

在Vercel控制台中：

1. 进入项目设置
2. 找到"Environment Variables"部分
3. 添加所需的环境变量
4. 选择部署环境（Production/Preview/Development）

## 部署后验证

### 1. 检查部署状态
```bash
# 查看部署日志
vercel logs

# 检查函数状态
vercel functions list
```

### 2. 测试MCP服务
```bash
# 使用测试脚本验证
npm run mcp:test
npm run mcp:demo
```

### 3. 监控日志
```bash
# 查看实时日志
vercel logs --follow
```

## 常见问题

### 1. 构建失败
- 检查TypeScript编译错误
- 确保所有依赖都已安装
- 验证环境变量配置

### 2. 运行时错误
- 检查数据库连接
- 验证API密钥配置
- 查看函数日志

### 3. 性能问题
- 调整函数超时时间
- 优化数据库查询
- 启用缓存机制

## 优化建议

### 1. 性能优化
```json
{
  "functions": {
    "dist/index.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### 2. 缓存策略
- 使用Redis缓存热点数据
- 实现数据库查询缓存
- 优化静态资源加载

### 3. 监控和日志
- 配置错误监控
- 设置性能指标
- 实现健康检查

## 故障排除

### 1. 检查构建日志
```bash
vercel logs --build
```

### 2. 本地测试
```bash
# 模拟Vercel环境
NODE_ENV=production npm start
```

### 3. 调试模式
```bash
# 启用详细日志
DEBUG=* npm start
```

## 总结

通过正确配置TypeScript、环境变量和Vercel设置，可以成功部署AI新闻MCP服务。确保：

1. ✅ TypeScript配置正确
2. ✅ 环境变量完整配置
3. ✅ 构建脚本正常工作
4. ✅ 部署后功能验证通过

如果仍然遇到问题，请检查Vercel部署日志并参考上述故障排除步骤。 