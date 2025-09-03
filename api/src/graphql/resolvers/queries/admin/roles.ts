import type { PrismaClient } from '@prisma/client';
import { requirePermission, canManageRoleDelegationMatrix, requireAssignPermission, requireAssignRole } from '../../../rbac';
import { AuthContextUser } from '../../../../services/firebaseAdmin';

export default {
  adminListManageableRoles: async (
    _parent: unknown,
    _args: {},
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    requirePermission(ctx.user, 'ADMIN_ROLES_VIEW');
    
    const allRoles = await ctx.prisma.role.findMany({ 
      orderBy: { name: 'asc' },
    });
    
    // Filter roles based on management permissions
    const filterableRoles = await Promise.all(
      allRoles.map(async (role) => {
        // Check if user can manage this role (includes ownership check)
        const canManage = await canManageRoleDelegationMatrix(ctx.prisma, ctx.user.id, role.id);
        return canManage ? role : null;
      })
    );
    
    return filterableRoles.filter(Boolean);
  },

  adminListAssignableRoles: async (
    _parent: unknown,
    _args: {},
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    requirePermission(ctx.user, 'ADMIN_ROLES_VIEW');
    
    const allRoles = await ctx.prisma.role.findMany({ 
      orderBy: { name: 'asc' },
    });
    
    // Filter roles based on assignment permissions AND no-escalation
    const filterableRoles = await Promise.all(
      allRoles.map(async (role) => {
        try {
          await requireAssignRole(ctx.prisma, ctx.user.id, role.id);
          return role;
        } catch {
          return null; // User can't assign this role (either no delegation rights or doesn't possess required permissions)
        }
      })
    );
    
    return filterableRoles.filter(Boolean);
  },

  adminGetRole: async (
    _parent: unknown,
    args: { id: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    requirePermission(ctx.user, 'ADMIN_ROLES_VIEW');
    
    const role = await ctx.prisma.role.findUnique({
      where: { id: args.id },
    });
    
    if (!role) {
      return null;
    }
    
    // Check if user can manage this role (same logic as adminListRoles)
    const canManage = await canManageRoleDelegationMatrix(ctx.prisma, ctx.user.id, role.id);
    if (canManage) {
      return role;
    }
    
    // User cannot access this role
    return null;
  },

  adminListAssignablePermissions: async (
    _parent: unknown,
    _args: {},
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    requirePermission(ctx.user, 'ADMIN_PERMISSIONS_VIEW');
    
    const allPermissions = await ctx.prisma.permission.findMany({ orderBy: { name: 'asc' } });
    
    // Filter permissions based on delegation AND possession
    const filterablePermissions = await Promise.all(
      allPermissions.map(async (permission) => {
        try {
          await requireAssignPermission(ctx.prisma, ctx.user.id, permission.id);
          return permission;
        } catch {
          return null; // User can't grant this permission (either no delegation rights or doesn't possess it)
        }
      })
    );
    
    return filterablePermissions.filter(Boolean);
  },
};
