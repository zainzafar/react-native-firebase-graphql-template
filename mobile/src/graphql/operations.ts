import { gql } from '@apollo/client';

// Fragment for user fields that are commonly used
export const USER_FIELDS_FRAGMENT = gql`
  fragment UserFields on User {
    uid
    email
    displayName
    emailVerified
    lastLoginProvider
    phoneNumber
    photoURL
    createdAt
    permissions
    identities {
      providerId
      providerUid
      lastUsedAt
    }
  }
`;

export const MUTATION_LOGIN_WITH_ID_TOKEN = gql`
  mutation LoginWithIdToken($idToken: String!) {
    loginWithIdToken(idToken: $idToken) {
      user {
        ...UserFields
      }
      accessToken
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

export const QUERY_ME = gql`
  query Me {
    me {
      ...UserFields
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

export const MUTATION_UPDATE_PROFILE = gql`
  mutation UpdateProfile($displayName: String, $photoURL: String) {
    updateProfile(displayName: $displayName, photoURL: $photoURL) {
      ...UserFields
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

// Admin operations
export const QUERY_ADMIN_LIST_USERS = gql`
  query AdminListUsers($query: String, $first: Int = 20, $after: String) {
    adminListUsers(query: $query, first: $first, after: $after) {
      edges {
        cursor
        node {
          ...UserFields
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

export const QUERY_ADMIN_GET_USER = gql`
  query AdminGetUser($uid: ID!) {
    adminGetUser(uid: $uid) {
      ...UserFields
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

export const QUERY_ADMIN_GET_USER_BY_UID = gql`
  query AdminGetUserByUid($uid: ID!) {
    adminGetUserByUid(uid: $uid) {
      ...UserFields
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

export const MUTATION_ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($uid: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(uid: $uid, input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS_FRAGMENT}
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


