-- Add database constraints for delegation rules
-- This ensures data consistency between scope and target fields

-- RoleGrantRule constraints
ALTER TABLE "RoleGrantRule" 
ADD CONSTRAINT "rolegrant_scope_check" 
CHECK (
  (scope = 'ALL' AND "granteeRoleId" IS NULL) OR 
  (scope = 'ROLE' AND "granteeRoleId" IS NOT NULL)
);

-- PermissionGrantRule constraints  
ALTER TABLE "PermissionGrantRule" 
ADD CONSTRAINT "permgrant_scope_check" 
CHECK (
  (scope = 'ALL' AND "permissionId" IS NULL) OR 
  (scope = 'PERMISSION' AND "permissionId" IS NOT NULL)
);

-- Add comments to document the constraints
COMMENT ON CONSTRAINT "rolegrant_scope_check" ON "RoleGrantRule" IS 
'Ensures that scope=ALL requires granteeRoleId to be null, and scope=ROLE requires granteeRoleId to be non-null';

COMMENT ON CONSTRAINT "permgrant_scope_check" ON "PermissionGrantRule" IS 
'Ensures that scope=ALL requires permissionId to be null, and scope=PERMISSION requires permissionId to be non-null';
