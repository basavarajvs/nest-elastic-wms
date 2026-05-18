ALTER TABLE multitenant.external_entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.sync_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_eem_tenant ON multitenant.external_entity_mappings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_isl_tenant ON multitenant.integration_sync_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_swl_tenant ON multitenant.sync_webhook_logs (tenant_id);

DO $$
DECLARE tbl text; tables text[] := ARRAY['external_entity_mappings', 'integration_sync_logs', 'sync_webhook_logs'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY tenant_isolation_%1$s ON multitenant.%1$s USING (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_insert_%1$s ON multitenant.%1$s WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_update_%1$s ON multitenant.%1$s USING (tenant_id = current_setting(''app.tenant_id'')::uuid) WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_delete_%1$s ON multitenant.%1$s USING (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
  END LOOP;
END $$;
