-- Add columns to packing_sessions
ALTER TABLE "multitenant"."packing_sessions" ADD COLUMN IF NOT EXISTS "station_id" UUID;
ALTER TABLE "multitenant"."packing_sessions" ADD COLUMN IF NOT EXISTS "cartons_packed" INTEGER DEFAULT 0;
ALTER TABLE "multitenant"."packing_sessions" ADD COLUMN IF NOT EXISTS "items_packed" INTEGER DEFAULT 0;

-- Create packing_session_status_histories table
CREATE TABLE IF NOT EXISTS "multitenant"."packing_session_status_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "from_status" VARCHAR(50) NOT NULL,
    "to_status" VARCHAR(50) NOT NULL,
    "changed_by" UUID,
    "reason" VARCHAR(255),
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "packing_session_status_histories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pss_history_session_fkey" FOREIGN KEY ("session_id") REFERENCES "multitenant"."packing_sessions"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_packing_session_history_session" ON "multitenant"."packing_session_status_histories" ("tenant_id", "session_id", "changed_at");

-- Create shipment_status_histories table
CREATE TABLE IF NOT EXISTS "multitenant"."shipment_status_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "from_status" VARCHAR(50) NOT NULL,
    "to_status" VARCHAR(50) NOT NULL,
    "changed_by" UUID,
    "notes" TEXT,
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "shipment_status_histories_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_ship_status_history_shipment" ON "multitenant"."shipment_status_histories" ("tenant_id", "shipment_id", "changed_at");
