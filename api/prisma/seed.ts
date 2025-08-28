import { PrismaClient, Role, Permission } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Starting seed');

  // Set up default role permissions
  const rolePermissions = [
    // SUPER_ADMIN gets all permissions
    { role: Role.SUPER_ADMIN, permissions: Object.values(Permission) }
  ];

  // Create role permissions
  for (const { role, permissions } of rolePermissions) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        create: { role, permission },
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
    where: { userId_role: { userId: user.id, role: Role.SUPER_ADMIN } },
    create: { userId: user.id, role: Role.SUPER_ADMIN },
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


