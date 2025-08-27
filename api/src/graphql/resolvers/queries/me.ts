import type { User } from '@prisma/client';

export default {
  me: async (_parent: unknown, _args: unknown, { user }: { user: User }) => {
    return user;
  },
};


