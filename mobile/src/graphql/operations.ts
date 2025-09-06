import { gql } from '@apollo/client';

// Fragment for user fields that are commonly used
export const USER_FIELDS_FRAGMENT = gql`
  fragment UserFields on User {
    id
    uid
    email
    displayName
    emailVerified
    lastLoginProvider
    phoneNumber
    photoURL
    createdAt
    role { id name }
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
  query AdminGetUser($id: ID!) {
    adminGetUser(id: $id) {
      ...UserFields
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

export const MUTATION_ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($id: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

export const MUTATION_ADMIN_UPDATE_USER_PASSWORD = gql`
  mutation AdminUpdateUserPassword($id: ID!, $input: AdminUpdateUserPasswordInput!) {
    adminUpdateUserPassword(id: $id, input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS_FRAGMENT}
`;

export const MUTATION_ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($id: ID!) {
    adminDeleteUser(id: $id)
  }
`;

// Roles & Permissions admin operations
export const QUERY_ADMIN_LIST_MANAGEABLE_ROLES = gql`
  query AdminListManageableRoles {
    adminListManageableRoles {
      id
      name
      description
      permissions { id name }
      users { id }
    }
  }
`;

export const QUERY_ADMIN_LIST_ASSIGNABLE_ROLES = gql`
  query AdminListAssignableRoles {
    adminListAssignableRoles {
      id
      name
      description
      permissions { id name }
      users { id }
    }
  }
`;

export const QUERY_ADMIN_GET_ROLE = gql`
  query AdminGetRole($id: ID!) {
    adminGetRole(id: $id) {
      id
      name
      description
      permissions { id name description }
      users { 
        id 
        email 
        displayName 
        phoneNumber 
        identities { providerId }
      }
      canGrantRolesRules {
        id
        scope
        canAssign
        canRevoke
        canManage
        granteeRole { id name description }
      }
      canGrantPermissionsRules {
        id
        scope
        canAssign
        canRevoke
        permission { id name description }
      }
    }
  }
`;

export const MUTATION_ADMIN_CREATE_ROLE = gql`
  mutation AdminCreateRole($input: CreateRoleInput!) {
    adminCreateRole(input: $input) {
      id
      name
      description
      permissions {
        id
        name
        description
      }
    }
  }
`;

export const MUTATION_ADMIN_UPDATE_ROLE = gql`
  mutation AdminUpdateRole($id: ID!, $input: UpdateRoleInput!) {
    adminUpdateRole(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const MUTATION_ADMIN_DELETE_ROLE = gql`
  mutation AdminDeleteRole($id: ID!) {
    adminDeleteRole(id: $id)
  }
`;

export const MUTATION_ADMIN_SET_ROLE_PERMISSION = gql`
  mutation AdminSetRolePermission($roleId: ID!, $permissionId: ID!, $enabled: Boolean!, $forceSyncGranterRoles: Boolean) {
    adminSetRolePermission(roleId: $roleId, permissionId: $permissionId, enabled: $enabled, forceSyncGranterRoles: $forceSyncGranterRoles) {
      id
      name
      description
      permissions {
        id
        name
        description
      }
    }
  }
`;

export const QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS = gql`
  query adminListAssignablePermissions {
    adminListAssignablePermissions { id name description }
  }
`;

export const QUERY_ADMIN_GET_USER_RAW_PERMISSIONS = gql`
  query AdminGetUserRawPermissions($id: ID!) {
    adminGetUserRawPermissions(id: $id)
  }
`;

export const MUTATION_ADMIN_SET_USER_ROLE = gql`
  mutation AdminSetUserRole($id: ID!, $roleId: ID) {
    adminSetUserRole(id: $id, roleId: $roleId) {
      id
      role { id name }
    }
  }
`;

export const MUTATION_ADMIN_SET_USER_PERMISSION = gql`
  mutation AdminSetUserPermission($id: ID!, $permissionId: ID!, $enabled: Boolean!) {
    adminSetUserPermission(id: $id, permissionId: $permissionId, enabled: $enabled)
  }
`;

// Delegation matrix operations
export const QUERY_ADMIN_LIST_ROLE_GRANT_RULES = gql`
  query AdminListRoleGrantRules {
    adminListRoleGrantRules {
      id
      scope
      canAssign
      canRevoke
      canManage
      createdAt
      updatedAt
      granterRole {
        id
        name
        description
      }
      granteeRole {
        id
        name
        description
      }
    }
  }
`;

export const QUERY_ADMIN_LIST_PERMISSION_GRANT_RULES = gql`
  query AdminListPermissionGrantRules {
    adminListPermissionGrantRules {
      id
      scope
      canAssign
      canRevoke
      createdAt
      updatedAt
      granterRole {
        id
        name
        description
      }
      permission {
        id
        name
        description
      }
    }
  }
`;

export const MUTATION_ADMIN_CREATE_ROLE_GRANT_RULE = gql`
  mutation AdminCreateRoleGrantRule($input: CreateRoleGrantRuleInput!) {
    adminCreateRoleGrantRule(input: $input) {
      id
      scope
      canAssign
      canRevoke
      canManage
      granterRole {
        id
        name
      }
      granteeRole {
        id
        name
      }
    }
  }
`;

export const MUTATION_ADMIN_DELETE_ROLE_GRANT_RULE = gql`
  mutation AdminDeleteRoleGrantRule($id: ID!) {
    adminDeleteRoleGrantRule(id: $id)
  }
`;

export const MUTATION_ADMIN_CREATE_PERMISSION_GRANT_RULE = gql`
  mutation AdminCreatePermissionGrantRule($input: CreatePermissionGrantRuleInput!) {
    adminCreatePermissionGrantRule(input: $input) {
      id
      scope
      canAssign
      canRevoke
      granterRole {
        id
        name
      }
      permission {
        id
        name
      }
    }
  }
`;

export const MUTATION_ADMIN_DELETE_PERMISSION_GRANT_RULE = gql`
  mutation AdminDeletePermissionGrantRule($id: ID!) {
    adminDeletePermissionGrantRule(id: $id)
  }
`;


