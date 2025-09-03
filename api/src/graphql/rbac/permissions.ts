/**
 * RBAC Permission Management Module
 * 
 * This module implements the core permission logic for the RBAC system, handling
 * the three dimensions of access control:
 * 
 * 1. Delegation: "May I assign/revoke this thing per delegation matrix?"
 * 2. Possession: "Do I currently hold what I want to delegate?" (no-escalation)
 * 3. Governance: "May I manage the delegation matrix for this granter role?"
 * 
 * Key Responsibilities:
 * - Core permission check functions (canAssignPermission, canRevokePermission, etc.)
 * - Policy preset constants defining standard behavior combinations
 * - Throwing wrapper functions (require*) that apply policies and map to GraphQLError
 * - Integration with delegation.ts for delegation checks and capabilities.ts for user state
 * 
 * Policy Presets:
 * - Assign permission: delegation + possession (no governance bypass by default)
 * - Revoke permission: delegation only (possession not required unless explicitly requested)
 * - Assign role: delegation + possession (actor must possess all permissions in target role)
 * - Revoke role: delegation only (possession not required)
 * 
 * @see delegation.ts for delegation matrix logic
 * @see capabilities.ts for user permission/role resolution
 * @see validation.ts for no-escalation validation
 */
import { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from './core';
import { GraphQLError } from 'graphql';
import { 
  canAssignRoleDelegation,
  canRevokeRoleDelegation,
  canAssignPermissionDelegation,
  canRevokePermissionDelegation,
  actorHasWildcardRoleManageDelegator 
} from './delegation';
import { validateRoleGrantNoEscalation } from './validation';
import { resolveUserPermissions } from './capabilities';

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Configuration options for permission actions, controlling which dimensions
 * of access control are enforced.
 * 
 * @property requireDelegation - Whether to check delegation matrix rights
 * @property requirePossession - Whether to enforce no-escalation (actor must possess what they delegate)
 * @property allowGovernanceBypassPossession - Whether global governors (ALL+canManage) can bypass possession checks
 */
export type ActionOptions = {
  requireDelegation: boolean;
  requirePossession: boolean;
  allowGovernanceBypassPossession?: boolean;
};

// ============================================================================
// POLICY PRESET CONSTANTS
// ============================================================================

/**
 * Default policy for assigning permissions: requires both delegation and possession.
 * This enforces no-escalation by default - actors can only delegate what they possess.
 * 
 * @remarks Delegation + possession; governance bypass disabled by default
 */
export const POLICY_ASSIGN_PERMISSION_DEFAULT: ActionOptions = {
  requireDelegation: true,
  requirePossession: true,
  allowGovernanceBypassPossession: false,
} as const;

/**
 * Policy for assigning permissions with governance bypass: allows global governors
 * (users with ALL+canManage rights) to bypass possession checks.
 * 
 * @remarks Delegation + possession; governance bypass enabled for global governors
 */
export const POLICY_ASSIGN_PERMISSION_WITH_GOV_BYPASS: ActionOptions = {
  requireDelegation: true,
  requirePossession: true,
  allowGovernanceBypassPossession: true,
} as const;

/**
 * Default policy for revoking permissions: requires delegation only.
 * Possession is not required for revocation as reducing power doesn't create escalation.
 * 
 * @remarks Delegation only; possession not required; governance bypass disabled
 */
export const POLICY_REVOKE_PERMISSION_DEFAULT: ActionOptions = {
  requireDelegation: true,
  requirePossession: false,
  allowGovernanceBypassPossession: false,
} as const;

/**
 * Default policy for assigning roles: requires both delegation and possession.
 * Actor must possess all permissions contained in the target role to prevent escalation.
 * 
 * @remarks Delegation + possession; governance bypass disabled by default
 */
export const POLICY_ASSIGN_ROLE_DEFAULT: ActionOptions = {
  requireDelegation: true,
  requirePossession: true,
  allowGovernanceBypassPossession: false,
} as const;

/**
 * Default policy for revoking roles: requires delegation only.
 * Possession is not required for revocation as reducing power doesn't create escalation.
 * 
 * @remarks Delegation only; possession not required; governance bypass disabled
 */
export const POLICY_REVOKE_ROLE_DEFAULT: ActionOptions = {
  requireDelegation: true,
  requirePossession: false,
  allowGovernanceBypassPossession: false,
} as const;

// ============================================================================
// CORE PERMISSION FUNCTIONS (return boolean)
// ============================================================================

/**
 * Delegation + Possession check: Determine if the actor can assign the specified permission
 * based on delegation matrix rights and possession requirements.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the assignment
 * @param targetPermissionId - ID of the permission to be assigned
 * @param options - Configuration controlling which checks to perform
 * @returns Promise<boolean> - true if assignment is allowed, false otherwise
 * @remarks 
 * - Delegation check: actor must have canAssign rights per delegation matrix
 * - Possession check: actor must possess the permission (enforces no-escalation)
 * - Governance bypass: if enabled, global governors (ALL+canManage) can bypass possession
 * @see canAssignPermissionDelegation for delegation-only check
 * @see resolveUserPermissions for user permission resolution
 */
export async function canAssignPermission(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetPermissionId: string,
  options: ActionOptions
): Promise<boolean> {
  const { requireDelegation, requirePossession, allowGovernanceBypassPossession = false } = options;

  // Always check delegation rights
  if (requireDelegation) {
    if (!(await canAssignPermissionDelegation(prisma, actorUserId, targetPermissionId))) {
      return false;
    }
  }

  // Check possession if required
  if (requirePossession) {
    // If governance bypass is allowed, check if actor has global role management
    if (allowGovernanceBypassPossession) {
      const hasGlobalRoleManage = await actorHasWildcardRoleManageDelegator(prisma, actorUserId);
      if (hasGlobalRoleManage) {
        return true; // Bypass possession check for global governors
      }
    }

    // Verify actor possesses the permission they're delegating
    const perm = await prisma.permission.findUnique({
      where: { id: targetPermissionId },
      select: { name: true },
    });
    if (!perm) {
      return false; // Permission not found
    }

    const actorPerms = new Set(await resolveUserPermissions(prisma, actorUserId));
    if (!actorPerms.has(perm.name)) {
      return false; // Actor doesn't possess the permission
    }
  }

  return true;
}

/**
 * Delegation + Possession check: Determine if the actor can revoke the specified permission
 * based on delegation matrix rights and optional possession requirements.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the revocation
 * @param targetPermissionId - ID of the permission to be revoked
 * @param options - Configuration controlling which checks to perform
 * @returns Promise<boolean> - true if revocation is allowed, false otherwise
 * @remarks 
 * - Delegation check: actor must have canRevoke rights per delegation matrix
 * - Possession check: optional, typically not required for revocation (no escalation risk)
 * - Governance bypass: if enabled, global governors (ALL+canManage) can bypass possession
 * @see canRevokePermissionDelegation for delegation-only check
 * @see resolveUserPermissions for user permission resolution
 */
export async function canRevokePermission(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetPermissionId: string,
  options: ActionOptions
): Promise<boolean> {
  const { requireDelegation, requirePossession, allowGovernanceBypassPossession = false } = options;

  // Always check delegation rights
  if (requireDelegation) {
    if (!(await canRevokePermissionDelegation(prisma, actorUserId, targetPermissionId))) {
      return false;
    }
  }

  // Check possession if required
  if (requirePossession) {
    // If governance bypass is allowed, check if actor has global role management
    if (allowGovernanceBypassPossession) {
      const hasGlobalRoleManage = await actorHasWildcardRoleManageDelegator(prisma, actorUserId);
      if (hasGlobalRoleManage) {
        return true; // Bypass possession check for global governors
      }
    }

    // Verify actor possesses the permission they're revoking
    const perm = await prisma.permission.findUnique({
      where: { id: targetPermissionId },
      select: { name: true },
    });
    if (!perm) {
      return false; // Permission not found
    }

    const actorPerms = new Set(await resolveUserPermissions(prisma, actorUserId));
    if (!actorPerms.has(perm.name)) {
      return false; // Actor doesn't possess the permission
    }
  }

  return true;
}

/**
 * Delegation + Possession check: Determine if the actor can assign the specified role
 * based on delegation matrix rights and possession requirements.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the assignment
 * @param targetRoleId - ID of the role to be assigned
 * @param options - Configuration controlling which checks to perform
 * @returns Promise<boolean> - true if assignment is allowed, false otherwise
 * @remarks 
 * - Delegation check: actor must have canAssign rights per delegation matrix
 * - Possession check: actor must possess all permissions contained in the target role (no-escalation)
 * - Governance bypass: if enabled, global governors (ALL+canManage) can bypass possession
 * @see canAssignRoleDelegation for delegation-only check
 * @see validateRoleGrantNoEscalation for no-escalation validation
 */
export async function canAssignRole(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetRoleId: string,
  options: ActionOptions
): Promise<boolean> {
  const { requireDelegation, requirePossession, allowGovernanceBypassPossession = false } = options;

  // Always check delegation rights
  if (requireDelegation) {
    if (!(await canAssignRoleDelegation(prisma, actorUserId, targetRoleId))) {
      return false;
    }
  }

  // Check possession if required (no-escalation validation)
  if (requirePossession) {
    // If governance bypass is allowed, check if actor has global role management
    if (allowGovernanceBypassPossession) {
      const hasGlobalRoleManage = await actorHasWildcardRoleManageDelegator(prisma, actorUserId);
      if (hasGlobalRoleManage) {
        return true; // Bypass possession check for global governors
      }
    }

    try {
      // possession for roles = actor must possess all permissions of the target role
      await validateRoleGrantNoEscalation(prisma, actorUserId, targetRoleId);
    } catch {
      return false; // No-escalation validation failed
    }
  }

  return true;
}

/**
 * Delegation check: Determine if the actor can revoke the specified role
 * based on delegation matrix rights. Possession is typically not required for revocation.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the revocation
 * @param targetRoleId - ID of the role to be revoked
 * @param options - Configuration controlling which checks to perform
 * @returns Promise<boolean> - true if revocation is allowed, false otherwise
 * @remarks 
 * - Delegation check: actor must have canRevoke rights per delegation matrix
 * - Possession check: optional, typically not required (reducing power doesn't create escalation)
 * - Governance bypass: if enabled, global governors (ALL+canManage) can bypass possession
 * @see canRevokeRoleDelegation for delegation-only check
 */
export async function canRevokeRole(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetRoleId: string,
  options: ActionOptions
): Promise<boolean> {
  const { requireDelegation, requirePossession, allowGovernanceBypassPossession = false } = options;

  // Always check delegation rights
  if (requireDelegation) {
    if (!(await canRevokeRoleDelegation(prisma, actorUserId, targetRoleId))) {
      return false;
    }
  }

  // Check possession if required
  if (requirePossession) {
    // If governance bypass is allowed, check if actor has global role management
    if (allowGovernanceBypassPossession) {
      const hasGlobalRoleManage = await actorHasWildcardRoleManageDelegator(prisma, actorUserId);
      if (hasGlobalRoleManage) {
        return true; // Bypass possession check for global governors
      }
    }

    // For role revocation, possession check would typically verify the actor
    // has some relationship to the role being revoked, but this is usually
    // not required for role management operations.
    // This is left as a placeholder for future implementation if needed
  }

  return true;
}

// ============================================================================
// REQUIRE WRAPPERS (throw GraphQLError)
// ============================================================================

/**
 * Throwing wrapper: Require that the actor can assign the specified permission.
 * Applies policy presets and maps failures to GraphQLError.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the assignment
 * @param targetPermissionId - ID of the permission to be assigned
 * @param options - Optional policy overrides (defaults to POLICY_ASSIGN_PERMISSION_DEFAULT)
 * @returns Promise<void> - throws GraphQLError if assignment is not allowed
 * @throws {GraphQLError} FORBIDDEN - when assignment is not allowed
 * @remarks 
 * - Default policy: delegation + possession; governance bypass disabled
 * - Merges provided options with default policy
 * - Delegation check: actor must have canAssign rights per delegation matrix
 * - Possession check: actor must possess the permission (enforces no-escalation)
 * @see canAssignPermission for the underlying permission check
 * @see POLICY_ASSIGN_PERMISSION_DEFAULT for default policy
 */
export async function requireAssignPermission(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetPermissionId: string,
  options: Partial<ActionOptions> = {}
): Promise<void> {
  const finalOptions: ActionOptions = {
    ...POLICY_ASSIGN_PERMISSION_DEFAULT,
    ...options
  };
  const canAssign = await canAssignPermission(prisma, actorUserId, targetPermissionId, finalOptions);
  if (!canAssign) {
    throw new GraphQLError('Cannot assign this permission', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}

/**
 * Throwing wrapper: Require that the actor can revoke the specified permission.
 * Applies policy presets and maps failures to GraphQLError.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the revocation
 * @param targetPermissionId - ID of the permission to be revoked
 * @param options - Optional policy overrides (defaults to POLICY_REVOKE_PERMISSION_DEFAULT)
 * @returns Promise<void> - throws GraphQLError if revocation is not allowed
 * @throws {GraphQLError} FORBIDDEN - when revocation is not allowed
 * @remarks 
 * - Default policy: delegation only; possession not required; governance bypass disabled
 * - Merges provided options with default policy
 * - Delegation check: actor must have canRevoke rights per delegation matrix
 * - Possession check: optional, typically not required (reducing power doesn't create escalation)
 * @see canRevokePermission for the underlying permission check
 * @see POLICY_REVOKE_PERMISSION_DEFAULT for default policy
 */
export async function requireRevokePermission(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetPermissionId: string,
  options: Partial<ActionOptions> = {}
): Promise<void> {
  const finalOptions: ActionOptions = {
    ...POLICY_REVOKE_PERMISSION_DEFAULT,
    ...options
  };
  const canRevoke = await canRevokePermission(prisma, actorUserId, targetPermissionId, finalOptions);
  if (!canRevoke) {
    throw new GraphQLError('Cannot revoke this permission', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}

/**
 * Throwing wrapper: Require that the actor can assign the specified role.
 * Applies policy presets and maps failures to GraphQLError.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the assignment
 * @param targetRoleId - ID of the role to be assigned
 * @param options - Optional policy overrides (defaults to POLICY_ASSIGN_ROLE_DEFAULT)
 * @returns Promise<void> - throws GraphQLError if assignment is not allowed
 * @throws {GraphQLError} FORBIDDEN - when assignment is not allowed
 * @remarks 
 * - Default policy: delegation + possession; governance bypass disabled
 * - Merges provided options with default policy
 * - Delegation check: actor must have canAssign rights per delegation matrix
 * - Possession check: actor must possess all permissions contained in the target role (no-escalation)
 * @see canAssignRole for the underlying permission check
 * @see POLICY_ASSIGN_ROLE_DEFAULT for default policy
 * @see validateRoleGrantNoEscalation for no-escalation validation
 */
export async function requireAssignRole(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetRoleId: string,
  options: Partial<ActionOptions> = {}
): Promise<void> {
  const finalOptions: ActionOptions = {
    ...POLICY_ASSIGN_ROLE_DEFAULT,
    ...options
  };
  const canAssign = await canAssignRole(prisma, actorUserId, targetRoleId, finalOptions);
  if (!canAssign) {
    throw new GraphQLError('Cannot assign this role', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}

/**
 * Throwing wrapper: Require that the actor can revoke the specified role.
 * Applies policy presets and maps failures to GraphQLError.
 * 
 * @param prisma - Prisma client or transaction for database access
 * @param actorUserId - ID of the user attempting the revocation
 * @param targetRoleId - ID of the role to be revoked
 * @param options - Optional policy overrides (defaults to POLICY_REVOKE_ROLE_DEFAULT)
 * @returns Promise<void> - throws GraphQLError if revocation is not allowed
 * @throws {GraphQLError} FORBIDDEN - when revocation is not allowed
 * @remarks 
 * - Default policy: delegation only; possession not required; governance bypass disabled
 * - Merges provided options with default policy
 * - Delegation check: actor must have canRevoke rights per delegation matrix
 * - Possession check: optional, typically not required (reducing power doesn't create escalation)
 * @see canRevokeRole for the underlying permission check
 * @see POLICY_REVOKE_ROLE_DEFAULT for default policy
 */
export async function requireRevokeRole(
  prisma: PrismaClient | PrismaTransaction,
  actorUserId: string,
  targetRoleId: string,
  options: Partial<ActionOptions> = {}
): Promise<void> {
  const finalOptions: ActionOptions = {
    ...POLICY_REVOKE_ROLE_DEFAULT,
    ...options
  };
  const canRevoke = await canRevokeRole(prisma, actorUserId, targetRoleId, finalOptions);
  if (!canRevoke) {
    throw new GraphQLError('Cannot revoke this role', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}