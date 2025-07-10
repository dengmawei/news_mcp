import OpenAI from 'openai';
import { LoggerService } from './loggerService.js';

export interface AISummaryRequest {
  title: string;
  content: string;
  description: string;
  includeKeyPoints?: boolean;
}

export interface AISummaryResponse {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  relatedTopics: string[];
}

export interface AITrendAnalysisRequest {
  newsData: Array<{
    title: string;
    description: string;
    tags: string[];
    publishedAt: Date;
  }>;
  timeframe: string;
}

export interface AITrendAnalysisResponse {
  topTopics: Array<{
    topic: string;
    frequency: number;
    trend: 'rising' | 'stable' | 'declining';
    reasoning: string;
  }>;
  emergingTopics: string[];
  decliningTopics: string[];
  insights: string[];
}

export class AIService {
  private openai: OpenAI | null = null;
  private logger: LoggerService;
  private isEnabled: boolean = false;
  private isDeepSeek: boolean = false;

  constructor() {
    this.logger = new LoggerService();
    this.initAI();
  }

  private initAI() {
    // 优先检查DeepSeek API密钥
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (deepseekApiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: deepseekApiKey,
          baseURL: 'https://api.deepseek.com/v1',
        });
        this.isEnabled = true;
        this.isDeepSeek = true;
        this.logger.info('DeepSeek服务已初始化');
      } catch (error) {
        this.logger.error('DeepSeek初始化失败', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        this.isEnabled = false;
      }
    } else if (openaiApiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: openaiApiKey,
        });
        this.isEnabled = true;
        this.isDeepSeek = false;
        this.logger.info('OpenAI服务已初始化');
      } catch (error) {
        this.logger.error('OpenAI初始化失败', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        this.isEnabled = false;
      }
    } else {
      this.logger.warn('未配置DEEPSEEK_API_KEY或OPENAI_API_KEY，AI服务将使用规则基础分析');
      this.isEnabled = false;
    }
  }

  async generateNewsSummary(request: AISummaryRequest): Promise<AISummaryResponse> {
    if (!this.isEnabled || !this.openai) {
      return this.generateRuleBasedSummary(request);
    }

    try {
      const prompt = this.buildSummaryPrompt(request);
      
      const response = await this.openai.chat.completions.create({
        model: this.isDeepSeek ? 'deepseek-chat' : 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI新闻分析师，擅长提取新闻关键信息、分析情感倾向和评估影响程度。请用中文回答。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('AI响应为空');
      }

      return this.parseSummaryResponse(result);
    } catch (error) {
      this.logger.error('AI摘要生成失败', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return this.generateRuleBasedSummary(request);
    }
  }

  async analyzeTrends(request: AITrendAnalysisRequest): Promise<AITrendAnalysisResponse> {
    if (!this.isEnabled || !this.openai) {
      return this.generateRuleBasedTrendAnalysis(request);
    }

    try {
      const prompt = this.buildTrendAnalysisPrompt(request);
      
      const response = await this.openai.chat.completions.create({
        model: this.isDeepSeek ? 'deepseek-chat' : 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI趋势分析师，擅长分析新闻数据中的趋势、识别新兴话题和衰退话题。请用中文回答。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('AI响应为空');
      }

      return this.parseTrendAnalysisResponse(result);
    } catch (error) {
      this.logger.error('AI趋势分析失败', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return this.generateRuleBasedTrendAnalysis(request);
    }
  }

  private buildSummaryPrompt(request: AISummaryRequest): string {
    return `
请分析以下AI相关新闻，并提供结构化分析：

标题：${request.title}
描述：${request.description}
内容：${request.content}

请提供以下分析（用JSON格式返回）：
1. summary: 简洁的新闻摘要（100字以内）
2. keyPoints: 关键要点列表（3-5个要点）
3. sentiment: 情感倾向（positive/negative/neutral）
4. impact: 影响程度（high/medium/low）
5. relatedTopics: 相关话题标签（5个以内）

JSON格式示例：
{
  "summary": "新闻摘要",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "sentiment": "positive",
  "impact": "high",
  "relatedTopics": ["话题1", "话题2", "话题3"]
}
    `.trim();
  }

  private buildTrendAnalysisPrompt(request: AITrendAnalysisRequest): string {
    const newsData = request.newsData.slice(0, 50); // 限制数据量
    const newsText = newsData.map(news => 
      `标题：${news.title}\n描述：${news.description}\n标签：${news.tags.join(', ')}\n发布时间：${news.publishedAt.toISOString()}`
    ).join('\n\n');

    return `
请分析以下AI新闻数据中的趋势（时间范围：${request.timeframe}）：

${newsText}

请提供以下分析（用JSON格式返回）：
1. topTopics: 热门话题列表（包含话题、频率、趋势、推理）
2. emergingTopics: 新兴话题列表
3. decliningTopics: 衰退话题列表
4. insights: 洞察分析（3-5条）

JSON格式示例：
{
  "topTopics": [
    {
      "topic": "GPT-5",
      "frequency": 15,
      "trend": "rising",
      "reasoning": "近期发布频率增加"
    }
  ],
  "emergingTopics": ["话题1", "话题2"],
  "decliningTopics": ["话题3", "话题4"],
  "insights": ["洞察1", "洞察2"]
}
    `.trim();
  }

  private parseSummaryResponse(response: string): AISummaryResponse {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
          impact: ['high', 'medium', 'low'].includes(parsed.impact) ? parsed.impact : 'medium',
          relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics : []
        };
      }
    } catch (error) {
      this.logger.error('解析AI摘要响应失败', { 
        error: error instanceof Error ? error.message : String(error),
        response 
      });
    }

    // 降级到规则基础分析
    return this.generateRuleBasedSummary({
      title: '',
      content: '',
      description: response
    });
  }

  private parseTrendAnalysisResponse(response: string): AITrendAnalysisResponse {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          topTopics: Array.isArray(parsed.topTopics) ? parsed.topTopics : [],
          emergingTopics: Array.isArray(parsed.emergingTopics) ? parsed.emergingTopics : [],
          decliningTopics: Array.isArray(parsed.decliningTopics) ? parsed.decliningTopics : [],
          insights: Array.isArray(parsed.insights) ? parsed.insights : []
        };
      }
    } catch (error) {
      this.logger.error('解析AI趋势分析响应失败', { 
        error: error instanceof Error ? error.message : String(error),
        response 
      });
    }

    // 降级到规则基础分析
    return this.generateRuleBasedTrendAnalysis({
      newsData: [],
      timeframe: 'month'
    });
  }

  private generateRuleBasedSummary(request: AISummaryRequest): AISummaryResponse {
    const text = `${request.title} ${request.description}`.toLowerCase();
    
    // 简单的情感分析
    const positiveWords = ['breakthrough', 'improve', 'advance', 'success', 'innovative'];
    const negativeWords = ['problem', 'issue', 'concern', 'risk', 'threat'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });

    const sentiment = positiveScore > negativeScore ? 'positive' : 
                     negativeScore > positiveScore ? 'negative' : 'neutral';

    // 简单的影响度分析
    const highImpactWords = ['breakthrough', 'revolutionary', 'game-changing'];
    const mediumImpactWords = ['new', 'update', 'improve'];
    
    let impact: 'high' | 'medium' | 'low' = 'low';
    for (const word of highImpactWords) {
      if (text.includes(word)) {
        impact = 'high';
        break;
      }
    }
    if (impact === 'low') {
      for (const word of mediumImpactWords) {
        if (text.includes(word)) {
          impact = 'medium';
          break;
        }
      }
    }

    return {
      summary: request.description.length > 100 ? 
        request.description.substring(0, 100) + '...' : request.description,
      keyPoints: this.extractKeyPoints(text),
      sentiment,
      impact,
      relatedTopics: this.extractRelatedTopics(text)
    };
  }

  private generateRuleBasedTrendAnalysis(request: AITrendAnalysisRequest): AITrendAnalysisResponse {
    const tagCount: { [key: string]: number } = {};
    
    request.newsData.forEach(item => {
      item.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    const topTopics = Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, frequency]) => ({
        topic,
        frequency,
        trend: 'stable' as const,
        reasoning: '基于频率统计'
      }));

    return {
      topTopics,
      emergingTopics: [],
      decliningTopics: [],
      insights: ['基于规则的趋势分析']
    };
  }

  private extractKeyPoints(text: string): string[] {
    const keyPoints: string[] = [];
    
    const techTerms = ['gpt', 'llm', 'neural network', 'machine learning', 'deep learning'];
    techTerms.forEach(term => {
      if (text.includes(term)) {
        keyPoints.push(`涉及${term}技术`);
      }
    });
    
    const companies = ['openai', 'google', 'microsoft', 'meta', 'anthropic'];
    companies.forEach(company => {
      if (text.includes(company)) {
        keyPoints.push(`${company}相关新闻`);
      }
    });
    
    if (text.includes('release') || text.includes('launch') || text.includes('announce')) {
      keyPoints.push('新产品发布');
    }
    
    return keyPoints.length > 0 ? keyPoints : ['AI技术发展相关'];
  }

  private extractRelatedTopics(text: string): string[] {
    const topics: string[] = [];
    
    const commonTopics = [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning',
      'neural network', 'chatgpt', 'gpt', 'llm', 'computer vision',
      'nlp', 'natural language processing', 'robotics', 'automation'
    ];
    
    commonTopics.forEach(topic => {
      if (text.includes(topic)) {
        topics.push(topic);
      }
    });
    
    return topics.slice(0, 5);
  }

  isAIServiceEnabled(): boolean {
    return this.isEnabled;
  }

  isDeepSeekService(): boolean {
    return this.isDeepSeek;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isEnabled || !this.openai) {
      return false;
    }

    try {
      await this.openai.models.list();
      this.logger.info(`${this.isDeepSeek ? 'DeepSeek' : 'OpenAI'}连接测试成功`);
      return true;
    } catch (error) {
      this.logger.error(`${this.isDeepSeek ? 'DeepSeek' : 'OpenAI'}连接测试失败`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }
} 