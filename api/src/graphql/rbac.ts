import type { User, PrismaClient, Role, Permission } from '@prisma/client';
import type { AuthContextUser } from '../services/firebaseAdmin';

type Ctx = { user: AuthContextUser | null; prisma: PrismaClient };

export async function hasRole(ctx: Ctx, role: Role): Promise<boolean> {
  const roles = ctx.user?.roles ?? [];
  if (Array.isArray(roles)) {
    return roles.includes(role);
  }
  if (!ctx.user?.id) return false;
  const existing = await ctx.prisma.userRole.findMany({ where: { userId: ctx.user.id } });
  return existing.some((r) => r.role === role);
}

export async function hasPermission(ctx: Ctx, permission: Permission): Promise<boolean> {
  if (!ctx.user?.permissions) return false;
  return ctx.user.permissions.includes(permission);
}

export async function requireRole(ctx: Ctx, role: Role): Promise<void> {
  const ok = await hasRole(ctx, role);
  if (!ok) throw new Error('Forbidden');
}

export async function requirePermission(ctx: Ctx, permission: Permission): Promise<void> {
  const ok = await hasPermission(ctx, permission);
  if (!ok) throw new Error('Forbidden');
}

// Helper function to get all permissions for a user (used during auth context creation)
export async function resolveUserPermissions(prisma: PrismaClient, userId: string): Promise<Permission[]> {
  const permissions = new Set<Permission>();
  
  // Get direct user permissions
  const userPermissions = await prisma.userPermission.findMany({
    where: { userId }
  });
  userPermissions.forEach(up => permissions.add(up.permission));
  
  // Get permissions through roles
  const userRoles = await prisma.userRole.findMany({ where: { userId } });
  if (userRoles.length > 0) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { 
        role: { in: userRoles.map(ur => ur.role) }
      }
    });
    rolePermissions.forEach(rp => permissions.add(rp.permission));
  }
  
  return Array.from(permissions);
}


