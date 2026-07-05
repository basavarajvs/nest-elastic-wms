# Phase 1 — Master Data & Warehouse Structure

**Goal:** Foundational entities referenced by every other domain.

**Depends on:** P0

---

## Models (33 existing, 1 new table)

### Existing Tables in DB

| # | Schema Model | Table Name | Domain Module |
|---|-------------|------------|---------------|
| 1 | clients | `clients` | master-data/clients |
| 2 | client_addresses | `client_addresses` | master-data/clients |
| 3 | client_contacts | `client_contacts` | master-data/clients |
| 4 | client_facility_assignments | `client_facility_assignments` | master-data/clients |
| 5 | vendors | `vendors` | master-data/vendors |
| 6 | vendor_addresses | `vendor_addresses` | master-data/vendors |
| 7 | vendor_contacts | `vendor_contacts` | master-data/vendors |
| 8 | products | `products` | master-data/products |
| 9 | product_brands | `product_brands` | master-data/products |
| 10 | product_categories | `product_categories` | master-data/products |
| 11 | product_attributes | `product_attributes` | master-data/products |
| 12 | product_barcodes | `product_barcodes` | master-data/products |
| 13 | product_variants | `product_variants` | master-data/products |
| 14 | product_suppliers | `product_suppliers` | master-data/products |
| 15 | product_packaging_hierarchy | `product_packaging_hierarchy` | master-data/products |
| 16 | product_client_assignments | `product_client_assignments` | master-data/products |
| 17 | product_velocity_classification | `product_velocity_classification` | master-data/products |
| 18 | product_import_jobs | `product_import_jobs` | master-data/products |
| 19 | product_import_results | `product_import_results` | master-data/products |
| 20 | carriers | `carriers` | master-data/carriers |
| 21 | customers | `customers` | master-data/customers |
| 22 | units_of_measure | `units_of_measure` | master-data/uom |
| 23 | warehouse_facilities | `warehouse_facilities` | warehouse/facilities |
| 24 | warehouse_zones | `warehouse_zones` | warehouse/zones |
| 25 | aisles | `aisles` | warehouse/structure |
| 26 | bays | `bays` | warehouse/structure |
| 27 | rack_rows | `rack_rows` | warehouse/structure |
| 28 | rack_levels | `rack_levels` | warehouse/structure |
| 29 | storage_locations | `storage_locations` | warehouse/locations |
| 30 | loading_docks | `loading_docks` | warehouse/structure |
| 31 | barcode_labels | `barcode_labels` | master-data/barcodes |
| 32 | facility_access_control | `facility_access_control` | warehouse/security |
| 33 | facility_user_assignments | `facility_user_assignments` | warehouse/security |

### New Table to CREATE

| # | Model | Table | Fields | Key Indexes | Domain |
|---|-------|-------|--------|-------------|--------|
| 1 | Rack | `warehouse_racks` | id, tenantId, facilityId, zoneId, aisleId, code, name, locationType, maxWeight, maxVolume, isActive, createdAt, updatedAt | `idx_warehouse_rack_aisle` | warehouse/structure |

**Migration SQL (to run separately):**
```sql
CREATE TABLE multitenant.warehouse_racks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  facility_id UUID NOT NULL,
  zone_id UUID,
  aisle_id UUID,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  location_type VARCHAR(50) DEFAULT 'PALLET',
  max_weight DECIMAL(12,2),
  max_volume DECIMAL(15,6),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_warehouse_rack_aisle ON multitenant.warehouse_racks(tenant_id, facility_id, aisle_id);
```

---

## Module Structure

```
src/master-data/
├── master-data.module.ts      # Root module importing all sub-modules
├── clients/
│   ├── clients.module.ts
│   ├── clients.service.ts
│   ├── web/clients.controller.ts
│   ├── rf/clients.controller.ts
│   └── dtos/
│       ├── create-client.dto.ts
│       ├── update-client.dto.ts
│       └── query-client.dto.ts
├── vendors/                   # Same pattern
├── products/                  # Same pattern
├── carriers/                  # Same pattern
├── customers/                 # Same pattern
├── uom/                       # Same pattern
├── barcodes/                  # Same pattern
└── product-import/            # Import pipeline
    ├── product-import.service.ts
    ├── product-import.processor.ts
    └── dtos/
        ├── import-request.dto.ts
        └── import-result.dto.ts

src/warehouse/
├── warehouse.module.ts        # Root module
├── facilities/
│   ├── facility.service.ts
│   ├── web/facility.controller.ts
│   └── rf/facility.controller.ts
├── zones/                     # Same pattern
├── structure/                 # aisles/bays/racks/levels
├── locations/                 # storage_locations
├── security/                  # facility_access_control, facility_user_assignments
└── dtos/                      # Shared DTOs
```

