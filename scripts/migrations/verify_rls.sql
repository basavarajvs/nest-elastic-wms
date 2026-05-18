-- ── RLS Verification Script ──
-- Run after legacy migration to verify:
--   1. All migrated rows visible under correct tenant context
--   2. Cross-tenant queries return 0 rows
-- Usage: pnpx prisma db execute --stdin < scripts/migrations/verify_rls.sql

-- Step 1: Verify product count matches CSV
-- Replace :tenant_id with the actual migrated tenant UUID
SELECT
  'products' as entity,
  COUNT(*) as total_rows
FROM multitenant.products
WHERE tenant_id = :tenant_id;

-- Step 2: Verify no other tenant can see migrated rows
SELECT
  'cross_tenant_check' as check_name,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM multitenant.products
WHERE tenant_id != :tenant_id
  AND product_code LIKE 'MIGRATED-%';

-- Step 3: Verify RLS is active — must return error when app.tenant_id is empty
SET session_replication_role = 'origin';
SET app.tenant_id = '';

-- Should return 0 rows (RLS blocking unauthenticated access)
SELECT
  'rls_empty_tenant' as check_name,
  COUNT(*) as visible_rows
FROM multitenant.products
WHERE product_code LIKE 'MIGRATED-%';

-- Step 4: Verify RLS with proper tenant id
SET app.tenant_id = :tenant_id;

SELECT
  'rls_correct_tenant' as check_name,
  COUNT(*) as visible_rows
FROM multitenant.products
WHERE product_code LIKE 'MIGRATED-%';

-- Step 5: Verify legacy_id_mapping was populated (if applicable)
SELECT
  'legacy_id_mapping' as check_name,
  COUNT(*) as mapping_count
FROM multitenant.external_entity_mapping
WHERE tenant_id = :tenant_id;
