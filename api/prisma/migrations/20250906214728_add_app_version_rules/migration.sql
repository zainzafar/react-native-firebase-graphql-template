-- CreateEnum
CREATE TYPE "public"."AppPlatform" AS ENUM ('ios', 'android');

-- CreateTable
CREATE TABLE "public"."AppVersionRule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platform" "public"."AppPlatform" NOT NULL,
    "minVersion" TEXT NOT NULL,
    "latestVersion" TEXT NOT NULL,
    "enforced" BOOLEAN NOT NULL DEFAULT false,
    "forceAt" TIMESTAMP(3),
    "message" TEXT,
    "storeUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AppVersionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppVersionRule_platform_createdAt_idx" ON "public"."AppVersionRule"("platform", "createdAt");
