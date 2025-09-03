/*
  Warnings:

  - You are about to drop the column `canManage` on the `PermissionGrantRule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PermissionGrantRule" DROP COLUMN "canManage";
