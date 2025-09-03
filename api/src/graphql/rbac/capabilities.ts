/**
 * RBAC Capabilities Module
 * 
 * This module implements user capability resolution for the RBAC system, handling
 * the resolution of user permissions and roles from the database.
 * 
 * Key Responsibilities:
 * - User permission resolution (role + direct grants)
 * - User role resolution (single-role model)
 * - Integration with the database layer for user state
 * 
 * Single-Role User Model:
 * - Each user has at most one role
 * - Users can also have direct permissions (independent of their role)
 * - Role permissions and direct permissions are combined for effective permissions
 * 
 * Permission Resolution:
 * - Always collects direct user permissions (even if no role)
 * - Collects role permissions if user has a role
 * - Combines and deduplicates all permissions
 * - Used by validation.ts for no-escalation checks
 * 
 * @see permissions.ts for permission logic that uses these capabilities
 * @see validation.ts for no-escalation validation
 * @see core.ts for transaction types
 */
import { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from './core';

/**
 * Permission resolution: Resolve all effective permissions for a user.
 * Combines permissions from their role and direct grants.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param userId - ID of the user whose permissions are being resolved
 * @returns Promise<string[]> - array of permission names the user possesses
 * @remarks 
 * - Always collects direct user permissions (even if no role)
 * - Collects role permissions if user has a role
 * - Combines and deduplicates all permissions
 * - Single-role model: each user has at most one role
 * - Used by validation.ts for no-escalation checks
 * @see getUserRoleId for single-role user model
 * @see validation.ts for no-escalation validation
 */
export async function resolveUserPermissions(
  prisma: PrismaClient | PrismaTransaction, 
  userId: string
): Promise<string[]> {
  // Always get direct user permissions (even if no role)
  const directPermissions = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true }
  });

  // Get permissions from user's role if they have one
  const userRole = await prisma.userRole.findFirst({
    where: { userId },
    select: { roleId: true }
  });

  let rolePermissions: any[] = [];
  if (userRole) {
    rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: userRole.roleId },
      include: { permission: true }
    });
  }

  // Combine and deduplicate
  const allPermissions = [
    ...rolePermissions.map(rp => rp.permission.name),
    ...directPermissions.map(up => up.permission.name)
  ];

  return [...new Set(allPermissions)];
}

/**
 * Role resolution: Get the single role ID for a user.
 * Implements the single-role user model.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param userId - ID of the user whose role is being resolved
 * @returns Promise<string | null> - role ID if user has a role, null otherwise
 * @remarks 
 * - Single-role model: each user has at most one role
 * - Returns null if user has no role assigned
 * - Used by delegation.ts for delegation matrix lookups
 * - Used by validation.ts for no-escalation checks
 * @see resolveUserPermissions for user permission resolution
 * @see delegation.ts for delegation matrix logic
 */
export async function getUserRoleId(
  prisma: PrismaClient | PrismaTransaction, 
  userId: string
): Promise<string | null> {
  const userRole = await prisma.userRole.findFirst({
    where: { userId },
    select: { roleId: true }
  });
  return userRole?.roleId || null;
}
