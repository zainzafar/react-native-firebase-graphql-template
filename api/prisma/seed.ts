import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define default permissions
const DEFAULT_PERMISSIONS = [
  { name: 'ADMIN_USERS_VIEW', description: 'View admin users' },
  { name: 'ADMIN_USERS_SEARCH', description: 'Search admin users' },
  { name: 'ADMIN_USERS_EDIT', description: 'Edit admin users' },
  { name: 'ADMIN_USERS_DELETE', description: 'Delete admin users' },
  { name: 'ADMIN_USERS_IMPERSONATE', description: 'Impersonate admin users' },
  { name: 'ADMIN_DEBUG', description: 'Access debug features' },
];

async function main() {
  console.log('[seed] Starting seed');

  // Create permissions
  const permissions = [];
  for (const perm of DEFAULT_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      create: perm,
      update: { description: perm.description },
    });
    permissions.push(permission);
  }

  console.log('[seed] Created permissions:', permissions.map(p => p.name));

  // Create the SUPER_ADMIN role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    create: { 
      name: 'SUPER_ADMIN',
      description: 'Super administrator with all permissions'
    },
    update: {},
  });

  console.log('[seed] Created SUPER_ADMIN role');

  // Set up default role permissions - SUPER_ADMIN gets all permissions
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { 
        roleId_permissionId: { 
          roleId: superAdminRole.id, 
          permissionId: permission.id 
        } 
      },
      create: { 
        roleId: superAdminRole.id, 
        permissionId: permission.id 
      },
      update: {},
    });
  }

  console.log('[seed] Set up default role permissions');

  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) {
    console.log('[seed] SEED_SUPER_ADMIN_EMAIL not set; skipping role grant');
    return;
  }

  const user = await prisma.user.findFirst({ where: { email: superAdminEmail } });
  if (!user) {
    console.warn(`[seed] No user found with email ${superAdminEmail}; ensure the user logs in once to be created.`);
    return;
  }
  
  // Grant SUPER_ADMIN role to the user
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
    create: { userId: user.id, roleId: superAdminRole.id },
    update: {},
  });

  console.log(`[seed] Granted SUPER_ADMIN to ${superAdminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


