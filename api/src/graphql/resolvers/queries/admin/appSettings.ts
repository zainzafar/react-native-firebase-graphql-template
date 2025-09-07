import { PrismaClient } from '@prisma/client';
import { requirePermission } from '../../../rbac/core';
import type { AuthContextUser } from '../../../../services/firebaseAdmin';

const prisma = new PrismaClient();

type AdminContext = { prisma: PrismaClient; user: AuthContextUser };

type AppPlatform = 'ios' | 'android';

function toAppVersionRule(rule: any) {
  return {
    id: rule.id,
    platform: rule.platform,
    minVersion: rule.minVersion,
    latestVersion: rule.latestVersion,
    enforced: rule.enforced,
    forceAt: rule.forceAt ? rule.forceAt.toISOString?.() ?? rule.forceAt : null,
    message: rule.message,
    storeUrl: rule.storeUrl,
    isActive: rule.isActive,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt
  };
}

export default {
  adminListAppVersionRules: async (_: any, args: { platform?: AppPlatform }, ctx: AdminContext) => {
    requirePermission(ctx.user, 'ADMIN_APP_RELEASES_VIEW');
    
    const where = args.platform ? { platform: args.platform } : {};
    
    const rules = await prisma.appVersionRule.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return rules.map(toAppVersionRule);
  },

  adminGetAppVersionRule: async (_: any, args: { id: string }, ctx: AdminContext) => {
    requirePermission(ctx.user, 'ADMIN_APP_RELEASES_VIEW');
    
    const rule = await prisma.appVersionRule.findUnique({
      where: { id: args.id }
    });
    
    if (!rule) {
      return null;
    }
    
    return toAppVersionRule(rule);
  }
};
