#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function simpleMCPTest() {
  console.log('🚀 开始 MCP 服务测试...\n');

  // 创建 MCP 客户端
  const client = new Client({
    name: 'simple-test-client',
    version: '1.0.0'
  });

  try {
    // 连接到 MCP 服务器
    const transport = new StdioClientTransport({
      command: 'node',
      args: [join(__dirname, '..', 'dist', 'index.js')],
      env: { 
        DATABASE_URL: 'file:./dev.db'
      }
    });

    await client.connect(transport);
    console.log('✅ 成功连接到 AI 新闻 MCP 服务\n');

    // 测试1: 获取可用工具列表
    console.log('📋 测试1: 获取可用工具列表');
    const tools = await client.listTools();
    console.log(`找到 ${tools.tools.length} 个可用工具:`);
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // 测试2: 获取最新新闻
    console.log('📰 测试2: 获取最新 AI 新闻');
    const newsResult = await client.callTool({
      name: 'get_latest_ai_news',
      arguments: { limit: 3 }
    });
    
    const news = JSON.parse(newsResult.content[0].text);
    console.log(`获取到 ${news.length} 条新闻:`);
    news.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title}`);
      console.log(`     来源: ${item.source}`);
    });
    console.log('');

    // 测试3: 搜索新闻
    console.log('🔍 测试3: 搜索 ChatGPT 相关新闻');
    const searchResult = await client.callTool({
      name: 'search_ai_news',
      arguments: { 
        query: 'ChatGPT',
        limit: 2
      }
    });
    
    const searchNews = JSON.parse(searchResult.content[0].text);
    console.log(`搜索到 ${searchNews.length} 条相关新闻`);
    console.log('');

    // 测试4: 获取新闻源
    console.log('📡 测试4: 获取新闻源列表');
    const sourcesResult = await client.callTool({
      name: 'get_news_sources',
      arguments: {}
    });
    
    const sources = JSON.parse(sourcesResult.content[0].text);
    console.log(`找到 ${sources.length} 个新闻源:`);
    sources.forEach(source => {
      console.log(`  - ${source.name} (${source.category})`);
    });

    console.log('\n🎉 所有测试完成！MCP 服务运行正常。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    // 关闭连接
    await client.close();
    console.log('\n👋 已断开 MCP 服务连接');
  }
}

// 运行测试
simpleMCPTest().catch(console.error); 