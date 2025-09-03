/**
 * RBAC Core Module
 * 
 * This module provides core types and utilities for the RBAC system, including
 * transaction types and basic permission checking functions.
 * 
 * Key Responsibilities:
 * - PrismaTransaction type definition for database transactions
 * - Basic permission checking utilities
 * - Integration with Firebase Admin authentication
 * 
 * Transaction Types:
 * - PrismaTransaction: Prisma client without connection management methods
 * - Used by all RBAC functions for consistent transaction handling
 * 
 * Permission Checking:
 * - hasPermission: boolean check for user permissions
 * - requirePermission: throwing check that maps to GraphQLError
 * - Integrates with Firebase Admin user context
 * 
 * @see permissions.ts for advanced permission logic
 * @see delegation.ts for delegation matrix logic
 * @see validation.ts for no-escalation validation
 */
import { PrismaClient } from '@prisma/client';
import type { AuthContextUser } from '../../services/firebaseAdmin';
import { GraphQLError } from 'graphql';

export type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;

/**
 * Permission check: Determine if the user has the specified permission.
 * Basic boolean check for user permissions from Firebase Admin context.
 * 
 * @param user - Firebase Admin user context (may be null)
 * @param permissionName - name of the permission to check
 * @returns boolean - true if user has the permission, false otherwise
 * @remarks 
 * - Basic permission check: uses Firebase Admin user context
 * - Returns false if user is null or has no permissions
 * - Used for simple permission validation in resolvers
 * @see requirePermission for throwing version that maps to GraphQLError
 */
export function hasPermission(user: AuthContextUser | null, permissionName: string): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes(permissionName);
}

/**
 * Throwing permission check: Require that the user has at least one of the specified permissions.
 * Maps permission failures to GraphQLError with FORBIDDEN code.
 * 
 * @param user - Firebase Admin user context (may be null)
 * @param permissionName - name(s) of the permission(s) to check (string or array)
 * @returns void - throws GraphQLError if user lacks required permissions
 * @throws {GraphQLError} FORBIDDEN - when user lacks required permissions
 * @remarks 
 * - Throwing permission check: maps failures to GraphQLError
 * - Array support: user must have at least one of the specified permissions
 * - Used for permission validation in resolvers that require throwing behavior
 * @see hasPermission for boolean version
 */
export function requirePermission(user: AuthContextUser | null, permissionName: string | string[]): void {
  const permissions = Array.isArray(permissionName) ? permissionName : [permissionName];
  const hasAnyPermission = permissions.map(perm => hasPermission(user, perm));
  const ok = hasAnyPermission.some(Boolean);
  if (!ok) throw new GraphQLError('Forbidden', {
    extensions: {
      code: 'FORBIDDEN',
    },
  });
}
