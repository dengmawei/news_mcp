import { NewsItem } from './newsService.js';
import { NewsAggregator } from './newsAggregator.js';

export interface NewsSummary {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  relatedTopics: string[];
  source: string;
  publishedAt: Date;
}

export interface TrendAnalysis {
  timeframe: string;
  topTopics: Array<{
    topic: string;
    frequency: number;
    trend: 'rising' | 'stable' | 'declining';
  }>;
  topSources: Array<{
    source: string;
    articleCount: number;
    avgSentiment: number;
  }>;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  emergingTopics: string[];
  decliningTopics: string[];
}

export class NewsAnalyzer {
  private newsAggregator: NewsAggregator;

  constructor() {
    this.newsAggregator = new NewsAggregator();
  }

  async getNewsSummary(newsId: string, includeKeyPoints: boolean = true): Promise<NewsSummary> {
    // 这里应该从数据库或缓存中获取新闻详情
    // 目前使用模拟数据
    const mockNews: NewsItem = {
      id: newsId,
      title: 'OpenAI发布GPT-5，性能大幅提升',
      description: 'OpenAI最新发布的GPT-5在多个基准测试中表现优异，推理能力和创造性都有显著提升。',
      content: 'OpenAI今日发布了GPT-5，这是其大型语言模型系列的最新版本。新模型在推理、创造性和多模态能力方面都有显著提升。GPT-5在多个基准测试中超越了之前的版本，特别是在数学推理、代码生成和创意写作方面表现突出。',
      url: 'https://example.com/gpt5-release',
      source: 'TechCrunch AI',
      publishedAt: new Date(),
      category: 'products',
      tags: ['gpt-5', 'openai', 'llm', 'ai'],
      author: 'John Doe'
    };

    const summary = await this.generateSummary(mockNews, includeKeyPoints);
    return summary;
  }

  async getAITrends(timeframe: 'week' | 'month' | 'quarter' = 'month', includeStats: boolean = true): Promise<TrendAnalysis> {
    const news = await this.newsAggregator.getLatestNews(1000);
    
    // 根据时间范围过滤新闻
    const filteredNews = this.filterNewsByTimeframe(news, timeframe);
    
    // 分析热门话题
    const topTopics = this.analyzeTopTopics(filteredNews);
    
    // 分析新闻源
    const topSources = this.analyzeTopSources(filteredNews);
    
    // 分析情感分布
    const sentimentDistribution = this.analyzeSentimentDistribution(filteredNews);
    
    // 识别新兴和衰退话题
    const { emergingTopics, decliningTopics } = this.identifyTopicTrends(filteredNews, timeframe);
    
    const analysis: TrendAnalysis = {
      timeframe,
      topTopics,
      topSources,
      sentimentDistribution,
      emergingTopics,
      decliningTopics
    };

    return analysis;
  }

  private async generateSummary(news: NewsItem, includeKeyPoints: boolean): Promise<NewsSummary> {
    // 这里可以集成OpenAI API来生成更智能的摘要
    // 目前使用简单的规则基础摘要
    
    const summary = this.extractSummary(news);
    const keyPoints = includeKeyPoints ? this.extractKeyPoints(news) : [];
    const sentiment = this.analyzeSentiment(news);
    const impact = this.assessImpact(news);
    const relatedTopics = this.extractRelatedTopics(news);

    return {
      id: news.id,
      title: news.title,
      summary,
      keyPoints,
      sentiment,
      impact,
      relatedTopics,
      source: news.source,
      publishedAt: news.publishedAt
    };
  }

