========================================================================
  Enterprise SaaS WMS — Database Schema Comparison Report
  Reference: wms_new.sql (142 tables)  vs  Current: Prisma Schema (84 tables)
========================================================================

Total SQL Tables:             142
Total Prisma Tables:          84
Naming Differences Only:      5 (aisles↔warehouse_aisles, etc.)
Truly Missing Tables:         80
Flyway Schema History (N/A):  1 (Prisma manages migrations differently)

────────────────────────────────────────────────────────────────────────
  MASTER DATA
────────────────────────────────────────────────────────────────────────
    ❌ customers                                    
    ❌ client_facility_assignments                  
    ❌ product_variants                             
    ❌ product_velocity_classification              

────────────────────────────────────────────────────────────────────────
  INVENTORY EXTENDED
────────────────────────────────────────────────────────────────────────
    ❌ inventory_items                              
    ❌ inventory_allocation_rules                   
    ❌ inventory_allocation_rule_constraints        
    ❌ inventory_allocation_rule_locations          
    ❌ inventory_counts                             
    ❌ inventory_count_lines                        
    ❌ count_accuracy_history                       
    ❌ cycle_count_metrics                          
    ❌ variance_investigations                      
    ❌ lpn_transactions                             

────────────────────────────────────────────────────────────────────────
  INBOUND / RECEIVING
────────────────────────────────────────────────────────────────────────
    ❌ asn_import_jobs                              
    ❌ asn_import_documents                         
    ❌ asn_import_results                           
    ❌ goods_receipt_items                          
    ❌ putaway_rules                                

────────────────────────────────────────────────────────────────────────
  OUTBOUND / SHIPPING
────────────────────────────────────────────────────────────────────────
    ❌ outbound_shipment_items                      
    ❌ load_shipments                               
    ❌ packing_slips                                
    ❌ packing_slip_items                           
    ❌ packing_materials                            
    ❌ packing_session_status_history               
    ❌ shipment_status_history                      
    ❌ wave_orders                                  
    ❌ barcode_labels                               
    ❌ replenishment_rules                          

────────────────────────────────────────────────────────────────────────
  QUALITY / INSPECTIONS
────────────────────────────────────────────────────────────────────────
    ❌ quality_inspections                          
    ❌ quality_inspection_results                   
    ❌ quality_inspection_events                    
    ❌ quality_holds                                
    ❌ compliance_requirements                      
    ❌ compliance_audits                            
    ❌ hazmat_materials                             

────────────────────────────────────────────────────────────────────────
  LABOR MANAGEMENT
────────────────────────────────────────────────────────────────────────
    ❌ labor_shifts                                 
    ❌ labor_shift_assignments                      
    ❌ labor_time_logs                              
    ❌ labor_performance_metrics                    

────────────────────────────────────────────────────────────────────────
  DOCK / YARD
────────────────────────────────────────────────────────────────────────
    ❌ dock_appointments                            
    ❌ yard_vehicles                                
    ❌ cross_dock_operations                        

────────────────────────────────────────────────────────────────────────
  VALUE-ADDED SERVICES
────────────────────────────────────────────────────────────────────────
    ❌ vas_services                                 
    ❌ vas_service_catalog                          
    ❌ vas_service_client_rates                     
    ❌ vas_transactions                             
    ❌ vas_workstations                             

────────────────────────────────────────────────────────────────────────
  STORAGE BILLING
────────────────────────────────────────────────────────────────────────
    ❌ storage_rates                                
    ❌ storage_rate_master                          
    ❌ storage_billing_cycles                       
    ❌ storage_charges                              
    ❌ storage_inventory_snapshots                  
    ❌ storage_vas_invoices                         
    ❌ storage_vas_invoice_lines                    
    ❌ billing_cycles                               
    ❌ client_invoices                              
    ❌ client_invoice_lines                         
    ❌ charge_calculation_rules                     

────────────────────────────────────────────────────────────────────────
  WORK ORDERS
────────────────────────────────────────────────────────────────────────
    ❌ work_orders                                  
    ❌ work_order_operations                        
    ❌ work_order_components                        

────────────────────────────────────────────────────────────────────────
  EXCEPTION MANAGEMENT
────────────────────────────────────────────────────────────────────────
    ❌ exception_comments                           
    ❌ exception_escalation_rules                   
    ❌ adjustment_approval_requests                 

────────────────────────────────────────────────────────────────────────
  EQUIPMENT
────────────────────────────────────────────────────────────────────────
    ❌ warehouse_equipment                          
    ❌ equipment_maintenance                        

────────────────────────────────────────────────────────────────────────
  EVENT / AUDIT / ACCESS
────────────────────────────────────────────────────────────────────────
    ❌ warehouse_events                             
    ❌ system_audit_log                             
    ❌ facility_access_control                      
    ❌ facility_user_assignments                    
    ❌ daily_kpi_metrics                            
    ❌ location_pick_heatmap                        

