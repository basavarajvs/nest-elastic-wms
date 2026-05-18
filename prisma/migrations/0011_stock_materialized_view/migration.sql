CREATE MATERIALIZED VIEW IF NOT EXISTS multitenant.mat_stock_on_hand AS
SELECT
  p.id AS product_id,
  p.product_code,
  p.name AS product_name,
  p.velocity_class,
  loc.id AS location_id,
  loc.location_code,
  z.zone_code,
  loc.location_type,
  l.id AS lot_id,
  l.lot_number,
  l.expiry_date,
  u.id AS uom_id,
  u.code AS uom_code,
  ioh.facility_id,
  ioh.tenant_id,
  SUM(ioh.quantity_on_hand) AS on_hand,
  SUM(ioh.quantity_allocated) AS allocated,
  SUM(ioh.quantity_reserved) AS reserved,
  SUM(ioh.quantity_on_hand) - SUM(ioh.quantity_allocated) - SUM(ioh.quantity_reserved) AS available
FROM multitenant.inventory_on_hand ioh
JOIN multitenant.products p ON p.id = ioh.product_id AND p.tenant_id = ioh.tenant_id
JOIN multitenant.storage_locations loc ON loc.id = ioh.location_id AND loc.tenant_id = ioh.tenant_id
JOIN multitenant.warehouse_zones z ON z.id = loc.zone_id AND z.tenant_id = ioh.tenant_id
LEFT JOIN multitenant.inventory_lots l ON l.id = ioh.lot_id
JOIN multitenant.units_of_measure u ON u.id = ioh.uom_id
WHERE loc.is_active = true
GROUP BY p.id, loc.id, z.id, l.id, u.id, ioh.facility_id, ioh.tenant_id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mat_soh_pk
ON multitenant.mat_stock_on_hand (tenant_id, product_id, location_id, COALESCE(lot_id, '00000000-0000-0000-0000-000000000000'), uom_id);

CREATE INDEX IF NOT EXISTS idx_mat_soh_tenant
ON multitenant.mat_stock_on_hand (tenant_id, facility_id, location_code, product_code);

CREATE OR REPLACE FUNCTION multitenant.refresh_mat_stock_on_hand()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY multitenant.mat_stock_on_hand;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_mat_soh ON multitenant.inventory_transactions;
CREATE TRIGGER trg_refresh_mat_soh
AFTER INSERT OR UPDATE OR DELETE ON multitenant.inventory_transactions
FOR EACH STATEMENT
EXECUTE FUNCTION multitenant.refresh_mat_stock_on_hand();
