// Prisma 客户端包装器，解决 ES 模块兼容性问题
let prismaClient: any = null;

export async function getPrismaClient() {
  if (!prismaClient) {
    try {
      // 使用 createRequire 来在 ES 模块中导入 CommonJS 模块
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const { PrismaClient } = require('@prisma/client');
      
      prismaClient = new PrismaClient();
      console.log('Prisma 客户端初始化成功');
    } catch (error) {
      console.error('Prisma 客户端初始化失败:', error);
      throw new Error(`无法初始化 Prisma 客户端: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return prismaClient;
}

export async function disconnectPrisma() {
  if (prismaClient) {
    try {
      await prismaClient.$disconnect();
      prismaClient = null;
      console.log('Prisma 客户端已断开连接');
    } catch (error) {
      console.error('断开 Prisma 连接时出错:', error instanceof Error ? error.message : String(error));
    }
  }
}

// 导出类型（如果需要）
export type PrismaClientType = Awaited<ReturnType<typeof getPrismaClient>>; 