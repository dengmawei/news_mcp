#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPClientExample {
  constructor() {
    this.client = new Client({
      name: 'ai-news-client',
      version: '1.0.0'
    });
  }

  async connect() {
    // 连接到 MCP 服务器
    const transport = new StdioClientTransport({
      command: 'node',
      args: [join(__dirname, '..', 'dist', 'index.js')],
      env: { 
        DATABASE_URL: 'file:./dev.db',
        NODE_ENV: 'development'
      }
    });

    await this.client.connect(transport);
    console.log('✅ 已连接到 AI 新闻 MCP 服务');
  }

  async listTools() {
    console.log('\n📋 获取可用工具列表...');
    const tools = await this.client.listTools();
    console.log('可用工具:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
  }

  async getLatestNews(limit = 5) {
    console.log(`\n📰 获取最新 ${limit} 条 AI 新闻...`);
    try {
      const result = await this.client.callTool({
        name: 'get_latest_ai_news',
        arguments: { limit }
      });
      
      const news = JSON.parse(result.content[0].text);
      console.log(`✅ 成功获取 ${news.length} 条新闻:`);
      news.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
        console.log(`     来源: ${item.source} | 分类: ${item.category}`);
        console.log(`     发布时间: ${new Date(item.publishedAt).toLocaleString()}`);
        console.log(`     链接: ${item.url}`);
        console.log('');
      });
      return news;
    } catch (error) {
      console.error('❌ 获取新闻失败:', error.message);
    }
  }

  async searchNews(query, limit = 5) {
    console.log(`\n🔍 搜索 "${query}" 相关新闻...`);
    try {
      const result = await this.client.callTool({
        name: 'search_ai_news',
        arguments: { 
          query, 
          limit,
          dateRange: 'week'
        }
      });
      
      const news = JSON.parse(result.content[0].text);
      console.log(`✅ 找到 ${news.length} 条相关新闻:`);
      news.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
        console.log(`     来源: ${item.source} | 分类: ${item.category}`);
        console.log(`     描述: ${item.description.substring(0, 100)}...`);
        console.log('');
      });
      return news;
    } catch (error) {
      console.error('❌ 搜索新闻失败:', error.message);
    }
  }

  async getNewsSummary(newsId) {
    console.log(`\n📝 获取新闻摘要 (ID: ${newsId})...`);
    try {
      const result = await this.client.callTool({
        name: 'get_news_summary',
        arguments: { 
          newsId,
          includeKeyPoints: true
        }
      });
      
      const summary = JSON.parse(result.content[0].text);
      console.log('✅ 新闻摘要:');
      console.log(`  标题: ${summary.title}`);
      console.log(`  摘要: ${summary.summary}`);
      console.log(`  情感: ${summary.sentiment}`);
      console.log(`  影响: ${summary.impact}`);
      console.log(`  关键要点:`);
      summary.keyPoints.forEach(point => {
        console.log(`    - ${point}`);
      });
      console.log(`  相关话题: ${summary.relatedTopics.join(', ')}`);
      return summary;
    } catch (error) {
      console.error('❌ 获取摘要失败:', error.message);
    }
  }

  async getAITrends(timeframe = 'month') {
    console.log(`\n📊 获取 AI 趋势分析 (${timeframe})...`);
    try {
      const result = await this.client.callTool({
        name: 'get_ai_trends',
        arguments: { 
          timeframe,
          includeStats: true
        }
      });
      
      const trends = JSON.parse(result.content[0].text);
      console.log('✅ AI 趋势分析:');
      console.log(`  时间范围: ${trends.timeframe}`);
      console.log(`  热门话题:`);
      trends.topTopics.forEach((topic, index) => {
        console.log(`    ${index + 1}. ${topic.topic} (频率: ${topic.frequency}, 趋势: ${topic.trend})`);
      });
      console.log(`  情感分布: 正面 ${trends.sentimentDistribution.positive}%, 负面 ${trends.sentimentDistribution.negative}%, 中性 ${trends.sentimentDistribution.neutral}%`);
      console.log(`  新兴话题: ${trends.emergingTopics.join(', ')}`);
      return trends;
    } catch (error) {
      console.error('❌ 获取趋势分析失败:', error.message);
    }
  }

  async getNewsSources() {
    console.log('\n📡 获取新闻源列表...');
    try {
      const result = await this.client.callTool({
        name: 'get_news_sources',
        arguments: { 
          includeStatus: true
        }
      });
      
      const sources = JSON.parse(result.content[0].text);
      console.log('✅ 支持的新闻源:');
      sources.forEach((source, index) => {
        console.log(`  ${index + 1}. ${source.name}`);
        console.log(`     类型: ${source.type} | 分类: ${source.category}`);
        console.log(`     语言: ${source.language} | 状态: ${source.isActive ? '活跃' : '停用'}`);
        console.log(`     URL: ${source.url}`);
        console.log('');
      });
      return sources;
    } catch (error) {
      console.error('❌ 获取新闻源失败:', error.message);
    }
  }

  async runDemo() {
    try {
      await this.connect();
      await this.listTools();
      
      // 演示各种功能
      await this.getLatestNews(3);
      await this.searchNews('ChatGPT', 2);
      await this.getAITrends('week');
      await this.getNewsSources();
      
      console.log('\n🎉 MCP 服务调用演示完成！');
    } catch (error) {
      console.error('❌ 演示过程中出现错误:', error);
    } finally {
      await this.client.close();
    }
  }

  async disconnect() {
    await this.client.close();
    console.log('👋 已断开 MCP 服务连接');
  }
}

// 如果直接运行此脚本
if (process.argv[1] && process.argv[1].endsWith('mcp-client-example.js')) {
  const client = new MCPClientExample();
  client.runDemo().catch(console.error);
}

export { MCPClientExample }; 