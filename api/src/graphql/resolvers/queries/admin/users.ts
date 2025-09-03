import type { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { requirePermission } from '../../../rbac';
import { AuthContextUser } from '../../../../services/firebaseAdmin';

// Connection type for pagination
type Connection<T> = {
  edges: Array<{ cursor: string; node: T }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

export default {
  adminListUsers: async (
    _parent: unknown,
    args: { query?: string; sortBy?: 'CREATED_AT_DESC' | 'CREATED_AT_ASC'; first?: number; after?: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    const prisma = ctx.prisma;
    
    // Trim and handle empty query
    const trimmedQuery = args.query?.trim();
    const hasQuery = trimmedQuery && trimmedQuery.length > 0;
    
    // Check permissions based on whether search is being used
    if (hasQuery) {
      requirePermission(ctx.user, 'ADMIN_USERS_SEARCH');
    } else {
      requirePermission(ctx.user, 'ADMIN_USERS_VIEW_ALL');
    }

    const take = Math.min(Math.max(args.first ?? 20, 1), 100);
    const sortDesc = (args.sortBy ?? 'CREATED_AT_DESC') === 'CREATED_AT_DESC';

    const where = hasQuery
      ? {
          OR: [
            { email: { contains: trimmedQuery, mode: 'insensitive' as const } },
            { phoneNumber: { contains: trimmedQuery, mode: 'insensitive' as const } },
            { displayName: { contains: trimmedQuery, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Parse composite cursor for consistent pagination
    let cursor: { createdAt: Date; id: string } | undefined;
    if (args.after) {
      try {
        const decoded = JSON.parse(Buffer.from(args.after, 'base64').toString());
        cursor = { createdAt: new Date(decoded.createdAt), id: decoded.id };
      } catch {
        throw new GraphQLError('Invalid cursor', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
    }

    const users = await prisma.user.findMany({
      where,
      take: take + 1,
      ...(cursor ? { skip: 1, cursor } : {}),
      orderBy: [
        { createdAt: sortDesc ? 'desc' : 'asc' },
        { id: 'asc' }
      ],
      include: { 
        role: { include: { role: true } }, 
        identities: true 
      },
    });

    const hasNextPage = users.length > take;
    const nodes = hasNextPage ? users.slice(0, -1) : users;
    const edges = nodes.map((u) => ({ 
      cursor: Buffer.from(JSON.stringify({ createdAt: u.createdAt.toISOString(), id: u.id })).toString('base64'), 
      node: u 
    }));
    const endCursor = nodes.length > 0 ? edges[nodes.length - 1].cursor : null;

    return { edges, pageInfo: { hasNextPage, endCursor } } satisfies Connection<typeof users[0]>;
  },

  adminGetUser: async (
    _parent: unknown,
    args: { id: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    // For individual user access, require VIEW_ALL permission
    // This is more restrictive than the list function which allows SEARCH for specific queries
    requirePermission(ctx.user, 'ADMIN_USERS_VIEW_ALL');
    
    const user = await ctx.prisma.user.findUnique({
      where: { id: args.id },
      include: { 
        role: { include: { role: true } }, 
        identities: true 
      },
    });
    
    return user;
  },

  adminGetUserRawPermissions: async (
    _parent: unknown,
    args: { id: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    // Require permission to view user permissions
    requirePermission(ctx.user, 'ADMIN_PERMISSIONS_VIEW');
    const user = await ctx.prisma.user.findUnique({ where: { id: args.id } });
    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }
    const rows = await ctx.prisma.userPermission.findMany({
      where: { userId: user.id },
      include: { permission: true },
    });
    return rows.map((r) => r.permission.name);
  },
};
