import type { PrismaClient } from '@prisma/client';

export default {
  User: {
    roles: async (parent: any, _args: unknown, ctx: { prisma: PrismaClient }) => {
      const parentRoles = parent?.roles;

      if (Array.isArray(parentRoles)) {
        if (parentRoles.length === 0) return [];
        if (typeof parentRoles[0] === 'string') return parentRoles as string[];
        if (typeof parentRoles[0] === 'object') return (parentRoles as any[]).map((r) => r.role);
      }

      if (!parent?.id) return [];
      const rows = await ctx.prisma.userRole.findMany({ where: { userId: parent.id } });
      return rows.map((r) => r.role);
    },
  },
};


