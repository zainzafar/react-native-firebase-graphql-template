import { gql } from '@apollo/client';

export const MUTATION_LOGIN_WITH_ID_TOKEN = gql`
  mutation LoginWithIdToken($idToken: String!) {
    loginWithIdToken(idToken: $idToken) {
      user { uid email displayName emailVerified lastLoginProvider identities { providerId providerUid lastUsedAt } }
      accessToken
    }
  }
`;

export const QUERY_ME = gql`
  query Me {
    me { uid email displayName emailVerified lastLoginProvider identities { providerId providerUid lastUsedAt } }
  }
`;


