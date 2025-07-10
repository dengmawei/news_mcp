import dotenv from 'dotenv';
import { AIService } from '../dist/services/aiService.js';
import { NewsAnalyzer } from '../dist/services/newsAnalyzer.js';

// 加载环境变量
dotenv.config();

async function testAIService() {
  console.log('🤖 开始测试AI服务...\n');

  const aiService = new AIService();
  const newsAnalyzer = new NewsAnalyzer();

  // 测试AI服务状态
  console.log('📊 AI服务状态检查:');
  console.log(`- AI服务启用状态: ${aiService.isAIServiceEnabled()}`);
  
  if (aiService.isAIServiceEnabled()) {
    if (aiService.isDeepSeekService()) {
      console.log('✅ DeepSeek API已配置');
    } else {
      console.log('✅ OpenAI API已配置');
    }
    
    // 测试连接
    console.log('\n🔗 测试AI服务连接...');
    const connectionTest = await aiService.testConnection();
    console.log(`- 连接测试结果: ${connectionTest ? '✅ 成功' : '❌ 失败'}`);
  } else {
    console.log('⚠️  DeepSeek API和OpenAI API均未配置，将使用规则基础分析');
  }

  // 测试新闻摘要生成
  console.log('\n📰 测试新闻摘要生成:');
  const testNews = {
    title: 'OpenAI发布GPT-5，性能大幅提升',
    content: 'OpenAI今日发布了GPT-5，这是其大型语言模型系列的最新版本。新模型在推理、创造性和多模态能力方面都有显著提升。GPT-5在多个基准测试中超越了之前的版本，特别是在数学推理、代码生成和创意写作方面表现突出。',
    description: 'OpenAI最新发布的GPT-5在多个基准测试中表现优异，推理能力和创造性都有显著提升。',
    includeKeyPoints: true
  };

  try {
    const summary = await aiService.generateNewsSummary(testNews);
    console.log('✅ 摘要生成成功:');
    console.log(`- 摘要: ${summary.summary}`);
    console.log(`- 关键点: ${summary.keyPoints.join(', ')}`);
    console.log(`- 情感: ${summary.sentiment}`);
    console.log(`- 影响度: ${summary.impact}`);
    console.log(`- 相关话题: ${summary.relatedTopics.join(', ')}`);
  } catch (error) {
    console.log('❌ 摘要生成失败:', error.message);
  }

  // 测试趋势分析
  console.log('\n📈 测试趋势分析:');
  const testNewsData = [
    {
      title: 'OpenAI发布GPT-5',
      description: 'OpenAI最新发布的GPT-5在多个基准测试中表现优异',
      tags: ['gpt-5', 'openai', 'llm'],
      publishedAt: new Date()
    },
    {
      title: 'Google发布Gemini Pro',
      description: 'Google发布了新的AI模型Gemini Pro，在多模态任务上表现突出',
      tags: ['gemini', 'google', 'llm'],
      publishedAt: new Date()
    },
    {
      title: 'Microsoft投资OpenAI',
      description: 'Microsoft宣布对OpenAI进行重大投资，深化AI合作',
      tags: ['microsoft', 'openai', 'investment'],
      publishedAt: new Date()
    }
  ];

  try {
    const trends = await aiService.analyzeTrends({
      newsData: testNewsData,
      timeframe: 'month'
    });
    console.log('✅ 趋势分析成功:');
    console.log(`- 热门话题数量: ${trends.topTopics.length}`);
    console.log(`- 新兴话题: ${trends.emergingTopics.join(', ')}`);
    console.log(`- 衰退话题: ${trends.decliningTopics.join(', ')}`);
    console.log(`- 洞察数量: ${trends.insights.length}`);
  } catch (error) {
    console.log('❌ 趋势分析失败:', error.message);
  }

  // 测试NewsAnalyzer集成
  console.log('\n🔗 测试NewsAnalyzer集成:');
  console.log(`- NewsAnalyzer AI服务状态: ${newsAnalyzer.isAIServiceEnabled()}`);
  
  try {
    const testResult = await newsAnalyzer.testAIService();
    console.log(`- AI服务测试结果: ${testResult ? '✅ 成功' : '❌ 失败'}`);
  } catch (error) {
    console.log('❌ AI服务测试失败:', error.message);
  }

  console.log('\n🎉 AI服务测试完成!');
  
  // 清理资源
  await newsAnalyzer.disconnect();
}

// 运行测试
testAIService().catch(console.error); 