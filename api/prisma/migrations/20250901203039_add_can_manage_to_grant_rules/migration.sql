-- AlterTable
ALTER TABLE "public"."PermissionGrantRule" ADD COLUMN     "canManage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."RoleGrantRule" ADD COLUMN     "canManage" BOOLEAN NOT NULL DEFAULT false;