────────────────────────────────────────────────────────────────────────
  FULFILLMENT WORKFLOW
────────────────────────────────────────────────────────────────────────
    ❌ fulfillment_workflow_definitions             
    ❌ fulfillment_workflow_events                  
    ❌ fulfillment_workflow_executions              
    ❌ fulfillment_workflow_transitions             
    ❌ fulfillment_billing_runs                     
    ❌ fulfillment_billing_events                   
    ❌ fulfillment_billing_run_events               

────────────────────────────────────────────────────────────────────────
  NAMING MISMATCHES ONLY (table exists, different name)
────────────────────────────────────────────────────────────────────────
    ➡  SQL: aisles                         → Prisma: warehouse_aisles
    ➡  SQL: bays                           → Prisma: warehouse_bays
    ➡  SQL: rack_rows                      → Prisma: warehouse_racks
    ➡  SQL: rack_levels                    → Prisma: warehouse_levels
    ➡  SQL: product_packaging_hierarchy    → Prisma: product_packaging_hierarchies

========================================================================
  COLUMN-LEVEL GAPS IN SHARED TABLES
========================================================================
  ⚠  warehouse_facilities                         
      Missing address fields (line1/2, city, state, postal_code, country), contact_person/phone/email, timezone_name, default_uom_id, description

  ⚠  warehouse_zones                              
      Missing configuration_json, layout_coordinates_json, visual_map_url, zone_color_hex, description

  ⚠  storage_locations                            
      Missing dimensions (length/width/height/max_weight/max_volume), allowed_product_categories/attributes/conditions_json, is_reserved, block_reason, reservation_details, pick_sequence_number, travel_distance_from_dock, last_picked_at, barcode_value/qr_code_data/label_printed_at, client_id

  ⚠  products                                     
      Missing product_type, weight, dimensions (length/width/height), volume, unit_weight, storage_requirements, hazardous_class, storage_conditions, image_url, manufacturer, country_of_origin

  ⚠  sales_orders                                 
      Missing order_name, description, client_id FK, customer_id FK, delivery structured fields (address_line1/2, city, state, postal_code, country_code, contact_name/phone, instructions), order_date, currency_code, total_order_value/quantity, assigned_sales_rep_id, confirmed/shipped/delivered_date

  ⚠  sales_order_lines                            
      Missing product_name, product_code, remaining_quantity (GENERATED), line_total (GENERATED), promised_delivery_date

  ⚠  vendors                                      
      Missing primary_contact_name/email/phone, payment_terms, tax_id_number, performance_score, preferred_status, is_deleted

  ⚠  license_plate_numbers                        
      Missing LpnStatus values: IN_TRANSIT, ALLOCATED, PICK_PENDING, PICKED, PACKED, STAGED, LOADED, SHIPPED. Missing goods_receipt_items FK path.

  ⚠  inventory_on_hand                            
      Missing volumetric_weight, storage_days, last_move_at, last_count_at, last_pick_at

  ⚠  inventory_transactions                       
      Missing TransactionType values: ISSUE, RETURN, PHYSICAL_COUNT, SPOT_CHECK, WRITE_OFF, RESERVATION, ALLOCATION, DEALLOCATION, QUARANTINE, SCRAP

  ⚠  inventory_holds                              
      Missing HoldReason values: EXPIRY, INVESTIGATION, COMPLIANCE, VENDOR_RETURN, RECALL. Missing HoldStatus: SUPERSEDED

  ⚠  units_of_measure                             
      Missing description field

  ⚠  carriers                                     
      Missing scac, website, phone

  ⚠  loads                                        
      Missing driver_name, driver_phone, vehicle_plate, dock_door_code, departure_time, arrival_time

  ⚠  purchase_orders                              
      Missing order_date, expected_date, vendor_id FK

  ⚠  purchase_order_lines                         
      Missing unit_price (Decimal) — currently Float only

========================================================================
  ENUM-LEVEL GAPS
