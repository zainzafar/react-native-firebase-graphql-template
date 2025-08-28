import { PrismaClient, Permission } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Starting seed');

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

  // Set up default role permissions
  const rolePermissions = [
    // SUPER_ADMIN gets all permissions
    { roleId: superAdminRole.id, permissions: Object.values(Permission) }
  ];

  // Create role permissions
  for (const { roleId, permissions } of rolePermissions) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permission: { roleId, permission } },
        create: { roleId, permission },
        update: {},
      });
    }
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


