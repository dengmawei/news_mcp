// Prisma 客户端包装器，解决 ES 模块兼容性问题
let prismaClient: any = null;

export async function getPrismaClient() {
  if (!prismaClient) {
    try {
      // 尝试 ES 模块导入
      const { PrismaClient } = await import('@prisma/client');
      prismaClient = new PrismaClient();
    } catch (error) {
      console.error('Prisma 客户端初始化失败:', error);
      throw error;
    }
  }
  return prismaClient;
}

export async function disconnectPrisma() {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}

// 导出类型（如果需要）
export type PrismaClientType = Awaited<ReturnType<typeof getPrismaClient>>; 