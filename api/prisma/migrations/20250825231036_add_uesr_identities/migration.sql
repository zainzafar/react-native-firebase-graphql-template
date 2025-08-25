/*
  Warnings:

  - You are about to drop the column `providerId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "providerId",
ADD COLUMN     "lastLoginProvider" TEXT;

-- CreateTable
CREATE TABLE "public"."UserIdentity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerUid" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "UserIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserIdentity_userId_idx" ON "public"."UserIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentity_providerId_providerUid_key" ON "public"."UserIdentity"("providerId", "providerUid");

-- AddForeignKey
ALTER TABLE "public"."UserIdentity" ADD CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