  private extractSummary(news: NewsItem): string {
    // 简单的摘要提取逻辑
    const sentences = news.description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join('. ') + '.';
    }
    return news.description;
  }

  private extractKeyPoints(news: NewsItem): string[] {
    const keyPoints: string[] = [];
    
    // 从标题和描述中提取关键信息
    const text = `${news.title} ${news.description}`.toLowerCase();
    
    // 检测技术名称
    const techTerms = ['gpt', 'llm', 'neural network', 'machine learning', 'deep learning'];
    techTerms.forEach(term => {
      if (text.includes(term)) {
        keyPoints.push(`涉及${term}技术`);
      }
    });
    
    // 检测公司名称
    const companies = ['openai', 'google', 'microsoft', 'meta', 'anthropic'];
    companies.forEach(company => {
      if (text.includes(company)) {
        keyPoints.push(`${company}相关新闻`);
      }
    });
    
    // 检测产品发布
    if (text.includes('release') || text.includes('launch') || text.includes('announce')) {
      keyPoints.push('新产品发布');
    }
    
    return keyPoints.length > 0 ? keyPoints : ['AI技术发展相关'];
  }

  private analyzeSentiment(news: NewsItem): 'positive' | 'negative' | 'neutral' {
    const text = `${news.title} ${news.description}`.toLowerCase();
    
    const positiveWords = ['breakthrough', 'improve', 'advance', 'success', 'innovative', 'revolutionary'];
    const negativeWords = ['problem', 'issue', 'concern', 'risk', 'threat', 'failure'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private assessImpact(news: NewsItem): 'high' | 'medium' | 'low' {
    const text = `${news.title} ${news.description}`.toLowerCase();
    
    const highImpactWords = ['breakthrough', 'revolutionary', 'game-changing', 'major', 'significant'];
    const mediumImpactWords = ['new', 'update', 'improve', 'enhance', 'release'];
    
    for (const word of highImpactWords) {
      if (text.includes(word)) return 'high';
    }
    
    for (const word of mediumImpactWords) {
      if (text.includes(word)) return 'medium';
    }
    
    return 'low';
  }

  private extractRelatedTopics(news: NewsItem): string[] {
    return news.tags.slice(0, 5); // 返回前5个标签作为相关话题
  }

  private filterNewsByTimeframe(news: NewsItem[], timeframe: string): NewsItem[] {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      default:
        return news;
    }
    
    return news.filter(item => item.publishedAt >= cutoffDate);
  }

  private analyzeTopTopics(news: NewsItem[]): Array<{ topic: string; frequency: number; trend: 'rising' | 'stable' | 'declining' }> {
    const tagCount: { [key: string]: number } = {};
    
    news.forEach(item => {
      item.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, frequency]) => ({
        topic,
        frequency,
        trend: this.determineTrend(topic, news) as 'rising' | 'stable' | 'declining'
      }));
  }

  private analyzeTopSources(news: NewsItem[]): Array<{ source: string; articleCount: number; avgSentiment: number }> {
    const sourceStats: { [key: string]: { count: number; sentimentSum: number } } = {};
    
    news.forEach(item => {
      if (!sourceStats[item.source]) {
        sourceStats[item.source] = { count: 0, sentimentSum: 0 };
      }
      sourceStats[item.source].count++;
      sourceStats[item.source].sentimentSum += this.sentimentToNumber(this.analyzeSentiment(item));
    });
    
    return Object.entries(sourceStats)
      .map(([source, stats]) => ({
        source,
        articleCount: stats.count,
        avgSentiment: stats.sentimentSum / stats.count
      }))
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 10);
  }

  private analyzeSentimentDistribution(news: NewsItem[]): { positive: number; negative: number; neutral: number } {
    const distribution = { positive: 0, negative: 0, neutral: 0 };
    
    news.forEach(item => {
      const sentiment = this.analyzeSentiment(item);
      distribution[sentiment]++;
    });
    
    const total = news.length;
    if (total > 0) {
      distribution.positive = Math.round((distribution.positive / total) * 100);
      distribution.negative = Math.round((distribution.negative / total) * 100);
      distribution.neutral = Math.round((distribution.neutral / total) * 100);
    }
    
    return distribution;
  }

  private identifyTopicTrends(news: NewsItem[], timeframe: string): { emergingTopics: string[]; decliningTopics: string[] } {
    // 这里可以实现更复杂的趋势分析算法
    // 目前返回模拟数据
    return {
      emergingTopics: ['multimodal ai', 'ai agents', 'edge ai'],
      decliningTopics: ['basic chatbots', 'simple automation']
    };
  }

  private determineTrend(topic: string, news: NewsItem[]): string {
    // 简单的趋势判断逻辑
    const recentNews = news.filter(item => 
      item.publishedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const recentCount = recentNews.filter(item => item.tags.includes(topic)).length;
    const totalCount = news.filter(item => item.tags.includes(topic)).length;
    
    if (recentCount > totalCount * 0.3) return 'rising';
    if (recentCount < totalCount * 0.1) return 'declining';
    return 'stable';
  }

  private sentimentToNumber(sentiment: 'positive' | 'negative' | 'neutral'): number {
    switch (sentiment) {
      case 'positive': return 1;
      case 'negative': return -1;
      case 'neutral': return 0;
      default: return 0;
    }
  }
} 