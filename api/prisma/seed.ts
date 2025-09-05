import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Stable admin capability set.
 * Delegation is controlled by RoleGrantRule/PermissionGrantRule,
 * not by static "assign" permissions.
 */
const DEFAULT_PERMISSIONS = [
  // ---- Users (operational) ----
  { name: 'ADMIN_USERS_VIEW_ALL', description: 'View and browse the list of all users in the system' },
  { name: 'ADMIN_USERS_SEARCH', description: 'Search and filter users by various criteria' },
  { name: 'ADMIN_USERS_UPDATE_PROFILE', description: 'Update user profile information' },
  { name: 'ADMIN_USERS_UPDATE_PASSWORD', description: 'Update user passwords and send password reset emails' },
  { name: 'ADMIN_USERS_UPDATE_ROLES', description: 'Assign or remove roles for users (subject to delegation rules)' },
  { name: 'ADMIN_USERS_UPDATE_DIRECT_PERMISSIONS', description: 'Assign or remove direct permissions for users (subject to delegation rules)' },
  { name: 'ADMIN_USERS_DELETE', description: 'Permanently delete users from the system' },
  { name: 'ADMIN_USERS_IMPERSONATE', description: 'Temporarily act as another user to troubleshoot issues' },

  // ---- Roles (CRUD) • assignment governed by RoleGrantRule ----
  { name: 'ADMIN_ROLES_VIEW', description: 'View roles and their permissions' },
  { name: 'ADMIN_ROLES_CREATE', description: 'Create new roles' },
  { name: 'ADMIN_ROLES_UPDATE', description: 'Edit role name/description/permissions' },
  { name: 'ADMIN_ROLES_DELETE', description: 'Delete roles' },

  // ---- Grant Matrix (who can grant what) ----
  { name: 'ADMIN_ROLE_GRANT_RULES_VIEW', description: 'View role grant rules (delegation matrix)' },
  { name: 'ADMIN_ROLE_GRANT_RULES_CREATE', description: 'Create new grant rules (who can assign which roles)' },
  { name: 'ADMIN_ROLE_GRANT_RULES_DELETE', description: 'Delete or revoke grant rules' },
  { name: 'ADMIN_PERMISSION_GRANT_RULES_VIEW', description: 'View permission grant rules (delegation matrix)' },
  { name: 'ADMIN_PERMISSION_GRANT_RULES_CREATE', description: 'Create new permission grant rules (who can assign which permissions)' },
  { name: 'ADMIN_PERMISSION_GRANT_RULES_DELETE', description: 'Delete or revoke permission grant rules' },

  // ---- Permissions (read-only; helpful for audits & UI) ----
  { name: 'ADMIN_PERMISSIONS_VIEW', description: 'View all defined permissions and where they\'re used' },

  // ---- System ----
  { name: 'ADMIN_DEBUG', description: 'Access debug tools and system information for troubleshooting' },
] as const;

type RoleConfig = { name: string; description?: string; include?: string[]; exclude?: string[] };
const ROLES_CONFIG: RoleConfig[] = [
  {
    name: 'Super Admin',
    description: 'Super administrator with all permissions',
    include: ['*'],
  },
  {
    name: 'Admin',
    description: 'Administrator with all permissions except role/permission delegation',
    exclude: ['ADMIN_ROLE_GRANT_RULES_VIEW', 'ADMIN_ROLE_GRANT_RULES_CREATE', 'ADMIN_ROLE_GRANT_RULES_DELETE', 'ADMIN_PERMISSION_GRANT_RULES_VIEW', 'ADMIN_PERMISSION_GRANT_RULES_CREATE', 'ADMIN_PERMISSION_GRANT_RULES_DELETE'],
  },
  {
    name: "Customer",
    description: 'Customer with access to all features',
    exclude: ['ADMIN_USERS_VIEW_ALL', 'ADMIN_USERS_SEARCH', 'ADMIN_USERS_UPDATE_PROFILE', 'ADMIN_USERS_UPDATE_PASSWORD', 'ADMIN_USERS_DELETE', 'ADMIN_USERS_IMPERSONATE', 'ADMIN_DEBUG', 'ADMIN_ROLES_VIEW', 'ADMIN_ROLES_CREATE', 'ADMIN_ROLES_UPDATE', 'ADMIN_ROLES_DELETE', 'ADMIN_ROLE_GRANT_RULES_VIEW', 'ADMIN_ROLE_GRANT_RULES_CREATE', 'ADMIN_ROLE_GRANT_RULES_DELETE', 'ADMIN_PERMISSION_GRANT_RULES_VIEW', 'ADMIN_PERMISSION_GRANT_RULES_CREATE', 'ADMIN_PERMISSION_GRANT_RULES_DELETE', 'ADMIN_PERMISSIONS_VIEW'],
  }
];

