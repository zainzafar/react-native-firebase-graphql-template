import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import Config from 'react-native-config';
import { handleHardSignOut, refreshAppToken } from '../auth/session';
import { getAccessToken } from '../auth/tokenStorage';
import { Platform } from 'react-native';
import { Observable } from '@apollo/client/utilities';

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

// single-flight refresh
let refreshing = false;
let waiters: Array<() => void> = [];

async function ensureRefreshed() {
  if (refreshing) return new Promise<void>(res => waiters.push(res));
  refreshing = true;
  try {
    const ok = await refreshAppToken();
    if (!ok) throw new Error('refresh-failed');
  } finally {
    refreshing = false;
    waiters.forEach(fn => fn());
    waiters = [];
  }
}

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  console.log('[Apollo] Error:', error);
  
  // Check for authentication errors
  const isAuthError =
    (CombinedGraphQLErrors.is(error) && error.errors.some(e =>
      e.extensions?.code === 'UNAUTHENTICATED' || e.extensions?.code === 'UNAUTHORIZED'
    )) ||
    // some links set a statusCode on networkError
    (error && (error as any).statusCode === 401 || (error as any).statusCode === 403);

  if (!isAuthError) return;

  console.log('[Apollo] Authentication error detected, attempting token refresh and retry...');
  
  // Return an Observable that waits for refresh, then replays the operation
  return new Observable(observer => {
    (async () => {
      try {
        await ensureRefreshed(); // may queue behind an in-flight refresh
        // forward the original operation with the new token
        const sub = forward!(operation).subscribe({
          next: v => observer.next?.(v),
          error: err => observer.error?.(err),
          complete: () => observer.complete?.(),
        });
        // optional: teardown
        return () => sub.unsubscribe();
      } catch (err) {
        // refresh failed → hard logout + surface error
        try { await handleHardSignOut(); } catch {}
        observer.error(err);
      }
    })();
  });
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


