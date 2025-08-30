import type { PrismaClient } from '@prisma/client';
import type { AuthContextUser } from '../services/firebaseAdmin';
import { GraphQLError } from 'graphql';

type Ctx = { user: AuthContextUser | null; prisma: PrismaClient };

export async function hasPermission(ctx: Ctx, permissionName: string): Promise<boolean> {
  if (!ctx.user?.permissions) return false;
  return ctx.user.permissions.includes(permissionName);
}

export async function requirePermission(ctx: Ctx, permissionName: string): Promise<void> {
  const ok = await hasPermission(ctx, permissionName);
  if (!ok) throw new GraphQLError('Forbidden', {
    extensions: {
      code: 'FORBIDDEN',
    },
  });
}

// Helper function to get all permissions for a user (used during auth context creation)
export async function resolveUserPermissions(prisma: PrismaClient, userId: string): Promise<string[]> {
  const permissions = new Set<string>();
  
  // Get direct user permissions
  const userPermissions = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true }
  });
  userPermissions.forEach(up => permissions.add(up.permission.name));
  
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
      },
      include: { permission: true }
    });
    rolePermissions.forEach(rp => permissions.add(rp.permission.name));
  }
  
  return Array.from(permissions);
}

// Utility function to create a new permission
export async function createPermission(
  prisma: PrismaClient, 
  name: string, 
  description?: string
): Promise<{ id: string; name: string; description: string | null }> {
  return await prisma.permission.create({
    data: { name, description }
  });
}

// Utility function to grant a permission to a role
export async function grantPermissionToRole(
  prisma: PrismaClient,
  roleName: string,
  permissionName: string
): Promise<void> {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
  
  if (!role) throw new Error(`Role '${roleName}' not found`);
  if (!permission) throw new Error(`Permission '${permissionName}' not found`);
  
  await prisma.rolePermission.upsert({
    where: { 
      roleId_permissionId: { 
        roleId: role.id, 
        permissionId: permission.id 
      } 
    },
    create: { 
      roleId: role.id, 
      permissionId: permission.id 
    },
    update: {},
  });
}

// Utility function to grant a permission directly to a user
export async function grantPermissionToUser(
  prisma: PrismaClient,
  userId: string,
  permissionName: string
): Promise<void> {
  const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
  
  if (!permission) throw new Error(`Permission '${permissionName}' not found`);
  
  await prisma.userPermission.upsert({
    where: { 
      userId_permissionId: { 
        userId, 
        permissionId: permission.id 
      } 
    },
    create: { 
      userId, 
      permissionId: permission.id 
    },
    update: {},
  });
}


