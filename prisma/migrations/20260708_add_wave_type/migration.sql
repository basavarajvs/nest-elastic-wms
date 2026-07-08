ALTER TABLE multitenant.picking_waves ADD COLUMN IF NOT EXISTS wave_type VARCHAR(30) NOT NULL DEFAULT 'PICKING';
ALTER TABLE multitenant.picking_waves ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ(6);
