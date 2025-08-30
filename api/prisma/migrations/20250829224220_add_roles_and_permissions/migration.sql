-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPermission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "Role_name_idx" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_name_idx" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "public"."UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "public"."UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "public"."UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "public"."RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "public"."RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "public"."RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "public"."UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_permissionId_idx" ON "public"."UserPermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "public"."UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_displayName_idx" ON "public"."User"("displayName");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "public"."User"("phoneNumber");

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
