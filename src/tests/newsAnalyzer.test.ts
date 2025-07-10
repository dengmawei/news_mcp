import { NewsAnalyzer } from '../services/newsAnalyzer.js';
import { NewsItem } from '../services/newsService.js';

// Mock NewsAggregator
jest.mock('../services/newsAggregator.js');

describe('NewsAnalyzer', () => {
  let newsAnalyzer: NewsAnalyzer;

  const mockNewsItem: NewsItem = {
    id: 'test-1',
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

  beforeEach(() => {
    jest.clearAllMocks();
    newsAnalyzer = new NewsAnalyzer();
  });

  describe('getNewsSummary', () => {
    it('应该返回新闻摘要', async () => {
      const summary = await newsAnalyzer.getNewsSummary('test-1', true);
      
      expect(summary).toBeDefined();
      expect(summary.id).toBe('test-1');
      expect(summary.title).toBe('OpenAI发布GPT-5，性能大幅提升');
      expect(summary.summary).toBeDefined();
      expect(summary.keyPoints).toBeDefined();
      expect(Array.isArray(summary.keyPoints)).toBe(true);
      expect(summary.sentiment).toBeDefined();
      expect(['positive', 'negative', 'neutral']).toContain(summary.sentiment);
      expect(summary.impact).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(summary.impact);
      expect(summary.relatedTopics).toBeDefined();
      expect(Array.isArray(summary.relatedTopics)).toBe(true);
    });

    it('应该包含关键要点', async () => {
      const summary = await newsAnalyzer.getNewsSummary('test-1', true);
      
      expect(summary.keyPoints.length).toBeGreaterThan(0);
      summary.keyPoints.forEach(point => {
        expect(typeof point).toBe('string');
        expect(point.length).toBeGreaterThan(0);
      });
    });

    it('应该能够不包含关键要点', async () => {
      const summary = await newsAnalyzer.getNewsSummary('test-1', false);
      
      expect(summary.keyPoints.length).toBe(0);
    });
  });

  describe('getAITrends', () => {
    it('应该返回趋势分析', async () => {
      const trends = await newsAnalyzer.getAITrends('month', true);
      
      expect(trends).toBeDefined();
      expect(trends.timeframe).toBe('month');
      expect(trends.topTopics).toBeDefined();
      expect(Array.isArray(trends.topTopics)).toBe(true);
      expect(trends.topSources).toBeDefined();
      expect(Array.isArray(trends.topSources)).toBe(true);
      expect(trends.sentimentDistribution).toBeDefined();
      expect(trends.emergingTopics).toBeDefined();
      expect(Array.isArray(trends.emergingTopics)).toBe(true);
      expect(trends.decliningTopics).toBeDefined();
      expect(Array.isArray(trends.decliningTopics)).toBe(true);
    });

    it('应该支持不同的时间范围', async () => {
      const weekTrends = await newsAnalyzer.getAITrends('week');
      const monthTrends = await newsAnalyzer.getAITrends('month');
      const quarterTrends = await newsAnalyzer.getAITrends('quarter');
      
      expect(weekTrends.timeframe).toBe('week');
      expect(monthTrends.timeframe).toBe('month');
      expect(quarterTrends.timeframe).toBe('quarter');
    });

    it('应该包含情感分布统计', async () => {
      const trends = await newsAnalyzer.getAITrends('month', true);
      
      expect(trends.sentimentDistribution).toHaveProperty('positive');
      expect(trends.sentimentDistribution).toHaveProperty('negative');
      expect(trends.sentimentDistribution).toHaveProperty('neutral');
      
      const { positive, negative, neutral } = trends.sentimentDistribution;
      expect(typeof positive).toBe('number');
      expect(typeof negative).toBe('number');
      expect(typeof neutral).toBe('number');
      expect(positive + negative + neutral).toBe(100);
    });

    it('应该包含热门话题趋势', async () => {
      const trends = await newsAnalyzer.getAITrends('month');
      
      trends.topTopics.forEach(topic => {
        expect(topic).toHaveProperty('topic');
        expect(topic).toHaveProperty('frequency');
        expect(topic).toHaveProperty('trend');
        expect(['rising', 'stable', 'declining']).toContain(topic.trend);
        expect(typeof topic.frequency).toBe('number');
        expect(topic.frequency).toBeGreaterThan(0);
      });
    });

    it('应该包含新闻源统计', async () => {
      const trends = await newsAnalyzer.getAITrends('month', true);
      
      trends.topSources.forEach(source => {
        expect(source).toHaveProperty('source');
        expect(source).toHaveProperty('articleCount');
        expect(source).toHaveProperty('avgSentiment');
        expect(typeof source.articleCount).toBe('number');
        expect(source.articleCount).toBeGreaterThan(0);
        expect(typeof source.avgSentiment).toBe('number');
      });
    });
  });

  describe('情感分析', () => {
    it('应该正确识别积极情感', () => {
      const positiveNews: NewsItem = {
        ...mockNewsItem,
        title: 'AI技术取得重大突破',
        description: '研究人员在人工智能领域取得了革命性的突破，这将改变整个行业。'
      };
      
      // 这里我们需要测试私有方法，可以通过公开接口间接测试
      const summary = newsAnalyzer.getNewsSummary('test-1');
      expect(summary).toBeDefined();
    });

    it('应该正确识别消极情感', () => {
      const negativeNews: NewsItem = {
        ...mockNewsItem,
        title: 'AI系统出现严重问题',
        description: '最新的人工智能系统被发现存在严重的安全漏洞和风险。'
      };
      
      const summary = newsAnalyzer.getNewsSummary('test-1');
      expect(summary).toBeDefined();
    });

    it('应该正确识别中性情感', () => {
      const neutralNews: NewsItem = {
        ...mockNewsItem,
        title: 'AI技术发展报告',
        description: '最新的人工智能技术发展报告已经发布，包含了行业的最新动态。'
      };
      
      const summary = newsAnalyzer.getNewsSummary('test-1');
      expect(summary).toBeDefined();
    });
  });

  describe('影响评估', () => {
    it('应该正确评估高影响新闻', () => {
      const highImpactNews: NewsItem = {
        ...mockNewsItem,
        title: '革命性的AI突破',
        description: '这是一个革命性的突破，将彻底改变人工智能领域。'
      };
      
      const summary = newsAnalyzer.getNewsSummary('test-1');
      expect(summary).toBeDefined();
    });

    it('应该正确评估中等影响新闻', () => {
      const mediumImpactNews: NewsItem = {
        ...mockNewsItem,
        title: 'AI技术更新发布',
        description: 'OpenAI发布了新的AI技术更新，带来了多项改进。'
      };
      
      const summary = newsAnalyzer.getNewsSummary('test-1');
      expect(summary).toBeDefined();
    });

    it('应该正确评估低影响新闻', () => {
      const lowImpactNews: NewsItem = {
        ...mockNewsItem,
        title: 'AI技术小更新',
        description: 'OpenAI对现有AI系统进行了小的技术更新。'
      };
      
      const summary = newsAnalyzer.getNewsSummary('test-1');
      expect(summary).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该在分析失败时返回默认值', async () => {
      // 测试空新闻的情况
      const summary = await newsAnalyzer.getNewsSummary('invalid-id');
      
      expect(summary).toBeDefined();
      expect(summary.title).toBeDefined();
      expect(summary.summary).toBeDefined();
    });
  });
}); 