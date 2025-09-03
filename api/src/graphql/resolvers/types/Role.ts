import type { PrismaClient } from '@prisma/client';
import type { AuthContextUser } from '../../../services/firebaseAdmin';

export default {
  Role: {
    permissions: async (
      parent: any,
      _args: unknown,
      ctx: { prisma: PrismaClient; user: AuthContextUser | null }
    ) => {
      if (!parent?.id) return [];
      const rows = await ctx.prisma.rolePermission.findMany({
        where: { roleId: parent.id },
        include: { permission: true },
      });
      return rows.map((r) => r.permission);
    },

    users: async (
      parent: any,
      _args: unknown,
      ctx: { prisma: PrismaClient; user: AuthContextUser | null }
    ) => {
      if (!parent?.id) return [];
      const users = await ctx.prisma.user.findMany({
        where: { role: { roleId: parent.id } }
      });
      return users;
    },

    createdByUser: async (
      parent: any,
      _args: unknown,
      ctx: { prisma: PrismaClient; user: AuthContextUser | null }
    ) => {
      if (!parent?.createdByUserId) return null;
      const user = await ctx.prisma.user.findUnique({
        where: { id: parent.createdByUserId }
      });
      return user;
    },

    // Delegation matrix relations
    canGrantRolesRules: async (
      parent: any,
      _args: unknown,
      ctx: { prisma: PrismaClient; user: AuthContextUser | null }
    ) => {
      if (!parent?.id) return [];
      const rules = await ctx.prisma.roleGrantRule.findMany({
        where: { granterRoleId: parent.id },
        include: { granteeRole: true },
      });
      return rules;
    },

    canBeGrantedByRolesRules: async (
      parent: any,
      _args: unknown,
      ctx: { prisma: PrismaClient; user: AuthContextUser | null }
    ) => {
      if (!parent?.id) return [];
      const rules = await ctx.prisma.roleGrantRule.findMany({
        where: { granteeRoleId: parent.id },
        include: { granterRole: true },
      });
      return rules;
    },

    canGrantPermissionsRules: async (
      parent: any,
      _args: unknown,
      ctx: { prisma: PrismaClient; user: AuthContextUser | null }
    ) => {
      if (!parent?.id) return [];
      const rules = await ctx.prisma.permissionGrantRule.findMany({
        where: { granterRoleId: parent.id },
        include: { permission: true },
      });
      return rules;
    },
  },
};


