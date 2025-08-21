import { join } from 'node:path';
import fg from 'fast-glob';

type ResolverMap = Record<string, any>;

const RESOLVERS_DIR = join(__dirname, 'resolvers');

export async function loadResolvers(): Promise<ResolverMap> {
  const [queryFiles, mutationFiles] = await Promise.all([
    fg('queries/**/*.{ts,js}', { cwd: RESOLVERS_DIR, absolute: true }),
    fg('mutations/**/*.{ts,js}', { cwd: RESOLVERS_DIR, absolute: true }),
  ]);

  const resolvers: ResolverMap = { Query: {}, Mutation: {} };

  const importAndMerge = async (files: string[], type: 'Query' | 'Mutation') => {
    for (const filePath of files as string[]) {
      const mod = await import(filePath);
      const exported = mod.default ?? mod;
      Object.assign(resolvers[type], exported[type] ?? exported);
    }
  };

  await Promise.all([
    importAndMerge(queryFiles, 'Query'),
    importAndMerge(mutationFiles, 'Mutation'),
  ]);

  // Remove empty resolver types to avoid schema warnings if not needed
  if (Object.keys(resolvers.Query).length === 0) delete resolvers.Query;
  if (Object.keys(resolvers.Mutation).length === 0) delete resolvers.Mutation;

  return resolvers;
}


