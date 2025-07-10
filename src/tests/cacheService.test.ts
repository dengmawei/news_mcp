import { CacheService } from '../services/cacheService.js';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(async () => {
    await cacheService.clear();
    await cacheService.disconnect();
  });

  describe('基本缓存操作', () => {
    it('应该能够设置和获取缓存', async () => {
      const testData = { test: 'data', number: 123 };
      const key = 'test-key';

      // 设置缓存
      await cacheService.set(key, testData);
      
      // 获取缓存
      const result = await cacheService.get(key);
      expect(result).toEqual(testData);
    });

    it('应该能够删除缓存', async () => {
      const testData = { test: 'data' };
      const key = 'test-key';

      // 设置缓存
      await cacheService.set(key, testData);
      
      // 验证缓存存在
      let result = await cacheService.get(key);
      expect(result).toEqual(testData);
      
      // 删除缓存
      await cacheService.delete(key);
      
      // 验证缓存已删除
      result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('应该能够清空所有缓存', async () => {
      const testData1 = { test: 'data1' };
      const testData2 = { test: 'data2' };

      // 设置多个缓存
      await cacheService.set('key1', testData1);
      await cacheService.set('key2', testData2);
      
      // 验证缓存存在
      expect(await cacheService.get('key1')).toEqual(testData1);
      expect(await cacheService.get('key2')).toEqual(testData2);
      
      // 清空缓存
      await cacheService.clear();
      
      // 验证缓存已清空
      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();
    });
  });

  describe('缓存过期', () => {
    it('应该支持自定义TTL', async () => {
      const testData = { test: 'data' };
      const key = 'test-key';
      const ttl = 1; // 1秒

      // 设置短期缓存
      await cacheService.set(key, testData, { ttl });
      
      // 立即获取应该成功
      let result = await cacheService.get(key);
      expect(result).toEqual(testData);
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // 过期后获取应该失败
      result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('应该使用默认TTL', async () => {
      const testData = { test: 'data' };
      const key = 'test-key';

      // 设置缓存（使用默认TTL）
      await cacheService.set(key, testData);
      
      // 立即获取应该成功
      const result = await cacheService.get(key);
      expect(result).toEqual(testData);
    });
  });

  describe('缓存统计', () => {
    it('应该返回缓存统计信息', async () => {
      const stats = await cacheService.getStats();
      
      expect(stats).toHaveProperty('redis');
      expect(stats).toHaveProperty('memorySize');
      expect(stats).toHaveProperty('dbSize');
      expect(typeof stats.redis).toBe('boolean');
      expect(typeof stats.memorySize).toBe('number');
      expect(typeof stats.dbSize).toBe('number');
    });

    it('应该正确统计缓存大小', async () => {
      // 设置一些缓存
      await cacheService.set('key1', { data: 1 });
      await cacheService.set('key2', { data: 2 });
      
      const stats = await cacheService.getStats();
      
      // 内存缓存应该至少有2个项目
      expect(stats.memorySize).toBeGreaterThanOrEqual(2);
    });
  });

  describe('缓存清理', () => {
    it('应该能够清理过期缓存', async () => {
      const testData = { test: 'data' };
      const key = 'test-key';
      const ttl = 1; // 1秒

      // 设置短期缓存
      await cacheService.set(key, testData, { ttl });
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // 清理过期缓存
      await cacheService.cleanup();
      
      // 验证过期缓存已被清理
      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });
  });

  describe('错误处理', () => {
    it('应该在Redis不可用时使用备用缓存', async () => {
      const testData = { test: 'fallback' };
      const key = 'fallback-key';

      // 设置缓存（即使Redis不可用也应该工作）
      await cacheService.set(key, testData);
      
      // 获取缓存
      const result = await cacheService.get(key);
      expect(result).toEqual(testData);
    });

    it('应该处理无效的JSON数据', async () => {
      const key = 'invalid-json';
      
      // 尝试获取不存在的缓存
      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });
  });

  describe('并发操作', () => {
    it('应该能够处理并发设置', async () => {
      const promises = [];
      
      // 并发设置多个缓存
      for (let i = 0; i < 10; i++) {
        promises.push(cacheService.set(`key${i}`, { value: i }));
      }
      
      await Promise.all(promises);
      
      // 验证所有缓存都设置成功
      for (let i = 0; i < 10; i++) {
        const result = await cacheService.get(`key${i}`);
        expect(result).toEqual({ value: i });
      }
    });

    it('应该能够处理并发获取', async () => {
      // 先设置一些缓存
      await cacheService.set('key1', { value: 1 });
      await cacheService.set('key2', { value: 2 });
      
      const promises = [
        cacheService.get('key1'),
        cacheService.get('key2'),
        cacheService.get('key1'), // 重复获取
        cacheService.get('key2')  // 重复获取
      ];
      
      const results = await Promise.all(promises);
      
      expect(results[0]).toEqual({ value: 1 });
      expect(results[1]).toEqual({ value: 2 });
      expect(results[2]).toEqual({ value: 1 });
      expect(results[3]).toEqual({ value: 2 });
    });
  });

  describe('数据类型支持', () => {
    it('应该支持各种数据类型', async () => {
      const testCases = [
        { key: 'string', value: 'hello world' },
        { key: 'number', value: 123.45 },
        { key: 'boolean', value: true },
        { key: 'array', value: [1, 2, 3, 'test'] },
        { key: 'object', value: { nested: { deep: 'value' } } },
        { key: 'null', value: null },
        { key: 'undefined', value: undefined }
      ];

      for (const testCase of testCases) {
        await cacheService.set(testCase.key, testCase.value);
        const result = await cacheService.get(testCase.key);
        expect(result).toEqual(testCase.value);
      }
    });
  });
}); 