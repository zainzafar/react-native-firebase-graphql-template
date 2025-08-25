import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import Config from 'react-native-config';
import * as Keychain from 'react-native-keychain';
import { refreshAppToken } from '../auth/session';

const graphqlUrl = (Config.GRAPHQL_API_URL || '').replace(/\/$/, '');
if (!graphqlUrl) {
  // eslint-disable-next-line no-console
  console.warn('[Apollo] Config.GRAPHQL_API_URL is empty. Set GRAPHQL_API_URL in env to reach your backend.');
}
const httpLink = createHttpLink({ uri: graphqlUrl });

const authLink = setContext(async (_, { headers }) => {
  try {
    const creds = await Keychain.getGenericPassword({ service: 'app.accessToken' });
    const token = creds ? creds.password : undefined;
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
  cache: new InMemoryCache(),
});

export async function resetApollo(): Promise<void> {
  try {
    await apolloClient.clearStore();
  } catch {}
}


