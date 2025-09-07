CREATE UNIQUE INDEX uniq_active_rule_per_platform
ON "AppVersionRule" ("platform")
WHERE "isActive" = TRUE;