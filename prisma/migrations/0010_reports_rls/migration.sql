ALTER TABLE multitenant.wms_report_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_wrj_tenant ON multitenant.wms_report_jobs USING btree (tenant_id);

CREATE POLICY tenant_isolation_wms_report_jobs ON multitenant.wms_report_jobs
USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert_wms_report_jobs ON multitenant.wms_report_jobs
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
