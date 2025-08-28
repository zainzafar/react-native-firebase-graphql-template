/*
  One-time import script to sync Firebase Auth users into local DB (User, UserIdentity)
  Usage: ts-node src/scripts/import-firebase-users.ts (or via npm script)
*/

import 'dotenv/config';
import { getPrisma } from '../src/services/prisma';
import { getFirebaseAuth, ensureFirebaseInitialized } from '../src/services/firebaseAdmin';

type ImportedStats = {
  usersUpserted: number;
  identitiesUpserted: number;
};

async function importAllUsers(): Promise<ImportedStats> {
  ensureFirebaseInitialized();
  const auth = getFirebaseAuth();
  const prisma = getPrisma();

  let nextPageToken: string | undefined = undefined;
  let usersUpserted = 0;
  let identitiesUpserted = 0;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    for (const u of result.users) {
      const email = u.email ?? null;
      const phoneNumber = u.phoneNumber ?? null;
      const displayName = u.displayName ?? null;
      const photoURL = u.photoURL ?? null;
      const emailVerified = !!u.emailVerified;

      // Upsert user by uid
      const dbUser = await prisma.user.upsert({
        where: { uid: u.uid },
        update: {
          email,
          phoneNumber,
          displayName,
          photoURL,
          emailVerified,
          // Note: We do not set lastLoginProvider here as Firebase doesn't expose it directly
        },
        create: {
          uid: u.uid,
          email,
          phoneNumber,
          displayName,
          photoURL,
          emailVerified,
        },
      });
      usersUpserted += 1;

      // Sync provider identities
      const providerData = Array.isArray(u.providerData) ? u.providerData : [];
      for (const p of providerData) {
        if (!p.providerId || !p.uid) continue;
        await prisma.userIdentity.upsert({
          where: { providerId_providerUid: { providerId: p.providerId, providerUid: p.uid } },
          update: {
            userId: dbUser.id,
            lastUsedAt: new Date(),
          },
          create: {
            userId: dbUser.id,
            providerId: p.providerId,
            providerUid: p.uid,
            lastUsedAt: new Date(),
          },
        });
        identitiesUpserted += 1;
      }
    }
    nextPageToken = result.pageToken as any;
  } while (nextPageToken);

  return { usersUpserted, identitiesUpserted };
}

async function main() {
  try {
    const stats = await importAllUsers();
    // eslint-disable-next-line no-console
    console.log(`Import complete: users=${stats.usersUpserted}, identities=${stats.identitiesUpserted}`);
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Import failed:', err);
    process.exit(1);
  }
}

main();