---

## Web Endpoints

| Domain | Method | Path | Action | CASL Subject |
|--------|--------|------|--------|-------------|
| Clients | POST | `/web/clients` | Create | Client |
| Clients | GET | `/web/clients` | List | Client |
| Clients | GET | `/web/clients/:id` | Read | Client |
| Clients | PATCH | `/web/clients/:id` | Update | Client |
| Clients | DELETE | `/web/clients/:id` | Delete | Client |
| Vendors | POST/GET/PATCH/DELETE | `/web/vendors[/:id]` | CRUD | Vendor |
| Products | POST/GET/PATCH/DELETE | `/web/products[/:id]` | CRUD | Product |
| Products | POST | `/web/products/barcode/:code` | Lookup | Product |
| Products | POST | `/web/products/import` | Import | Product |
| Brands | POST/GET/PATCH | `/web/product-brands[/:id]` | CRUD | Product |
| Categories | POST/GET/PATCH | `/web/product-categories[/:id]` | CRUD | ProductCategory |
| Attributes | POST/GET/PATCH | `/web/product-attributes[/:id]` | CRUD | ProductAttribute |
| Barcodes | POST/GET/PATCH/DELETE | `/web/product-barcodes[/:id]` | CRUD | ProductBarcode |
| Variants | POST/GET/PATCH | `/web/product-variants[/:id]` | CRUD | Product |
| Suppliers | POST/GET/PATCH | `/web/product-suppliers[/:id]` | CRUD | Product |
| Carrier | POST/GET/PATCH/DELETE | `/web/carriers[/:id]` | CRUD | Carrier |
| Customer | POST/GET/PATCH/DELETE | `/web/customers[/:id]` | CRUD | Customer |
| UOM | POST/GET/PATCH | `/web/units-of-measure[/:id]` | CRUD | UnitOfMeasure |
| Facilities | POST/GET/PATCH | `/web/facilities[/:id]` | CRUD | WarehouseFacility |
| Facilities | GET | `/web/facilities/:id/hierarchy` | Read | WarehouseFacility |
| Zones | POST/GET/PATCH | `/web/zones[/:id]` | CRUD | WarehouseZone |
| Locations | POST/GET/PATCH | `/web/locations[/:id]` | CRUD | StorageLocation |
| Locations | POST | `/web/locations/barcode/:code` | Lookup | StorageLocation |
| Aisles | POST/GET/PATCH | `/web/aisles[/:id]` | CRUD | WarehouseFacility |
| Loading Docks | POST/GET/PATCH | `/web/loading-docks[/:id]` | CRUD | WarehouseFacility |
| Barcode Labels | POST | `/web/barcode-labels/generate` | Create | Barcode |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/locations/lookup` | read | Scan location barcode |
| `POST /rf/products/lookup` | read | Scan product barcode |
| `POST /rf/facilities/current` | read | Get current facility info |

## BullMQ Queues

- `product-import` — processes CSV/Excel imports asynchronously

## CASL Subjects to Add

```typescript
type WmsSubjects = 
  | 'Client' | 'Vendor' | 'Product' | 'ProductCategory' | 'ProductAttribute'
  | 'ProductBarcode' | 'Carrier' | 'Customer' | 'UnitOfMeasure'
  | 'WarehouseFacility' | 'WarehouseZone' | 'StorageLocation'
  | 'Barcode'
```

## Tenant Isolation — Add to `hasTenantId()`

All 33 existing models from this phase.

## Tests

| Test | File |
|------|------|
| ClientService CRUD | `master-data/clients/clients.service.spec.ts` |
| ProductService CRUD + lookup | `master-data/products/products.service.spec.ts` |
| WarehouseFacility hierarchy | `warehouse/facilities/facility.service.spec.ts` |
| StorageLocation lookup | `warehouse/locations/location.service.spec.ts` |
| Product import flow | `master-data/product-import/product-import.service.spec.ts` |
