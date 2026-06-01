-- Add line_number and notes to asn_lines
ALTER TABLE "multitenant"."asn_lines" ADD COLUMN IF NOT EXISTS "line_number" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "multitenant"."asn_lines" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add line_number and notes to goods_receipt_lines
ALTER TABLE "multitenant"."goods_receipt_lines" ADD COLUMN IF NOT EXISTS "line_number" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "multitenant"."goods_receipt_lines" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add unit_price and line_number to sales_order_lines
ALTER TABLE "multitenant"."sales_order_lines" ADD COLUMN IF NOT EXISTS "unit_price" DOUBLE PRECISION;
ALTER TABLE "multitenant"."sales_order_lines" ADD COLUMN IF NOT EXISTS "line_number" INTEGER NOT NULL DEFAULT 0;
