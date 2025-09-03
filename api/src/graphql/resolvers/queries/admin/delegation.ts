import type { PrismaClient } from '@prisma/client';
import { requirePermission, getWildcardRoleRights } from '../../../rbac';
import { AuthContextUser } from '../../../../services/firebaseAdmin';

export default {
  // Delegation matrix queries
  adminListRoleGrantRules: async (
    _parent: unknown,
    _args: {},
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    requirePermission(ctx.user, 'ADMIN_ROLE_GRANT_RULES_VIEW');
    
    // Check if caller has global role management wildcard
    const hasGlobalRoleManage = (await getWildcardRoleRights(ctx.prisma, ctx.user.id)).canManage;
    
    let whereClause = {};
    
    if (!hasGlobalRoleManage) {
      // Get caller's role ID (assuming 1 role per user)
      const userRole = await ctx.prisma.userRole.findFirst({
        where: { userId: ctx.user.id },
        select: { roleId: true }
      });
      
      if (!userRole) {
        return []; // No role, no visibility
      }
      
      // Get roles the caller can manage through specific grants
      const manageableRoles = await ctx.prisma.roleGrantRule.findMany({
        where: {
          granterRoleId: userRole.roleId,
          scope: 'ROLE',
          canManage: true
        },
        select: { granteeRoleId: true }
      });
      
      const manageableRoleIds = manageableRoles
        .map(r => r.granteeRoleId)
        .filter((id): id is string => id !== null);
      
      if (manageableRoleIds.length === 0) {
        return []; // No manageable roles, no visibility
      }
      
      // Filter to only show rules where caller can manage the granter role
      whereClause = {
        granterRoleId: { in: manageableRoleIds }
      };
    }
    
    const rules = await ctx.prisma.roleGrantRule.findMany({
      where: whereClause,
      include: {
        granterRole: true,
        granteeRole: true,
      },
      orderBy: [
        { granterRole: { name: 'asc' } },
        { scope: 'asc' },
        { granteeRole: { name: 'asc' } },
      ],
    });
    
    return rules;
  },

  adminListPermissionGrantRules: async (
    _parent: unknown,
    _args: {},
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    requirePermission(ctx.user, 'ADMIN_PERMISSION_GRANT_RULES_VIEW');
    
    // Visibility will be based on role governance only
    const hasGlobalPermissionManage = false;
    
    let whereClause = {};
    
    if (!hasGlobalPermissionManage) {
      // Get caller's role ID (assuming 1 role per user)
      const userRole = await ctx.prisma.userRole.findFirst({
        where: { userId: ctx.user.id },
        select: { roleId: true }
      });
      
      if (!userRole) {
        return []; // No role, no visibility
      }
      
      // Get roles the caller can manage through role-level manage rights
      const manageableRoles = await ctx.prisma.roleGrantRule.findMany({
        where: {
          granterRoleId: userRole.roleId,
          scope: 'ROLE',
          canManage: true
        },
        select: { granteeRoleId: true }
      });
      
      const manageableRoleIds = manageableRoles
        .map(r => r.granteeRoleId)
        .filter((id): id is string => id !== null);
      
      if (manageableRoleIds.length === 0) {
        return []; // No manageable roles, no visibility
      }
      
      // Filter to only show rules where caller can manage the granter role
      whereClause = {
        granterRoleId: { in: manageableRoleIds }
      };
    }
    
    const rules = await ctx.prisma.permissionGrantRule.findMany({
      where: whereClause,
      include: {
        granterRole: true,
        permission: true,
      },
      orderBy: [
        { granterRole: { name: 'asc' } },
        { scope: 'asc' },
        { permission: { name: 'asc' } },
      ],
    });
    
    return rules;
  },
};
