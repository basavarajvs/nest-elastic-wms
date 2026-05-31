-- P2: Carrier Rate Shopping
CREATE TABLE IF NOT EXISTS "multitenant"."carrier_rates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "carrier_id" UUID NOT NULL,
    "service_code" VARCHAR(50) NOT NULL,
    "service_name" VARCHAR(255),
    "zone" VARCHAR(20),
    "weight_from" REAL,
    "weight_to" REAL,
    "base_rate" DECIMAL(12,4),
    "rate_per_kg" DECIMAL(12,4),
    "fuel_surcharge" DECIMAL(5,2),
    "min_charge" DECIMAL(12,4),
    "transit_days_min" INTEGER,
    "transit_days_max" INTEGER,
    "effective_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "expiry_date" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "carrier_rates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "carrier_rates_uq" UNIQUE ("tenant_id", "carrier_id", "service_code", "zone", "effective_date")
);
CREATE INDEX IF NOT EXISTS "idx_carrier_rates_carrier" ON "multitenant"."carrier_rates"("tenant_id", "carrier_id");
