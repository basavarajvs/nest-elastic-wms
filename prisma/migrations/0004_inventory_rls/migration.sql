-- Enable RLS on all inventory tables
ALTER TABLE multitenant.inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.inventory_on_hand ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.inventory_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.inventory_adjustment_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.inventory_policies ENABLE ROW LEVEL SECURITY;

-- Indexes for RLS + Query Performance
CREATE INDEX IF NOT EXISTS idx_lot_tenant ON multitenant.inventory_lots USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_onhand_tenant ON multitenant.inventory_on_hand USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_txn_tenant ON multitenant.inventory_transactions USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_hold_tenant ON multitenant.inventory_holds USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_adj_tenant ON multitenant.inventory_adjustments USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_adjl_tenant ON multitenant.inventory_adjustment_lines USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pol_tenant ON multitenant.inventory_policies USING btree (tenant_id);

-- RLS policies for all inventory tables
DO $$
DECLARE
  tables text[] := ARRAY['inventory_lots', 'inventory_on_hand', 'inventory_transactions', 'inventory_holds', 'inventory_adjustments', 'inventory_adjustment_lines', 'inventory_policies'];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('CREATE POLICY tenant_isolation_%1$s ON multitenant.%1$s FOR ALL USING (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_insert_%1$s ON multitenant.%1$s FOR INSERT WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_update_%1$s ON multitenant.%1$s FOR UPDATE USING (tenant_id = current_setting(''app.tenant_id'')::uuid) WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_delete_%1$s ON multitenant.%1$s FOR DELETE USING (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
  END LOOP;
END $$;