========================================================================
  ⚠  facility_type                                
      Missing: MANUFACTURING_PLANT, RETAIL_STORE, COLD_STORAGE, HAZMAT_FACILITY, STORAGE_FACILITY

  ⚠  zone_type                                    
      Missing: RACK, COLD_STORAGE, HAZMAT, QUALITY_HOLD, DAMAGE, TEMPORARY, RETURNS

  ⚠  location_type                                
      Missing: SPECIALIZED (Prisma has FLOOR, STAGING, DOCK which SQL lacks)

  ⚠  order_type (entire enum)                     
      Not in Prisma. Needed: STANDARD, EXPEDITED, BACKORDER, DROP_SHIP, TRANSFER, REPLACEMENT, RETURN

  ⚠  task_status (entire enum)                    
      Not in Prisma. Needed: CREATED, AVAILABLE, ASSIGNED, IN_PROGRESS, ON_HOLD, COMPLETED, EXCEPTION, CANCELLED

  ⚠  task_type (entire enum)                      
      Not in Prisma. Needed: RECEIVING, PUTAWAY, PICKING, PACKING, SHIPPING, INVENTORY_COUNT, MOVE, CYCLE_COUNT, QUALITY_INSPECTION, EQUIPMENT_MAINTENANCE, OTHER

  ⚠  equipment_type (entire enum)                 
      Not in Prisma. Needed: FORKLIFT, PALLET_JACK, HAND_TRUCK, CONVEYOR, SCANNER, PRINTER, COMPUTER, OTHER

  ⚠  equipment_status (entire enum)               
      Not in Prisma. Needed: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, DECOMMISSIONED

  ⚠  investigation_status (entire enum)           
      Not in Prisma. Needed: OPEN, ASSIGNED, IN_PROGRESS, PENDING_APPROVAL, RESOLVED, CLOSED

  ⚠  variance_reason (entire enum)                
      Not in Prisma. Needed: COUNT_ERROR, SYSTEM_ERROR, PHYSICAL_DAMAGE, THEFT, RECEIVING_ERROR, PICKING_ERROR, PUTAWAY_ERROR, TRANSACTION_ERROR, LOCATION_ERROR, PRODUCT_MIX, UNIT_OF_MEASURE_ERROR, EXPIRATION, QUALITY_HOLD, OTHER

  ⚠  sampling_method (entire enum)                
      Not in Prisma. Needed: FULL, STRATIFIED, RANDOM, RISK_BASED

  ⚠  qc_result_enum (entire enum)                 
      Not in Prisma. Needed: NOT_REQUIRED, PENDING, PASSED, FAILED, CONDITIONAL_PASS

  ⚠  bay_status (entire enum)                     
      Not in Prisma. Needed: AVAILABLE, RESERVED, ASSIGNED, LOADING, LOADING_COMPLETE, MAINTENANCE, BLOCKED

  ⚠  transaction_status                           
      Missing: PENDING, IN_PROGRESS (Prisma has COMPLETED, CANCELLED, ERROR)

  ⚠  batch_status, period_type, adjustment_reason, etc.
      Multiple smaller enums missing

========================================================================
  CONSTRAINT / INFRASTRUCTURE GAPS
========================================================================

  • GENERATED ALWAYS AS computed columns (remaining_quantity, line_total)
    — Prisma cannot model these natively; use application-level computation

  • CHECK constraints for data integrity (positive quantities, valid transitions)
    — Prisma relies on application-level validation only

  • ~50 PostgreSQL user-defined functions
    — Storage charge calculation, volumetric weight, availability checks, status transitions
    — None exist in this project

  • Database triggers for auto-auditing
    — LPN change audit, order status sync from lines, labor time auto-calculation

  • Materialized View: mv_warehouse_hierarchy_stats
    — Not in Prisma

  • Views: v_available_inventory, v_lpn_with_holds
    — Not in Prisma

  • Indexes on (tenant_id, facility_id, <local_pk>) composite pattern
    — SQL uses bigserial PKs with composite tenant+facility FK pattern throughout
    — Prisma uses UUID PKs with separate unique constraints (functionally compatible)

========================================================================
  SUMMARY
========================================================================

  Metric                                   Count
  ──────────────────────────────────────── ──────────
  SQL Reference Tables                     142
  Current Prisma Tables                     84
  Naming Differences Only                    5
  Truly Missing Tables                      80
  Tables with Column Gaps                   16
  Missing Enums                             15

  DOMAINS MOST AFFECTED (by missing tables):
  ─────────────────────────────────────────────
    Storage Billing:             11 tables (invoicing, rates, snapshots, cycles)
    Inventory Extended:           10 tables (allocation rules, counts, accuracy, investigations)
    Quality/Inspections:           7 tables (inspections, results, holds, compliance, hazmat)
    Fulfillment Workflow:          7 tables (state machine executions, billing events)
    Outbound/Shipping Extended:   10 tables (packing docs, wave orders, replenishment rules)
    VAS (Value-Added Services):    5 tables (service catalog, rates, workstations)
    Event/Audit/Access:            6 tables (events, audit log, access control, KPI)
    Labor Management:              4 tables (shifts, time logs, performance)
    Work Orders/MFG:               3 tables (BO M, routing)
    Dock/Yard:                     3 tables (appointments, vehicles, cross-dock)
    Exception Management:          3 tables (comments, escalation, approvals)
    Equipment Management:          2 tables
    Master Data:                   2 tables (customers, client-facility assignment)

  RECOMMENDATION PRIORITY:
  ─────────────────────────────────────────────
    P0 — Inventory allocation rules, quality inspections, full LPN lifecycle
    P1 — Storage billing engine, VAS module, replenishment rules
    P2 — Labor, dock/yard, equipment, work orders, audit system
    P3 — Compliance, hazmat, workflow definitions, KPI analytics
