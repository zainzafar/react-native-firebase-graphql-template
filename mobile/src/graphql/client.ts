import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors, CombinedProtocolErrors } from '@apollo/client/errors';
import Config from 'react-native-config';
import { handleHardSignOut } from '../auth/session';
import { getAccessToken } from '../auth/tokenStorage';
import { Platform } from 'react-native';

const rawUrl = (Config.GRAPHQL_API_URL || '').replace(/\/$/, '');
// Android emulator/device cannot reach host's localhost; remap to 10.0.2.2
const graphqlUrl = Platform.OS === 'android'
  ? rawUrl.replace('://localhost', '://10.0.2.2')
  : rawUrl;
if (!graphqlUrl) {
  console.warn('[Apollo] Config.GRAPHQL_API_URL is empty. Set GRAPHQL_API_URL in env to reach your backend.');
}
const httpLink = new HttpLink({ uri: graphqlUrl });

const authLink = new SetContextLink(async (prevContext, _operation) => {
  try {
    const token = await getAccessToken();
    return {
      ...prevContext,
      headers: {
        ...prevContext.headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch {
    return prevContext;
  }
});

const errorLink = new ErrorLink(({ error }) => {
  console.log('[Apollo] Error:', error);
  
  // Check for authentication errors
  let hasAuthError = false;
  
  if (CombinedGraphQLErrors.is(error)) {
    hasAuthError = error.errors.some((err: any) => err.extensions?.code === 'UNAUTHORIZED');
  } else if (CombinedProtocolErrors.is(error)) {
    hasAuthError = error.errors.some((err: any) => err.extensions?.code === 'UNAUTHORIZED');
  } else {
    hasAuthError = error.message?.toLowerCase().includes('unauthorized');
  }
  
  if (hasAuthError) {
    console.log('[Apollo] Authentication error detected, logging out...');
    handleHardSignOut();
  }
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
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


