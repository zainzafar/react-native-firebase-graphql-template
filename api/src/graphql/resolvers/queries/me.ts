export default {
  me: (_parent: unknown, _args: unknown, ctx: any) => {
    return ctx.user ?? null;
  },
};


