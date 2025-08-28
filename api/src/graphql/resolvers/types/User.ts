import type { PrismaClient } from '@prisma/client';
import { resolveUserPermissions } from '../../rbac';
import type { AuthContextUser } from '../../../services/firebaseAdmin';

export default {
  User: {
    roles: async (parent: any, _args: unknown, ctx: { prisma: PrismaClient; user: AuthContextUser | null }) => {
      // If user is requesting their own data, use the auth context
      if (ctx.user && parent?.id === ctx.user.id) {
        return ctx.user.roles;
      }

      if (!parent?.id) return [];
      const rows = await ctx.prisma.userRole.findMany({ 
        where: { userId: parent.id },
        include: { role: true }
      });
      return rows.map((r) => r.role);
    },
    permissions: async (parent: any, _args: unknown, ctx: { prisma: PrismaClient; user: AuthContextUser | null }) => {
      // If user is requesting their own data, use the auth context
      if (ctx.user && parent?.id === ctx.user.id) {
        return ctx.user.permissions;
      }
      
      if (!parent?.id) return [];
      
      // Use the same function that resolves permissions from both roles and direct assignments
      return await resolveUserPermissions(ctx.prisma, parent.id);
    },
  },
};


