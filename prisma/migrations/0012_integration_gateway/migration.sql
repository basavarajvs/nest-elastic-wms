CREATE TYPE multitenant."ExternalPlatform" AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'CUSTOM_ERP', 'GENERIC_API');
CREATE TYPE multitenant."SyncDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'BIDIRECTIONAL');
CREATE TYPE multitenant."SyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL');
CREATE TYPE multitenant."BarcodeContext" AS ENUM ('PRODUCT', 'LOCATION', 'LPN', 'ORDER', 'TASK');

CREATE TABLE multitenant.external_entity_mappings (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id       uuid NOT NULL,
    platform        multitenant."ExternalPlatform" NOT NULL,
    external_id     varchar(255) NOT NULL,
    entity_type     varchar(50) NOT NULL,
    wms_entity_id   uuid NOT NULL,
    wms_entity_type varchar(50) NOT NULL,
    sync_direction  multitenant."SyncDirection" DEFAULT 'BIDIRECTIONAL',
    historical_skus varchar(100)[] DEFAULT '{}',
    last_synced_at  timestamptz DEFAULT now(),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX eem_external_uq ON multitenant.external_entity_mappings (tenant_id, platform, external_id, entity_type);
CREATE INDEX idx_eem_platform_entity ON multitenant.external_entity_mappings (tenant_id, platform, entity_type);
CREATE INDEX idx_eem_wms_entity ON multitenant.external_entity_mappings (tenant_id, wms_entity_id, wms_entity_type);

CREATE TABLE multitenant.integration_sync_logs (
    id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id         uuid NOT NULL,
    platform          multitenant."ExternalPlatform" NOT NULL,
    sync_type         varchar(50) NOT NULL,
    status            multitenant."SyncStatus" DEFAULT 'PENDING',
    records_processed int DEFAULT 0,
    records_succeeded int DEFAULT 0,
    records_failed    int DEFAULT 0,
    error_summary     text,
    started_at        timestamptz DEFAULT now(),
    completed_at      timestamptz,
    created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_isl_status_time ON multitenant.integration_sync_logs (tenant_id, platform, status, started_at DESC);

CREATE TABLE multitenant.sync_webhook_logs (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id       uuid NOT NULL,
    platform        multitenant."ExternalPlatform" NOT NULL,
    event_type      varchar(100) NOT NULL,
    external_ref_id varchar(255),
    payload_hash    varchar(64) NOT NULL,
    processed       boolean DEFAULT false,
    processed_at    timestamptz,
    received_at     timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX swl_dedup_uq ON multitenant.sync_webhook_logs (tenant_id, platform, payload_hash);
CREATE INDEX idx_swl_received ON multitenant.sync_webhook_logs (tenant_id, platform, received_at DESC);
