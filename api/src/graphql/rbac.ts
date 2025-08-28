import type { User, PrismaClient, Role } from '@prisma/client';
import type { AuthContextUser } from '../services/firebaseAdmin';

type Ctx = { user: AuthContextUser | null; prisma: PrismaClient };

export async function hasRole(ctx: Ctx, role: Role): Promise<boolean> {
  const roles = ctx.user?.roles ?? [];
  if (Array.isArray(roles)) {
    return roles.includes(role);
  }
  if (!ctx.user?.id) return false;
  const existing = await ctx.prisma.userRole.findMany({ where: { userId: ctx.user.id } });
  return existing.some((r) => r.role === role);
}

export async function requireRole(ctx: Ctx, role: Role): Promise<void> {
  const ok = await hasRole(ctx, role);
  if (!ok) throw new Error('Forbidden');
}


