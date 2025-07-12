#!/usr/bin/env node

import app from './api.js';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 AI News MCP HTTP服务已启动，端口: ${port}`);
  console.log(`📊 健康检查: http://localhost:${port}/health`);
  console.log(`🔧 API文档: http://localhost:${port}/api/mcp/tools`);
  console.log(`📰 新闻API: http://localhost:${port}/api/news/latest`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务器...');
  process.exit(0);
}); 