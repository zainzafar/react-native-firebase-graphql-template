import { PrismaClient } from '@prisma/client';
import { requirePermission } from '../../../rbac/core';
import type { AuthContextUser } from '../../../../services/firebaseAdmin';

const prisma = new PrismaClient();

type AdminContext = { prisma: PrismaClient; user: AuthContextUser };

type AppPlatform = 'ios' | 'android';

function toAppSettings(rule: any, platform: AppPlatform) {
  if (!rule) {
    return {
      platform,
      minVersion: '0.0.0',
      latestVersion: '0.0.0',
      enforced: false,
      forceAt: null,
      message: null,
      storeUrl: 'https://example.com'
    };
  }
  return {
    platform: rule.platform,
    minVersion: rule.minVersion,
    latestVersion: rule.latestVersion,
    enforced: rule.enforced,
    forceAt: rule.forceAt ? rule.forceAt.toISOString?.() ?? rule.forceAt : null,
    message: rule.message,
    storeUrl: rule.storeUrl
  };
}

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
  adminCreateAppVersionRule: async (_: any, { input }: any, ctx: AdminContext) => {
    requirePermission(ctx.user, 'ADMIN_APP_RELEASES_MANAGE');
    
    const result = await prisma.$transaction(async (tx) => {
      // If setting as active, deactivate other rules for this platform first
      if (input.isActive) {
        await tx.appVersionRule.updateMany({
          where: { platform: input.platform, isActive: true },
          data: { isActive: false }
        });
      }
      
      const created = await tx.appVersionRule.create({
        data: {
          platform: input.platform,
          minVersion: input.minVersion,
          latestVersion: input.latestVersion,
          enforced: input.enforced ?? false,
          forceAt: input.forceAt ? new Date(input.forceAt) : null,
          message: input.message ?? null,
          storeUrl: input.storeUrl,
          isActive: !!input.isActive
        }
      });
      
      return created;
    });
    
    return toAppSettings(result, result.platform);
  },

  adminUpdateAppVersionRule: async (_: any, args: { id: string; input: any }, ctx: AdminContext) => {
    requirePermission(ctx.user, 'ADMIN_APP_RELEASES_MANAGE');
    
    // Check if rule exists
    const existingRule = await prisma.appVersionRule.findUnique({
      where: { id: args.id }
    });
    
    if (!existingRule) {
      throw new Error('App version rule not found');
    }
    
    const result = await prisma.$transaction(async (tx) => {
      // If setting as active, deactivate other rules for this platform first
      if (args.input.isActive && !existingRule.isActive) {
        await tx.appVersionRule.updateMany({
          where: { platform: existingRule.platform, isActive: true },
          data: { isActive: false }
        });
      }
      
      // Prepare update data
      const updateData: any = {};
      if (args.input.minVersion !== undefined) updateData.minVersion = args.input.minVersion;
      if (args.input.latestVersion !== undefined) updateData.latestVersion = args.input.latestVersion;
      if (args.input.enforced !== undefined) updateData.enforced = args.input.enforced;
      if (args.input.forceAt !== undefined) updateData.forceAt = args.input.forceAt ? new Date(args.input.forceAt) : null;
      if (args.input.message !== undefined) updateData.message = args.input.message;
      if (args.input.storeUrl !== undefined) updateData.storeUrl = args.input.storeUrl;
      if (args.input.isActive !== undefined) updateData.isActive = args.input.isActive;
      
      const updated = await tx.appVersionRule.update({
        where: { id: args.id },
        data: updateData
      });
      
      return updated;
    });
    
    return toAppVersionRule(result);
  },

  adminDeleteAppVersionRule: async (_: any, args: { id: string }, ctx: AdminContext) => {
    requirePermission(ctx.user, 'ADMIN_APP_RELEASES_MANAGE');
    
    // Check if rule exists
    const existingRule = await prisma.appVersionRule.findUnique({
      where: { id: args.id }
    });
    
    if (!existingRule) {
      throw new Error('App version rule not found');
    }
    
    // Prevent deletion of active rules
    if (existingRule.isActive) {
      throw new Error('Cannot delete an active app version rule. Deactivate it first.');
    }
    
    await prisma.appVersionRule.delete({
      where: { id: args.id }
    });
    
    return true;
  },

};
