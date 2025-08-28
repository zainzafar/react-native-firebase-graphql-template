import { gql } from '@apollo/client';

export const MUTATION_LOGIN_WITH_ID_TOKEN = gql`
  mutation LoginWithIdToken($idToken: String!) {
    loginWithIdToken(idToken: $idToken) {
      user { uid email displayName emailVerified lastLoginProvider permissions identities { providerId providerUid lastUsedAt } }
      accessToken
    }
  }
`;

export const QUERY_ME = gql`
  query Me {
    me { uid email displayName emailVerified lastLoginProvider permissions identities { providerId providerUid lastUsedAt } }
  }
`;

export const MUTATION_UPDATE_PROFILE = gql`
  mutation UpdateProfile($displayName: String, $photoURL: String) {
    updateProfile(displayName: $displayName, photoURL: $photoURL) {
      uid
      email
      displayName
      emailVerified
      lastLoginProvider
      identities {
        providerId
        providerUid
        lastUsedAt
      }
    }
  }
`;

// Admin operations
export const QUERY_ADMIN_LIST_USERS = gql`
  query AdminListUsers($query: String, $first: Int = 20, $after: String) {
    adminListUsers(query: $query, first: $first, after: $after) {
      edges {
        cursor
        node {
          uid
          email
          displayName
          phoneNumber
          lastLoginProvider
          createdAt
          identities { providerId }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const QUERY_ADMIN_GET_USER = gql`
  query AdminGetUser($uid: ID!) {
    adminGetUser(uid: $uid) {
      uid
      email
      displayName
      phoneNumber
      photoURL
      lastLoginProvider
      createdAt
      identities { providerId providerUid lastUsedAt }
    }
  }
`;

export const QUERY_ADMIN_GET_USER_BY_UID = gql`
  query AdminGetUserByUid($uid: ID!) {
    adminGetUserByUid(uid: $uid) {
      uid
      email
      displayName
      phoneNumber
      photoURL
      lastLoginProvider
      createdAt
      identities { providerId providerUid lastUsedAt }
    }
  }
`;

export const MUTATION_ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($uid: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(uid: $uid, input: $input) {
      uid
      email
      displayName
      phoneNumber
      photoURL
      lastLoginProvider
      createdAt
    }
  }
`;

export const MUTATION_ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($uid: ID!) {
    adminDeleteUser(uid: $uid)
  }
`;

export const MUTATION_ADMIN_RESET_PASSWORD = gql`
  mutation AdminResetPassword($uid: ID!) {
    adminResetPassword(uid: $uid)
  }
`;


