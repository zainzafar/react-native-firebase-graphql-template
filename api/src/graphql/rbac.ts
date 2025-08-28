import type { PrismaClient, Permission } from '@prisma/client';
import type { AuthContextUser } from '../services/firebaseAdmin';

type Ctx = { user: AuthContextUser | null; prisma: PrismaClient };

export async function hasPermission(ctx: Ctx, permission: Permission): Promise<boolean> {
  if (!ctx.user?.permissions) return false;
  return ctx.user.permissions.includes(permission);
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
  const userRoles = await prisma.userRole.findMany({ 
    where: { userId },
    include: { role: true }
  });
  if (userRoles.length > 0) {
    const roleIds = userRoles.map(ur => ur.roleId);
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { 
        roleId: { in: roleIds }
      }
    });
    rolePermissions.forEach(rp => permissions.add(rp.permission));
  }
  
  return Array.from(permissions);
}


