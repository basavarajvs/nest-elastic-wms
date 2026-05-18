-- Enable RLS on all WMS tables
ALTER TABLE multitenant.resource_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.warehouse_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.storage_locations ENABLE ROW LEVEL SECURITY;

-- Create composite indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_rq_tenant ON multitenant.resource_quotas USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wf_tenant ON multitenant.warehouse_facilities USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wz_tenant ON multitenant.warehouse_zones USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sl_tenant ON multitenant.storage_locations USING btree (tenant_id);

-- USING + WITH CHECK policies for tenant isolation
DO $$
DECLARE
    tables text[] := ARRAY['resource_quotas', 'warehouse_facilities', 'warehouse_zones', 'storage_locations'];
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format('
            CREATE POLICY tenant_isolation_%1$s ON multitenant.%1$s
            FOR ALL
            USING (tenant_id = current_setting(''app.tenant_id'')::uuid);
        ', tbl);
        EXECUTE format('
            CREATE POLICY tenant_insert_%1$s ON multitenant.%1$s
            FOR INSERT
            WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);
        ', tbl);
        EXECUTE format('
            CREATE POLICY tenant_update_%1$s ON multitenant.%1$s
            FOR UPDATE
            USING (tenant_id = current_setting(''app.tenant_id'')::uuid)
            WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);
        ', tbl);
        EXECUTE format('
            CREATE POLICY tenant_delete_%1$s ON multitenant.%1$s
            FOR DELETE
            USING (tenant_id = current_setting(''app.tenant_id'')::uuid);
        ', tbl);
    END LOOP;
END $$;
