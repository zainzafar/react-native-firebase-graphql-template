import type { PrismaClient } from '@prisma/client';
import { resolveUserPermissions } from '../../rbac';

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
    permissions: async (parent: any, _args: unknown, ctx: { prisma: PrismaClient }) => {
      const parentPermissions = parent?.permissions;
      if (Array.isArray(parentPermissions)) {
        if (parentPermissions.length === 0) return [];
        if (typeof parentPermissions[0] === 'string') return parentPermissions as string[];
        if (typeof parentPermissions[0] === 'object') return (parentPermissions as any[]).map((r) => r.permission);
      }
      
      if (!parent?.id) return [];
      
      // Use the same function that resolves permissions from both roles and direct assignments
      return await resolveUserPermissions(ctx.prisma, parent.id);
    },
  },
};


