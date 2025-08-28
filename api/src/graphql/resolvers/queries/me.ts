import type { AuthContextUser } from '../../../services/firebaseAdmin';

export default {
  me: async (_parent: unknown, _args: unknown, { user }: { user: AuthContextUser }) => {
    return user;
  },
};


