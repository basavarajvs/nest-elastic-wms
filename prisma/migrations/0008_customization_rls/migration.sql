ALTER TABLE multitenant.wms_state_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.wms_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.wms_bpmn_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.wms_execution_instances ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wsm_tenant ON multitenant.wms_state_machines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wr_tenant ON multitenant.wms_rules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wbp_tenant ON multitenant.wms_bpmn_processes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wei_tenant ON multitenant.wms_execution_instances (tenant_id);

DO $$
DECLARE tbl text; tables text[] := ARRAY['wms_state_machines', 'wms_rules', 'wms_bpmn_processes', 'wms_execution_instances'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY tenant_isolation_%1$s ON multitenant.%1$s USING (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_insert_%1$s ON multitenant.%1$s WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
  END LOOP;
END $$;
