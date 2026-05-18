-- CreateTable
CREATE TABLE "multitenant"."sales_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "client_code" VARCHAR(50) NOT NULL,
    "status" "multitenant"."OrderStatus" NOT NULL DEFAULT 'CREATED',
    "order_type" VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    "priority" INTEGER NOT NULL DEFAULT 10,
    "delivery_address" JSON,
    "requested_delivery_date" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."sales_order_lines" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "requested_quantity" DOUBLE PRECISION NOT NULL,
    "fulfilled_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" UUID NOT NULL,
    "status" "multitenant"."OrderLineStatus" NOT NULL DEFAULT 'CREATED',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sales_order_lines_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."inventory_allocations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "lot_id" UUID,
    "location_id" UUID NOT NULL,
    "quantity_allocated" DOUBLE PRECISION NOT NULL,
    "uom_id" UUID NOT NULL,
    "allocation_type" "multitenant"."AllocationType" NOT NULL,
    "status" "multitenant"."AllocationStatus" NOT NULL DEFAULT 'SOFT',
    "order_id" UUID NOT NULL,
    "order_line_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "inventory_allocations_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."picking_waves" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "wave_number" VARCHAR(50) NOT NULL,
    "status" "multitenant"."WaveStatus" NOT NULL DEFAULT 'PLANNED',
    "selection_criteria" JSON,
    "total_tasks" INTEGER NOT NULL DEFAULT 0,
    "completed_tasks" INTEGER NOT NULL DEFAULT 0,
    "released_by_user_id" UUID,
    "released_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "picking_waves_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."picking_tasks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "task_number" VARCHAR(50) NOT NULL,
    "wave_id" UUID,
    "order_line_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "lot_id" UUID,
    "quantity_to_pick" DOUBLE PRECISION NOT NULL,
    "quantity_picked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    "assigned_to_user_id" UUID,
    "assigned_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "exception_notes" TEXT,
    "sequence_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "picking_tasks_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."packing_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "station_code" VARCHAR(50),
    "status" "multitenant"."PackingSessionStatus" NOT NULL DEFAULT 'STATION_ASSIGNED',
    "start_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_at" TIMESTAMPTZ,
    "last_activity_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "packing_sessions_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."packing_containers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "container_code" VARCHAR(50) NOT NULL,
    "container_type" VARCHAR(20) NOT NULL,
    "status" "multitenant"."ContainerStatus" NOT NULL DEFAULT 'ACTIVE',
    "weight" DOUBLE PRECISION,
    "tracking_number" VARCHAR(100),
    "carrier_code" VARCHAR(20),
    "picked_lpns" JSON,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "packing_containers_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."outbound_shipments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "shipment_number" VARCHAR(50) NOT NULL,
    "order_id" UUID,
    "load_id" VARCHAR(50),
    "status" "multitenant"."ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "carrier_code" VARCHAR(20),
    "tracking_number" VARCHAR(100),
    "dock_door_code" VARCHAR(20),
    "shipped_at" TIMESTAMPTZ,
    "containers" JSON,
    "order_line_shipments" JSON,
    "label_url" VARCHAR(500),
    "metadata" JSON,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "outbound_shipments_pkey" PRIMARY KEY ("id")
);


ALTER TABLE "multitenant"."sales_order_lines" ADD CONSTRAINT "sales_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "multitenant"."sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "multitenant"."inventory_allocations" ADD CONSTRAINT "inventory_allocations_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "multitenant"."sales_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "multitenant"."picking_tasks" ADD CONSTRAINT "picking_tasks_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "multitenant"."picking_waves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "multitenant"."picking_tasks" ADD CONSTRAINT "picking_tasks_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "multitenant"."sales_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "multitenant"."packing_containers" ADD CONSTRAINT "packing_containers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "multitenant"."packing_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE multitenant.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.sales_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.inventory_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.picking_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.picking_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.packing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.packing_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.outbound_shipments ENABLE ROW LEVEL SECURITY;

-- Indexes for RLS + Performance
CREATE INDEX IF NOT EXISTS idx_so_tenant ON multitenant.sales_orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sol_tenant ON multitenant.sales_order_lines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_alloc_tenant ON multitenant.inventory_allocations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wave_tenant ON multitenant.picking_waves (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ptask_tenant ON multitenant.picking_tasks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_psess_tenant ON multitenant.packing_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pcont_tenant ON multitenant.packing_containers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_oshp_tenant ON multitenant.outbound_shipments (tenant_id);

-- Policies
DO $$
DECLARE
  tables text[] := ARRAY['sales_orders', 'sales_order_lines', 'inventory_allocations', 'picking_waves', 'picking_tasks', 'packing_sessions', 'packing_containers', 'outbound_shipments'];
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
