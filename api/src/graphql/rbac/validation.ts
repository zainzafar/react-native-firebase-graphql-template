/**
 * RBAC Validation Module
 * 
 * This module implements no-escalation validation for the RBAC system, ensuring
 * that actors cannot delegate permissions or roles they do not possess.
 * 
 * Key Responsibilities:
 * - No-escalation validation for role assignments
 * - No-escalation validation for permission assignments
 * - Validation for wildcard (ALL) grants
 * - Integration with capabilities.ts for user permission resolution
 * 
 * No-Escalation Principle:
 * - Actors can only delegate what they currently possess
 * - This prevents privilege escalation attacks
 * - Validation is enforced at assignment time, not grant rule creation time
 * 
 * @see permissions.ts for permission logic that uses these validations
 * @see capabilities.ts for user permission/role resolution
 * @see core.ts for transaction types
 */
import { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from './core';
import { GraphQLError } from 'graphql';
import { resolveUserPermissions, getUserRoleId } from './capabilities';

/**
 * No-escalation validation: Ensure that granting a role doesn't create escalation.
 * Actor must possess every permission contained in the target role.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param granterUserId - ID of the user attempting to grant the role
 * @param targetRoleId - ID of the role being granted
 * @returns Promise<void> - throws GraphQLError if escalation would occur
 * @throws {GraphQLError} BAD_USER_INPUT - when target role is not found
 * @throws {GraphQLError} FORBIDDEN - when actor lacks required permissions (escalation detected)
 * @remarks 
 * - No-escalation principle: actors can only delegate what they possess
 * - Validation: actor must possess ALL permissions in the target role
 * - Enforced at assignment time, not grant rule creation time
 * @see resolveUserPermissions for actor permission resolution
 * @see permissions.ts for permission logic that uses this validation
 */
export async function validateRoleGrantNoEscalation(
  prisma: PrismaClient | PrismaTransaction,
  granterUserId: string,
  targetRoleId: string
): Promise<void> {
  // Load target role's permissions
  const targetRole = await prisma.role.findUnique({
    where: { id: targetRoleId },
    include: { permissions: { include: { permission: true } } }
  });

  if (!targetRole) {
    throw new GraphQLError('Target role not found', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  // If role has no permissions, no escalation possible
  if (targetRole.permissions.length === 0) {
    return;
  }

  // Resolve actor's effective permissions
  const actorPermissions = new Set(await resolveUserPermissions(prisma, granterUserId));

  // Check if actor possesses every permission in the target role
  for (const rolePerm of targetRole.permissions) {
    if (!actorPermissions.has(rolePerm.permission.name)) {
      throw new GraphQLError(
        `Cannot grant role '${targetRole.name}' - you do not possess permission '${rolePerm.permission.name}'`,
        { extensions: { code: 'FORBIDDEN' } }
      );
    }
  }
}

/**
 * No-escalation validation: Ensure that granting ALL role grants doesn't create escalation.
 * Actor must possess ALL permissions in the system.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param granterUserId - ID of the user attempting to grant ALL roles
 * @returns Promise<void> - throws GraphQLError if escalation would occur
 * @throws {GraphQLError} FORBIDDEN - when actor lacks required permissions (escalation detected)
 * @remarks 
 * - No-escalation principle: actors can only delegate what they possess
 * - Validation: actor must possess ALL permissions in the system
 * - Critical check: prevents global privilege escalation
 * - Enforced at assignment time, not grant rule creation time
 * @see resolveUserPermissions for actor permission resolution
 * @see permissions.ts for permission logic that uses this validation
 */
export async function validateRoleGrantAllNoEscalation(
  prisma: PrismaClient | PrismaTransaction, 
  granterUserId: string
): Promise<void> {
  // Get all permissions in the system
  const allPermissions = await prisma.permission.findMany({
    select: { name: true }
  });

  if (allPermissions.length === 0) {
    return; // No permissions to escalate
  }

  // Resolve actor's effective permissions
  const actorPermissions = new Set(await resolveUserPermissions(prisma, granterUserId));

  // Check if actor possesses every permission in the system
  for (const perm of allPermissions) {
    if (!actorPermissions.has(perm.name)) {
      throw new GraphQLError(
        `Cannot grant ALL roles - you do not possess permission '${perm.name}'`,
        { extensions: { code: 'FORBIDDEN' } }
      );
    }
  }
}

/**
 * No-escalation validation: Ensure that granting a permission doesn't create escalation.
 * Actor must have delegation rights and appropriate scope for the target permission.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param granterUserId - ID of the user attempting to grant the permission
 * @param targetPermissionId - ID of the permission being granted
 * @returns Promise<void> - throws GraphQLError if escalation would occur
 * @throws {GraphQLError} FORBIDDEN - when actor lacks delegation rights or appropriate scope
 * @remarks 
 * - Delegation check: actor must have canAssign rights for the target permission
 * - Scope validation: actor must have either wildcard (ALL) or specific (PERMISSION) scope
 * - No-escalation: enforced through delegation matrix, not possession checks
 * - Enforced at assignment time, not grant rule creation time
 * @see getUserRoleId for actor role resolution
 * @see permissions.ts for permission logic that uses this validation
 */
export async function validatePermissionGrantNoEscalation(
  prisma: PrismaClient | PrismaTransaction,
  granterUserId: string,
  targetPermissionId: string
): Promise<void> {
  const granterRoleId = await getUserRoleId(prisma, granterUserId);
  if (!granterRoleId) {
    throw new GraphQLError('Granter has no role', { extensions: { code: 'FORBIDDEN' } });
  }

  // Get all permissions the granter can grant
  const granterGrantablePermissions = await prisma.permissionGrantRule.findMany({
    where: {
      granterRoleId,
      canAssign: true,
    },
    include: { permission: true }
  });

  // Check if granter can grant the target permission
  const canGrantTarget = granterGrantablePermissions.some(rule => 
    rule.scope === 'ALL' || 
    (rule.scope === 'PERMISSION' && rule.permissionId === targetPermissionId)
  );

  if (!canGrantTarget) {
    throw new GraphQLError('Granter cannot grant the target permission', {
      extensions: { code: 'FORBIDDEN' }
    });
  }

  // Check if granter has wildcard capability
  const hasWildcard = granterGrantablePermissions.some(rule => rule.scope === 'ALL');
  
  if (!hasWildcard) {
    throw new GraphQLError('Granter does not have wildcard permission grant capability', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}
