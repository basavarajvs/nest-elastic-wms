-- ==============================================================
-- Phase 12: storage_client_rates
-- ==============================================================
CREATE TABLE multitenant.storage_client_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  rate_master_id UUID,
  client_id UUID,
  rate_per_unit DECIMAL(18,6),
  rate_currency CHAR(3) DEFAULT 'USD',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, rate_master_id, client_id)
);

-- ==============================================================
-- Phase 13: system_settings
-- ==============================================================
CREATE TABLE multitenant.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  value JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, setting_key)
);
CREATE INDEX idx_ss_tenant ON multitenant.system_settings(tenant_id);

-- ==============================================================
-- Phase 13: system_setting_histories
-- ==============================================================
CREATE TABLE multitenant.system_setting_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  setting_key VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ssh_key_time ON multitenant.system_setting_histories(tenant_id, setting_key, changed_at);

-- ==============================================================
-- Phase 13: wms_report_jobs
-- ==============================================================
CREATE TABLE multitenant.wms_report_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  parameters JSONB,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  row_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wrj_tenant_status_time ON multitenant.wms_report_jobs(tenant_id, status, created_at);

-- ==============================================================
-- Phase 13: db_rf_sessions
-- ==============================================================
CREATE TABLE multitenant.db_rf_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID,
  facility_id UUID,
  device_id VARCHAR(100),
  session_token VARCHAR(255),
  workflow_type VARCHAR(50),
  payload_json JSONB,
  state_json JSONB,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_dbrfs_user ON multitenant.db_rf_sessions(tenant_id, user_id);
CREATE INDEX idx_dbrfs_workflow ON multitenant.db_rf_sessions(tenant_id, workflow_type);

-- ==============================================================
-- Phase 13: supervisor_pins
-- ==============================================================
CREATE TABLE multitenant.supervisor_pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  pin_hash VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
CREATE INDEX idx_sp_user_active ON multitenant.supervisor_pins(tenant_id, user_id, is_active);

-- ==============================================================
-- Phase 15: resource_quotas
-- ==============================================================
CREATE TABLE multitenant.resource_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  limit_amount INTEGER NOT NULL,
  current_usage INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, resource_type)
);
