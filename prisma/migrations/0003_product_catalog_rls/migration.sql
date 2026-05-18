-- Enable RLS on all product catalog tables
ALTER TABLE multitenant.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.product_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.product_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.product_import_results ENABLE ROW LEVEL SECURITY;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_pc_tenant ON multitenant.product_categories USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_uom_tenant ON multitenant.units_of_measure USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_prod_tenant ON multitenant.products USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pb_code_tenant ON multitenant.product_barcodes USING btree (barcode_value, tenant_id);
CREATE INDEX IF NOT EXISTS idx_pa_tenant ON multitenant.product_attributes USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pij_tenant ON multitenant.product_import_jobs USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pir_tenant ON multitenant.product_import_results USING btree (tenant_id);

-- RLS policies for all product catalog tables
DO $$
DECLARE
    tables text[] := ARRAY['product_categories', 'units_of_measure', 'products', 'product_barcodes', 'product_attributes', 'product_import_jobs', 'product_import_results'];
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
