import dotenv from 'dotenv';
import { AIService } from '../dist/services/aiService.js';

// 加载环境变量
dotenv.config();

async function testDeepSeek() {
  console.log('🔍 测试DeepSeek API配置...\n');

  const aiService = new AIService();

  // 检查服务状态
  console.log('📊 服务状态:');
  console.log(`- AI服务启用: ${aiService.isAIServiceEnabled()}`);
  console.log(`- 使用DeepSeek: ${aiService.isDeepSeekService()}`);
  
  if (!aiService.isAIServiceEnabled()) {
    console.log('\n❌ AI服务未启用');
    console.log('请检查环境变量配置:');
    console.log('- DEEPSEEK_API_KEY');
    console.log('- OPENAI_API_KEY');
    return;
  }

  if (!aiService.isDeepSeekService()) {
    console.log('\n⚠️  当前使用的是OpenAI服务，不是DeepSeek');
    console.log('如需使用DeepSeek，请配置DEEPSEEK_API_KEY环境变量');
    return;
  }

  console.log('\n✅ 正在使用DeepSeek服务');

  // 测试简单对话
  console.log('\n🧪 测试简单对话...');
  try {
    const testResponse = await aiService.generateNewsSummary({
      title: '测试新闻',
      content: '这是一个测试新闻内容，用于验证DeepSeek API是否正常工作。',
      description: '测试新闻描述',
      includeKeyPoints: true
    });

    console.log('✅ DeepSeek API测试成功!');
    console.log('响应示例:');
    console.log(`- 摘要: ${testResponse.summary}`);
    console.log(`- 情感: ${testResponse.sentiment}`);
    console.log(`- 影响度: ${testResponse.impact}`);
    console.log(`- 关键点: ${testResponse.keyPoints.join(', ')}`);
  } catch (error) {
    console.log('❌ DeepSeek API测试失败:');
    console.log(`错误信息: ${error.message}`);
    
    if (error.message.includes('401')) {
      console.log('💡 提示: API密钥可能无效或已过期');
    } else if (error.message.includes('429')) {
      console.log('💡 提示: API调用频率超限');
    } else if (error.message.includes('network')) {
      console.log('💡 提示: 网络连接问题');
    }
  }

  console.log('\n🎉 DeepSeek测试完成!');
}

// 运行测试
testDeepSeek().catch(console.error); 