async function main() {
  console.log('[seed] Starting seed');

  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL;

  // Delete all existing roles and permissions
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  // 1) Seed permissions (idempotent)
  const permissions = await Promise.all(
    DEFAULT_PERMISSIONS.map((p) =>
      prisma.permission.upsert({
        where: { name: p.name },
        update: { description: p.description },
        create: { name: p.name, description: p.description },
      })
    )
  );

  console.log('[seed] Created permissions:', permissions.map(p => p.name));

  // 2) Create roles from roles.json
  for (const roleDef of ROLES_CONFIG) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      create: { name: roleDef.name, description: roleDef.description },
      update: { description: roleDef.description },
    });

    const includeAll = roleDef.include?.includes('*');
    const excluded = new Set(roleDef.exclude ?? []);
    for (const permission of permissions) {
      if (!includeAll && roleDef.include && !roleDef.include.includes(permission.name)) continue;
      if (excluded.has(permission.name)) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
    console.log(`[seed] Ensured role ${roleDef.name}`);
  }

  // 3) SUPER_ADMIN role
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found');
  }

  // 4) SUPER_ADMIN user (only if email is provided)
  if (superAdminEmail) {
    // Check if user already exists
    const user = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    });

    if (!user) {
      console.log(`User with email ${superAdminEmail} not found. Skipping Super Admin role assignment.`);
    } else {
      console.log(`Found existing user: ${superAdminEmail}`);

      // 5) Assign Super Admin role to that user
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
        update: {},
        create: { userId: user.id, roleId: superAdminRole.id },
      });

      console.log(`Super Admin role assigned to: ${superAdminEmail}`);
    }
  }

  // 6) Wildcard grant rules (no-families):
  //    - Super Admin → ALL ROLES
  const wildcardRoleGrant = await prisma.roleGrantRule.findFirst({
    where: { granterRoleId: superAdminRole.id, scope: 'ALL', canAssign: true },
  });
  if (!wildcardRoleGrant) {
    await prisma.roleGrantRule.create({
      data: {
        granterRoleId: superAdminRole.id,
        scope: 'ALL',
        canAssign: true,
        canRevoke: true,
        canManage: true, // explicitly global governor
      },
    });
  }

  //    - Super Admin → ALL PERMISSIONS (direct user permissions)
  const wildcardPermGrant = await prisma.permissionGrantRule.findFirst({
    where: { granterRoleId: superAdminRole.id, scope: 'ALL', canAssign: true },
  });
  if (!wildcardPermGrant) {
    await prisma.permissionGrantRule.create({
      data: {
        granterRoleId: superAdminRole.id,
        scope: 'ALL',
        canAssign: true,
        canRevoke: true
      },
    });
  }

  // Ensure ADMIN role has permission delegation (ALL) but no global role governance
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (adminRole) {
    const adminPermGrant = await prisma.permissionGrantRule.findFirst({
      where: { granterRoleId: adminRole.id, scope: 'ALL' },
    });
    if (!adminPermGrant) {
      await prisma.permissionGrantRule.create({
        data: {
          granterRoleId: adminRole.id,
          scope: 'ALL',
          canAssign: true,
          canRevoke: true,
        },
      });
    }
    // Note: No RoleGrantRule is created for ADMIN to explicitly avoid global role governance
  }

  console.log('✅ Seed complete.');
  if (superAdminEmail) {
    console.log(`Super Admin user: ${superAdminEmail}`);
  } else {
    console.log('No Super Admin user created (SEED_SUPER_ADMIN_EMAIL not set)');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


