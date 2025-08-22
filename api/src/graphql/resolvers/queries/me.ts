export default {
  me: async (_parent: unknown, _args: unknown, ctx: any) => {
    const authUser = ctx.user;
    if (!authUser) return null;
    const prisma = ctx?.prisma as any | undefined;
    if (prisma) {
      const dbUser = await prisma.user.findUnique({ where: { uid: authUser.uid } });
      if (dbUser) {
        return {
          uid: dbUser.uid,
          email: dbUser.email,
          emailVerified: dbUser.emailVerified,
          displayName: dbUser.displayName,
          photoURL: dbUser.photoURL,
          phoneNumber: dbUser.phoneNumber,
          providerId: dbUser.providerId ?? 'firebase',
        };
      }
    }
    return authUser;
  },
};


