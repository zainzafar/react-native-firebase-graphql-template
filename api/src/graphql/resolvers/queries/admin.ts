import type { PrismaClient, User } from '@prisma/client';
import { Role } from '@prisma/client';
import { requireRole } from '../../rbac';

export default {
  adminListUsers: async (
    _parent: unknown,
    args: { query?: string; sortBy?: 'CREATED_AT_DESC' | 'CREATED_AT_ASC'; first?: number; after?: string },
    ctx: { prisma: PrismaClient; user: User }
  ) => {
    const prisma = ctx.prisma;
    // Load roles for the current user to enforce policy
    await requireRole({ user: ctx.user, prisma }, Role.SUPER_ADMIN);

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
      include: { roles: true },
    });

    const hasNextPage = users.length > take;
    const nodes = hasNextPage ? users.slice(0, -1) : users;
    const edges = nodes.map((u) => ({ cursor: u.id, node: u }));
    const endCursor = nodes.length > 0 ? nodes[nodes.length - 1].id : null;

    return { edges, pageInfo: { hasNextPage, endCursor } } as any;
  },

  adminGetUser: async (
    _parent: unknown,
    args: { id: string },
    ctx: { prisma: PrismaClient; user: User }
  ) => {
    const prisma = ctx.prisma;
    await requireRole({ user: ctx.user, prisma }, Role.SUPER_ADMIN);

    const user = await prisma.user.findUnique({ where: { id: args.id }, include: { identities: true, roles: true } });
    if (!user) return null;
    return user;
  },
};


