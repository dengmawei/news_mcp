import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

export interface CacheOptions {
  ttl?: number; // 过期时间（秒）
  prefix?: string; // 键前缀
}

export class CacheService {
  private redis: Redis | null = null;
  private prisma: PrismaClient;
  private memoryCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private readonly DEFAULT_TTL = 300; // 5分钟
  private readonly PREFIX = 'ai_news:';

  constructor() {
    this.prisma = new PrismaClient();
    this.initRedis();
  }

  private async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        await this.redis.ping();
        console.log('Redis连接成功');
      }
    } catch (error) {
      console.warn('Redis连接失败，使用内存缓存:', error);
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.PREFIX + key;

    // 尝试Redis缓存
    if (this.redis) {
      try {
        const value = await this.redis.get(fullKey);
        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        console.error('Redis获取失败:', error);
      }
    }

    // 尝试内存缓存
    const memoryEntry = this.memoryCache.get(fullKey);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      return memoryEntry.value;
    } else if (memoryEntry) {
      this.memoryCache.delete(fullKey);
    }

    // 尝试数据库缓存
    try {
      const dbEntry = await this.prisma.cacheEntry.findUnique({
        where: { key: fullKey }
      });

      if (dbEntry && dbEntry.expiresAt > new Date()) {
        const value = JSON.parse(dbEntry.value);
        
        // 同时更新内存缓存
        this.memoryCache.set(fullKey, {
          value,
          expiresAt: dbEntry.expiresAt.getTime()
        });

        return value;
      } else if (dbEntry) {
        // 删除过期条目
        await this.prisma.cacheEntry.delete({
          where: { key: fullKey }
        });
      }
    } catch (error) {
      console.error('数据库缓存获取失败:', error);
    }

    return null;
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.PREFIX + key;
    const ttl = options.ttl || this.DEFAULT_TTL;
    const expiresAt = Date.now() + ttl * 1000;

    // 设置Redis缓存
    if (this.redis) {
      try {
        await this.redis.setex(fullKey, ttl, JSON.stringify(value));
      } catch (error) {
        console.error('Redis设置失败:', error);
      }
    }

    // 设置内存缓存
    this.memoryCache.set(fullKey, {
      value,
      expiresAt
    });

    // 设置数据库缓存
    try {
      await this.prisma.cacheEntry.upsert({
        where: { key: fullKey },
        update: {
          value: JSON.stringify(value),
          expiresAt: new Date(expiresAt)
        },
        create: {
          key: fullKey,
          value: JSON.stringify(value),
          expiresAt: new Date(expiresAt)
        }
      });
    } catch (error) {
      console.error('数据库缓存设置失败:', error);
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.PREFIX + key;

    // 删除Redis缓存
    if (this.redis) {
      try {
        await this.redis.del(fullKey);
      } catch (error) {
        console.error('Redis删除失败:', error);
      }
    }

    // 删除内存缓存
    this.memoryCache.delete(fullKey);

    // 删除数据库缓存
    try {
      await this.prisma.cacheEntry.deleteMany({
        where: { key: fullKey }
      });
    } catch (error) {
      console.error('数据库缓存删除失败:', error);
    }
  }

  async clear(): Promise<void> {
    // 清空Redis缓存
    if (this.redis) {
      try {
        const keys = await this.redis.keys(this.PREFIX + '*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('Redis清空失败:', error);
      }
    }

    // 清空内存缓存
    this.memoryCache.clear();

    // 清空数据库缓存
    try {
      await this.prisma.cacheEntry.deleteMany({
        where: {
          key: {
            startsWith: this.PREFIX
          }
        }
      });
    } catch (error) {
      console.error('数据库缓存清空失败:', error);
    }
  }

  async getStats(): Promise<{
    redis: boolean;
    memorySize: number;
    dbSize: number;
  }> {
    const memorySize = this.memoryCache.size;
    let dbSize = 0;

    try {
      dbSize = await this.prisma.cacheEntry.count({
        where: {
          key: {
            startsWith: this.PREFIX
          }
        }
      });
    } catch (error) {
      console.error('获取数据库缓存统计失败:', error);
    }

    return {
      redis: this.redis !== null,
      memorySize,
      dbSize
    };
  }

  async cleanup(): Promise<void> {
    // 清理过期的内存缓存
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }

    // 清理过期的数据库缓存
    try {
      await this.prisma.cacheEntry.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      });
    } catch (error) {
      console.error('清理过期数据库缓存失败:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
    await this.prisma.$disconnect();
  }
} 