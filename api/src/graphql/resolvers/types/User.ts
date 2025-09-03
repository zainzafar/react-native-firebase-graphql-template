import type { PrismaClient } from '@prisma/client';
import { resolveUserPermissions } from '../../rbac';
import type { AuthContextUser } from '../../../services/firebaseAdmin';

export default {
  User: {
    role: async (parent: any, _args: unknown, ctx: { prisma: PrismaClient; user: AuthContextUser | null }) => {
      // If user is requesting their own data, use the auth context
      if (ctx.user && parent?.id === ctx.user.id) {
        return ctx.user.role;
      }

      if (!parent?.id) return null;
      const userRole = await ctx.prisma.userRole.findUnique({ 
        where: { userId: parent.id },
        include: { role: true }
      });
      return userRole?.role || null;
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
    identities: async (parent: any, _args: unknown, ctx: { prisma: PrismaClient; user: AuthContextUser | null }) => {
      // If user is requesting their own data, use the auth context
      if (ctx.user && parent?.id === ctx.user.id) {
        return ctx.user.identities || [];
      }
      
      if (!parent?.id) return [];

      // Fetch identities from database
      const identities = await ctx.prisma.userIdentity.findMany({
        where: { userId: parent.id }
      });
      
      return identities;
    },
    
    ownedRoles: async (parent: any, _args: unknown, ctx: { prisma: PrismaClient; user: AuthContextUser | null }) => {
      if (!parent?.id) return [];
      const roles = await ctx.prisma.role.findMany({
        where: { createdByUserId: parent.id }
      });
      return roles;
    },
  },
};


