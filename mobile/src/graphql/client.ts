import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import Config from 'react-native-config';
import { handleHardSignOut, refreshAppToken } from '../auth/session';
import { getAccessToken } from '../auth/tokenStorage';
import { Platform } from 'react-native';
import { Observable } from '@apollo/client/utilities';
import uuidv4 from 'react-native-uuid';

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

// Helper function to extract field names from GraphQL query
const extractFieldNames = (selectionSet: any, fragments: any = {}): string[] => {
  if (!selectionSet || !selectionSet.selections) return [];
  
  return selectionSet.selections.map((selection: any) => {
    if (selection.kind === 'Field') {
      const fieldName = selection.name.value;
      const subFields = selection.selectionSet ? extractFieldNames(selection.selectionSet, fragments) : [];
      return subFields.length > 0 ? `${fieldName} { ${subFields.join(', ')} }` : fieldName;
    } else if (selection.kind === 'FragmentSpread') {
      const fragmentName = selection.name.value;
      const fragment = fragments[fragmentName];
      if (fragment && fragment.selectionSet) {
        const fragmentFields = extractFieldNames(fragment.selectionSet, fragments);
        return fragmentFields.length > 0 ? fragmentFields.join(', ') : fragmentName;
      }
      return `...${fragmentName}`;
    } else if (selection.kind === 'InlineFragment') {
      const subFields = extractFieldNames(selection.selectionSet, fragments);
      return `... on ${selection.typeCondition.name.value} { ${subFields.join(', ')} }`;
    }
    return '';
  }).filter(Boolean);
};

// Helper function to build fragments map from query definitions
const buildFragmentsMap = (definitions: readonly any[]): any => {
  const fragments: any = {};
  definitions.forEach(def => {
    if (def.kind === 'FragmentDefinition') {
      fragments[def.name.value] = def;
    }
  });
  return fragments;
};

// Development logging link - only active in __DEV__ mode
const devLoggingLink = new ApolloLink((operation, forward) => {
  if (__DEV__) {
    const operationId = uuidv4.v4()
    const startTime = Date.now();
    const operationType = operation.query.definitions[0]?.kind === 'OperationDefinition' 
      ? operation.query.definitions[0].operation 
      : 'unknown';
    const operationName = operation.operationName || 'unnamed';
    
    // Extract field names from the query, both raw and resolved
    const fragments = buildFragmentsMap(operation.query.definitions);
    const operationDef = operation.query.definitions[0];
    const rawFieldNames = operationDef?.kind === 'OperationDefinition' 
      ? extractFieldNames(operationDef.selectionSet, {}) // Empty fragments map for raw view
      : [];
    const resolvedFieldNames = operationDef?.kind === 'OperationDefinition' 
      ? extractFieldNames(operationDef.selectionSet, fragments) // Full fragments map for resolved view
      : [];
    
    console.log(`🚀 [GraphQL ${operationType.toUpperCase()}] ${operationName} [${operationId}]`);
    if (rawFieldNames.length > 0) {
      console.log(`🔍 [${operationId}] Fields:`, rawFieldNames.join(', '));
    }
    if (resolvedFieldNames.length > 0 && JSON.stringify(rawFieldNames) !== JSON.stringify(resolvedFieldNames)) {
      console.log(`🔍 [${operationId}] Fields with resolved fragments:`, resolvedFieldNames.join(', '));
    }
    console.log(`📤 [${operationId}] Variables:`, JSON.stringify(operation.variables, null, 2));
    
    return new Observable(observer => {
      const subscription = forward(operation).subscribe({
        next: (result) => {
          const duration = Date.now() - startTime;
          console.log(`📥 [GraphQL ${operationType.toUpperCase()}] ${operationName} [${operationId}] completed in ${duration}ms`);
          
          if (result.errors) {
            console.log(`❌ [${operationId}] Errors:`, JSON.stringify(result.errors, null, 2));
          }
          
          if (result.data) {
            // Log a summary of the response data (truncated for readability)
            const dataSummary = JSON.stringify(result.data, null, 2);
            const truncatedData = dataSummary.length > 1000 
              ? dataSummary.substring(0, 1000) + '... (truncated)'
              : dataSummary;
            console.log(`✅ [${operationId}] Response:`, truncatedData);
          }
          
          observer.next(result);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          console.log(`❌ [GraphQL ${operationType.toUpperCase()}] ${operationName} [${operationId}] failed after ${duration}ms`);
          console.log(`❌ [${operationId}] Error:`, error);
          observer.error(error);
        },
        complete: () => {
          observer.complete();
        }
      });
      
      return () => subscription.unsubscribe();
    });
  }
  
  return forward(operation);
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([devLoggingLink, errorLink, authLink, httpLink]),
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


