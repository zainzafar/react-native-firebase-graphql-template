import type { PrismaClient, User } from '@prisma/client';
import { requirePermission } from '../../rbac';
import { AuthContextUser } from '../../../services/firebaseAdmin';

export default {
  adminListUsers: async (
    _parent: unknown,
    args: { query?: string; sortBy?: 'CREATED_AT_DESC' | 'CREATED_AT_ASC'; first?: number; after?: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    const prisma = ctx.prisma;
    
    // Check permissions based on whether search is being used
    if (args.query) {
      await requirePermission({ user: ctx.user, prisma }, 'ADMIN_USERS_SEARCH');
    } else {
      await requirePermission({ user: ctx.user, prisma }, 'ADMIN_USERS_VIEW');
    }

    const take = Math.min(Math.max(args.first ?? 20, 1), 100);
    const sortDesc = (args.sortBy ?? 'CREATED_AT_DESC') === 'CREATED_AT_DESC';

    const where = args.query
      ? {
          OR: [
            { email: { contains: args.query, mode: 'insensitive' as const } },
            { phoneNumber: { contains: args.query, mode: 'insensitive' as const } },
            { displayName: { contains: args.query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const cursor = args.after ? { id: args.after } : undefined;

    const users = await prisma.user.findMany({
      where,
      take: take + 1,
      ...(cursor ? { skip: 1, cursor } : {}),
      orderBy: { createdAt: sortDesc ? 'desc' : 'asc' },
      include: { roles: true, identities: true },
    });

    const hasNextPage = users.length > take;
    const nodes = hasNextPage ? users.slice(0, -1) : users;
    const edges = nodes.map((u) => ({ cursor: u.id, node: u }));
    const endCursor = nodes.length > 0 ? nodes[nodes.length - 1].id : null;

    return { edges, pageInfo: { hasNextPage, endCursor } } as any;
  },

  adminGetUser: async (
    _parent: unknown,
    args: { uid: string },
    ctx: { prisma: PrismaClient; user: AuthContextUser }
  ) => {
    await requirePermission({ user: ctx.user, prisma: ctx.prisma }, 'ADMIN_USERS_VIEW');
    
    const user = await ctx.prisma.user.findUnique({
      where: { uid: args.uid },
      include: { roles: true, identities: true },
    });
    
    return user;
  }
};


