-- AlterTable
ALTER TABLE "public"."Role" ADD COLUMN     "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Role_createdByUserId_idx" ON "public"."Role"("createdByUserId");

-- AddForeignKey
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
