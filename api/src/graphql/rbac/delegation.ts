/**
 * RBAC Delegation Matrix Module
 * 
 * This module implements the delegation matrix logic for the RBAC system, handling
 * the delegation dimension of access control: "May I assign/revoke this thing per delegation matrix?"
 * 
 * Key Responsibilities:
 * - Delegation-only helper functions (canAssign*Delegation, canRevoke*Delegation)
 * - Governance functions for managing the delegation matrix itself
 * - Wildcard rights resolution (scope = 'ALL' grants)
 * - Lockout protection and safety checks
 * 
 * Delegation vs Governance:
 * - Delegation functions: check if actor can assign/revoke based on matrix (no possession/gov logic)
 * - Governance functions: check if actor can manage the matrix itself (CRUD on grant rules)
 * 
 * Wildcard Semantics:
 * - scope = 'ALL' rows are wildcard grants that apply to all targets
 * - Specific rows (scope = 'ROLE'/'PERMISSION') override wildcard rows
 * - DB invariants: Prisma + DB constraints ensure (ALL ⇒ targetId is NULL, specific ⇒ targetId is NOT NULL)
 * 
 * @see permissions.ts for permission logic (delegation + possession + governance bypass)
 * @see capabilities.ts for user permission/role resolution
 * @see core.ts for transaction types
 */
import { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from './core';
import { getUserRoleId } from './capabilities';

/**
 * Governance check: Determine if the actor can manage the delegation matrix for the specified role.
 * This function is strictly about governance (managing grant rules), not assignment or revocation.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param userId - ID of the user attempting to manage the delegation matrix
 * @param granterRoleId - ID of the role whose delegation matrix is being managed
 * @returns Promise<boolean> - true if the actor can manage the delegation matrix, false otherwise
 * @remarks 
 * - Governance check: actor must have canManage rights per delegation matrix
 * - This is NOT about assigning/revoking the role itself
 * - This IS about creating/updating/deleting grant rules where this role is the granter
 * @see effectiveRoleRights for the underlying delegation matrix lookup
 */
export async function canManageRoleDelegationMatrix(prisma: PrismaClient | PrismaTransaction, userId: string, granterRoleId: string): Promise<boolean> {
  const eff = await effectiveRoleRights(prisma, userId, granterRoleId);
  return eff.canManage;
}

/**
 * Wildcard rights resolution: Get the actor's wildcard role delegation rights (scope = 'ALL').
 * Returns the canAssign, canRevoke, and canManage flags for the actor's wildcard role grant rule.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param userId - ID of the user whose wildcard rights are being resolved
 * @returns Promise<{canAssign: boolean, canRevoke: boolean, canManage: boolean}> - wildcard delegation rights
 * @remarks 
 * - Wildcard rights: scope = 'ALL' grants that apply to all target roles
 * - Single-role model: each user has at most one role
 * - Returns false for all flags if user has no role or no wildcard grants
 * @see effectiveRoleRights for precedence logic (specific overrides wildcard)
 * @see getUserRoleId for single-role user model
 */
export async function getWildcardRoleRights(
  prisma: PrismaClient | PrismaTransaction,
  userId: string
): Promise<{ canAssign: boolean; canRevoke: boolean; canManage: boolean }> {
  const actorRoleId = await getUserRoleId(prisma, userId);
  if (!actorRoleId) return { canAssign: false, canRevoke: false, canManage: false };
  const wildcard = await prisma.roleGrantRule.findFirst({
    where: { granterRoleId: actorRoleId, scope: 'ALL' },
    select: { canAssign: true, canRevoke: true, canManage: true },
  });
  return {
    canAssign: wildcard?.canAssign ?? false,
    canRevoke: wildcard?.canRevoke ?? false,
    canManage: wildcard?.canManage ?? false,
  };
}

// Permission-level wildcard rights helper removed during simplification

/**
 * Governance check: Determine if the actor has wildcard role management delegation authority.
 * This means the actor's role has a grant rule with scope='ALL' and canManage=true,
 * allowing them to manage role grant rules globally.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param userId - ID of the user whose wildcard governance rights are being checked
 * @returns Promise<boolean> - true if the actor has global role management authority, false otherwise
 * @remarks 
 * - Governance check: actor must have wildcard canManage rights (scope = 'ALL')
 * - Global authority: can manage role grant rules for any role
 * - Single-role model: each user has at most one role
 * @see getWildcardRoleRights for the underlying wildcard rights lookup
 * @see getUserRoleId for single-role user model
 */
export async function actorHasWildcardRoleManageDelegator(prisma: PrismaClient | PrismaTransaction, userId: string): Promise<boolean> {
  const rights = await getWildcardRoleRights(prisma, userId);
  return rights.canManage;
}

// Permission-level wildcard manage delegator helper removed

/**
 * Governance check: Determine if a specific role provides wildcard role management.
 * This is used to identify roles that can manage other roles globally.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param roleId - ID of the role being checked for wildcard management capabilities
 * @returns Promise<boolean> - true if the role provides global role management, false otherwise
 * @remarks 
 * - Governance check: role must have wildcard canManage rights (scope = 'ALL')
 * - Global authority: can manage role grant rules for any role
 * - Critical role: used for lockout protection and safety checks
 * @see countOtherWildcardRoleManagerRoles for lockout prevention
 * @see getWildcardRoleManagerRoleIds for identifying all global governors
 */
export async function isRoleWildcardRoleManager(
  prisma: PrismaClient | PrismaTransaction,
  roleId: string
): Promise<boolean> {
  const wildcard = await prisma.roleGrantRule.findFirst({
    where: { granterRoleId: roleId, scope: 'ALL', canManage: true },
    select: { id: true },
  });
  return !!wildcard;
}

/**
 * Lockout protection: Count other roles that provide wildcard role management, excluding the specified role.
 * This is used to ensure at least one global role manager remains after deletion.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param excludeRoleId - ID of the role to exclude from the count (typically the role being deleted)
 * @returns Promise<number> - count of remaining wildcard role managers
 * @remarks 
 * - Lockout protection: ensures at least one global governor remains
 * - Critical safety check: prevents global lockout when deleting wildcard managers
 * - Used in: role deletion, grant rule deletion, self-harm protection
 * @see isRoleWildcardRoleManager for identifying wildcard managers
 * @see getWildcardRoleManagerRoleIds for getting all global governor role IDs
 */
export async function countOtherWildcardRoleManagerRoles(
  prisma: PrismaClient | PrismaTransaction,
  excludeRoleId: string
): Promise<number> {
  return await prisma.roleGrantRule.count({
    where: {
      scope: 'ALL',
      canManage: true,
      granterRoleId: { not: excludeRoleId },
    },
  });
}

// Permission-level wildcard manager check removed

// Permission-level wildcard manager count removed

/**
 * Governance discovery: Get all role IDs that provide wildcard role management.
 * This is useful for identifying critical roles that must be protected.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @returns Promise<string[]> - array of role IDs that provide global role management
 * @remarks 
 * - Critical roles: these roles can manage any other role globally
 * - Protection needed: these roles must be carefully managed to prevent lockout
 * - Single-role model: each user has at most one role
 * @see isRoleWildcardRoleManager for checking if a specific role is a wildcard manager
 * @see countOtherWildcardRoleManagerRoles for lockout protection
 */
export async function getWildcardRoleManagerRoleIds(
  prisma: PrismaClient | PrismaTransaction
): Promise<string[]> {
  const wildcards = await prisma.roleGrantRule.findMany({
    where: { scope: 'ALL', canManage: true },
    select: { granterRoleId: true },
  });
  return Array.from(new Set(wildcards.map(w => w.granterRoleId)));
}

// Permission-level wildcard manager role IDs removed

/**
 * Delegation matrix lookup: Compute effective permission delegation rights for the actor and a target permission.
 * Precedence: specific (PERMISSION) overrides wildcard (ALL).
 * Returns the combined delegation rights considering both specific and wildcard grant rules.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param userId - ID of the user whose delegation rights are being computed
 * @param permissionId - ID of the target permission for which rights are being computed
 * @returns Promise<{canAssign: boolean, canRevoke: boolean}> - effective delegation rights
 * @remarks 
 * - Precedence: specific (PERMISSION) overrides wildcard (ALL)
 * - Single-role model: each user has at most one role
 * - DB invariants: Prisma + DB constraints ensure (ALL ⇒ targetId is NULL, specific ⇒ targetId is NOT NULL)
 * - Returns false for all flags if user has no role or no grants
 * - Note: permissions do not have canManage (governance is role-level only)
 * @see effectiveRoleRights for role delegation rights (includes canManage)
 * @see getUserRoleId for single-role user model
 */
export async function effectivePermissionRights(
  prisma: PrismaClient | PrismaTransaction,
  userId: string,
  permissionId: string
): Promise<{ canAssign: boolean; canRevoke: boolean }> {
  const roleId = await getUserRoleId(prisma, userId);
  if (!roleId) return { canAssign: false, canRevoke: false };

  const [wildcard, specific] = await Promise.all([
    prisma.permissionGrantRule.findFirst({
      where: { granterRoleId: roleId, scope: 'ALL' },
      select: { canAssign: true, canRevoke: true },
    }),
    prisma.permissionGrantRule.findFirst({
      where: { granterRoleId: roleId, scope: 'PERMISSION', permissionId },
      select: { canAssign: true, canRevoke: true },
    }),
  ]);

  return {
    canAssign: (specific?.canAssign ?? wildcard?.canAssign) ?? false,
    canRevoke: (specific?.canRevoke ?? wildcard?.canRevoke) ?? false,
  };
}

/**
 * Delegation matrix lookup: Compute effective role delegation rights for the actor and a target role.
 * Precedence: specific (ROLE) overrides wildcard (ALL).
 * Returns the combined delegation rights considering both specific and wildcard grant rules.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param userId - ID of the user whose delegation rights are being computed
 * @param targetRoleId - ID of the target role for which rights are being computed
 * @returns Promise<{canAssign: boolean, canRevoke: boolean, canManage: boolean}> - effective delegation rights
 * @remarks 
 * - Precedence: specific (ROLE) overrides wildcard (ALL)
 * - Single-role model: each user has at most one role
 * - DB invariants: Prisma + DB constraints ensure (ALL ⇒ targetId is NULL, specific ⇒ targetId is NOT NULL)
 * - Returns false for all flags if user has no role or no grants
 * @see getWildcardRoleRights for wildcard-only rights
 * @see getUserRoleId for single-role user model
 */
export async function effectiveRoleRights(
  prisma: PrismaClient | PrismaTransaction,
  userId: string,
  targetRoleId: string
): Promise<{ canAssign: boolean; canRevoke: boolean; canManage: boolean }> {
  const roleId = await getUserRoleId(prisma, userId);
  if (!roleId) return { canAssign: false, canRevoke: false, canManage: false };

  const [wildcard, specific] = await Promise.all([
    prisma.roleGrantRule.findFirst({
      where: { granterRoleId: roleId, scope: 'ALL' },
      select: { canAssign: true, canRevoke: true, canManage: true },
    }),
    prisma.roleGrantRule.findFirst({
      where: { granterRoleId: roleId, scope: 'ROLE', granteeRoleId: targetRoleId },
      select: { canAssign: true, canRevoke: true, canManage: true },
    }),
  ]);

  return {
    canAssign: (specific?.canAssign ?? wildcard?.canAssign) ?? false,
    canRevoke: (specific?.canRevoke ?? wildcard?.canRevoke) ?? false,
    canManage: (specific?.canManage ?? wildcard?.canManage) ?? false,
  };
}

/**
 * Possession check: Determine if the actor currently holds the specified role.
 * This is a helper function to verify role membership for no-escalation validation.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param userId - ID of the user whose role membership is being checked
 * @param roleId - ID of the role to check for membership
 * @returns Promise<boolean> - true if the user holds the role, false otherwise
 * @remarks 
 * - Possession check: verifies current role membership
 * - No-escalation: used to prevent users from delegating roles they don't possess
 * - Single-role model: each user has at most one role
 * @see validateRoleGrantNoEscalation for comprehensive no-escalation validation
 * @see getUserRoleId for getting the user's current role
 */
export async function actorHoldsRole(prisma: PrismaClient | PrismaTransaction, userId: string, roleId: string): Promise<boolean> {
  const ur = await prisma.userRole.findFirst({ 
    where: { userId, roleId }, 
    select: { id: true } 
  });
  return !!ur;
}

// ============================================================================
// DELEGATION WRAPPER FUNCTIONS (boolean-returning, no throws)
// ============================================================================

/**
 * Delegation check only: Determine if the actor has delegation rights to assign the specified role.
 * This function ONLY checks delegation matrix rights - no possession or governance logic.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the assignment
 * @param targetRoleId - ID of the role to be assigned
 * @returns Promise<boolean> - true if delegation matrix allows assignment, false otherwise
 * @remarks 
 * - Delegation check only: uses effectiveRoleRights(...).canAssign
 * - Does NOT check possession (no-escalation)
 * - Does NOT check governance bypass
 * - Does NOT consider canManage (that's for governance, not assignment)
 * @see effectiveRoleRights for the underlying delegation matrix lookup
 * @see permissions.ts for full permission checks including possession
 */
export async function canAssignRoleDelegation(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetRoleId: string
): Promise<boolean> {
  const rights = await effectiveRoleRights(prisma, actorUserId, targetRoleId);
  return rights.canAssign;
}

/**
 * Delegation check only: Determine if the actor has delegation rights to revoke the specified role.
 * This function ONLY checks delegation matrix rights - no possession or governance logic.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the revocation
 * @param targetRoleId - ID of the role to be revoked
 * @returns Promise<boolean> - true if delegation matrix allows revocation, false otherwise
 * @remarks 
 * - Delegation check only: uses effectiveRoleRights(...).canRevoke
 * - Does NOT check possession (no-escalation)
 * - Does NOT check governance bypass
 * - Does NOT consider canManage (that's for governance, not revocation)
 * @see effectiveRoleRights for the underlying delegation matrix lookup
 * @see permissions.ts for full permission checks including possession
 */
export async function canRevokeRoleDelegation(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetRoleId: string
): Promise<boolean> {
  const rights = await effectiveRoleRights(prisma, actorUserId, targetRoleId);
  return rights.canRevoke;
}

/**
 * Delegation check only: Determine if the actor has delegation rights to assign the specified permission.
 * This function ONLY checks delegation matrix rights - no possession or governance logic.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the assignment
 * @param targetPermissionId - ID of the permission to be assigned
 * @returns Promise<boolean> - true if delegation matrix allows assignment, false otherwise
 * @remarks 
 * - Delegation check only: uses effectivePermissionRights(...).canAssign
 * - Does NOT check possession (no-escalation)
 * - Does NOT check governance bypass
 * - Does NOT consider canManage (that's for governance, not assignment)
 * @see effectivePermissionRights for the underlying delegation matrix lookup
 * @see permissions.ts for full permission checks including possession
 */
export async function canAssignPermissionDelegation(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetPermissionId: string
): Promise<boolean> {
  const rights = await effectivePermissionRights(prisma, actorUserId, targetPermissionId);
  return rights.canAssign;
}

/**
 * Delegation check only: Determine if the actor has delegation rights to revoke the specified permission.
 * This function ONLY checks delegation matrix rights - no possession or governance logic.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the revocation
 * @param targetPermissionId - ID of the permission to be revoked
 * @returns Promise<boolean> - true if delegation matrix allows revocation, false otherwise
 * @remarks 
 * - Delegation check only: uses effectivePermissionRights(...).canRevoke
 * - Does NOT check possession (no-escalation)
 * - Does NOT check governance bypass
 * - Does NOT consider canManage (that's for governance, not revocation)
 * @see effectivePermissionRights for the underlying delegation matrix lookup
 * @see permissions.ts for full permission checks including possession
 */
export async function canRevokePermissionDelegation(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetPermissionId: string
): Promise<boolean> {
  const rights = await effectivePermissionRights(prisma, actorUserId, targetPermissionId);
  return rights.canRevoke;
}


