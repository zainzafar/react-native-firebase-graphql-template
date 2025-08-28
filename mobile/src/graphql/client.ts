import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import Config from 'react-native-config';
import { refreshAppToken } from '../auth/session';
import { getAccessToken } from '../auth/tokenStorage';
import { Platform } from 'react-native';

const rawUrl = (Config.GRAPHQL_API_URL || '').replace(/\/$/, '');
// Android emulator/device cannot reach host's localhost; remap to 10.0.2.2
const graphqlUrl = Platform.OS === 'android'
  ? rawUrl.replace('://localhost', '://10.0.2.2')
  : rawUrl;
if (!graphqlUrl) {
  // eslint-disable-next-line no-console
  console.warn('[Apollo] Config.GRAPHQL_API_URL is empty. Set GRAPHQL_API_URL in env to reach your backend.');
}
const httpLink = createHttpLink({ uri: graphqlUrl });

const authLink = setContext(async (_, { headers }) => {
  try {
    const token = await getAccessToken();
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch {
    return { headers };
  }
});

const errorLink = onError((ctx: any) => {
  const { graphQLErrors, networkError, operation, forward } = ctx || {};
  if (graphQLErrors && graphQLErrors.length > 0) {
    for (const err of graphQLErrors) {
      console.log('[Apollo][GraphQL error]', err?.message, err?.extensions);
      if (err.extensions && (err.extensions as any).code === 'UNAUTHENTICATED') {
        return refreshAppToken().then((success) => (success ? forward(operation) : undefined)) as any;
      }
    }
  }
  if (networkError) {
    console.log('[Apollo][Network error]', networkError);
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          adminListUsers: {
            // Keep separate caches per search query; pagination uses 'after'
            keyArgs: ['query'],
            merge(existing, incoming) {
              if (!existing) return incoming;
              const existingEdges = Array.isArray(existing.edges) ? existing.edges : [];
              const incomingEdges = Array.isArray(incoming?.edges) ? incoming.edges : [];
              // Deduplicate by cursor
              const seen = new Set<string>();
              const mergedEdges = [] as any[];
              for (const e of [...existingEdges, ...incomingEdges]) {
                const c = e?.cursor;
                if (c && !seen.has(c)) {
                  seen.add(c);
                  mergedEdges.push(e);
                }
              }
              return {
                ...incoming,
                edges: mergedEdges,
                pageInfo: incoming?.pageInfo ?? existing?.pageInfo,
              };
            },
          },
        },
      },
    },
  }),
});

export async function resetApollo(): Promise<void> {
  try {
    await apolloClient.clearStore();
  } catch {}
}


