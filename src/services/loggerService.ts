import winston from 'winston';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    // 确保日志目录存在
    const logDir = join(process.cwd(), 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    // 创建日志格式
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // 创建控制台格式
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
      })
    );

    // 创建logger实例
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        // 错误日志文件
        new winston.transports.File({
          filename: join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // 所有日志文件
        new winston.transports.File({
          filename: join(logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // 开发环境下添加控制台输出
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: consoleFormat
      }));
    }
  }

  // 信息日志
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  // 警告日志
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  // 错误日志
  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  // 调试日志
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  // 新闻相关日志
  logNewsFetch(source: string, count: number, duration: number): void {
    this.info('新闻获取完成', {
      source,
      count,
      duration: `${duration}ms`,
      type: 'news_fetch'
    });
  }

  logNewsError(source: string, error: Error): void {
    this.error('新闻获取失败', {
      source,
      error: error.message,
      stack: error.stack,
      type: 'news_error'
    });
  }

  logCacheHit(key: string, source: 'redis' | 'memory' | 'database'): void {
    this.debug('缓存命中', {
      key,
      source,
      type: 'cache_hit'
    });
  }

  logCacheMiss(key: string): void {
    this.debug('缓存未命中', {
      key,
      type: 'cache_miss'
    });
  }

  logDatabaseOperation(operation: string, table: string, duration: number): void {
    this.debug('数据库操作', {
      operation,
      table,
      duration: `${duration}ms`,
      type: 'database_operation'
    });
  }

  // 性能监控日志
  logPerformance(operation: string, duration: number, meta?: any): void {
    this.info('性能监控', {
      operation,
      duration: `${duration}ms`,
      ...meta,
      type: 'performance'
    });
  }

  // 获取logger实例（用于高级用法）
  getLogger(): winston.Logger {
    return this.logger;
  }
} 