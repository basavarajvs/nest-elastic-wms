
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.Adjustment_approval_requestsScalarFieldEnum = {
  request_id: 'request_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  count_id: 'count_id',
  count_number: 'count_number',
  product_id: 'product_id',
  product_sku: 'product_sku',
  product_name: 'product_name',
  location_id: 'location_id',
  location_code: 'location_code',
  system_quantity: 'system_quantity',
  counted_quantity: 'counted_quantity',
  variance_quantity: 'variance_quantity',
  variance_percentage: 'variance_percentage',
  variance_value: 'variance_value',
  approval_level: 'approval_level',
  status: 'status',
  priority: 'priority',
  requested_by: 'requested_by',
  requested_by_name: 'requested_by_name',
  requested_at: 'requested_at',
  assigned_to: 'assigned_to',
  assigned_to_name: 'assigned_to_name',
  assigned_at: 'assigned_at',
  reviewed_by: 'reviewed_by',
  reviewed_by_name: 'reviewed_by_name',
  reviewed_at: 'reviewed_at',
  approval_comments: 'approval_comments',
  rejection_reason: 'rejection_reason',
  days_pending: 'days_pending',
  created_at: 'created_at',
  created_by: 'created_by',
  updated_at: 'updated_at',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Advance_ship_noticesScalarFieldEnum = {
  asn_id: 'asn_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  asn_number: 'asn_number',
  vendor_id: 'vendor_id',
  po_number: 'po_number',
  carrier_name: 'carrier_name',
  tracking_number: 'tracking_number',
  shipment_date: 'shipment_date',
  expected_arrival_date: 'expected_arrival_date',
  actual_arrival_date: 'actual_arrival_date',
  weight: 'weight',
  volume: 'volume',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  inbound_for_client_id: 'inbound_for_client_id',
  status_changed_at: 'status_changed_at',
  status_changed_by: 'status_changed_by',
  status: 'status'
};

exports.Prisma.AislesScalarFieldEnum = {
  aisle_id: 'aisle_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  zone_id: 'zone_id',
  aisle_code: 'aisle_code',
  aisle_name: 'aisle_name',
  aisle_number: 'aisle_number',
  width_meters: 'width_meters',
  length_meters: 'length_meters',
  picking_direction: 'picking_direction',
  start_sequence_number: 'start_sequence_number',
  is_active: 'is_active',
  is_blocked: 'is_blocked',
  block_reason: 'block_reason',
  allowed_equipment_types_json: 'allowed_equipment_types_json',
  max_equipment_height_cm: 'max_equipment_height_cm',
  created_at: 'created_at',
  created_by: 'created_by',
  updated_at: 'updated_at',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Asn_import_documentsScalarFieldEnum = {
  import_document_id: 'import_document_id',
  tenant_id: 'tenant_id',
  import_job_id: 'import_job_id',
  file_name: 'file_name',
  document_type: 'document_type',
  file_size_bytes: 'file_size_bytes',
  file_checksum: 'file_checksum',
  storage_path: 'storage_path',
  raw_content: 'raw_content',
  parsing_status: 'parsing_status',
  parsed_at: 'parsed_at',
  parser_version: 'parser_version',
  validation_status: 'validation_status',
  validation_errors: 'validation_errors',
  created_asn_id: 'created_asn_id',
  uploaded_at: 'uploaded_at',
  uploaded_by: 'uploaded_by'
};

exports.Prisma.Asn_import_jobsScalarFieldEnum = {
  import_job_id: 'import_job_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  job_number: 'job_number',
  source_system: 'source_system',
  import_channel: 'import_channel',
  job_status: 'job_status',
  started_at: 'started_at',
  completed_at: 'completed_at',
  processed_documents: 'processed_documents',
  successful_documents: 'successful_documents',
  failed_documents: 'failed_documents',
  created_asn_ids: 'created_asn_ids',
  error_summary: 'error_summary',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Asn_import_resultsScalarFieldEnum = {
  import_result_id: 'import_result_id',
  tenant_id: 'tenant_id',
  import_document_id: 'import_document_id',
  created_asn_id: 'created_asn_id',
  asn_number: 'asn_number',
  import_status: 'import_status',
  error_message: 'error_message',
  workflow_event_triggered: 'workflow_event_triggered',
  workflow_event_id: 'workflow_event_id',
  created_at: 'created_at'
};

exports.Prisma.Asn_linesScalarFieldEnum = {
  asn_line_id: 'asn_line_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  asn_id: 'asn_id',
  product_id: 'product_id',
  expected_quantity: 'expected_quantity',
  received_quantity: 'received_quantity',
  uom_id: 'uom_id',
  lot_number: 'lot_number',
  serial_numbers_json: 'serial_numbers_json',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  expiry_date: 'expiry_date',
  line_status: 'line_status'
};

exports.Prisma.Barcode_labelsScalarFieldEnum = {
  label_id: 'label_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  label_number: 'label_number',
  barcode_value: 'barcode_value',
  label_type: 'label_type',
  label_format: 'label_format',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  entity_reference: 'entity_reference',
  label_data_json: 'label_data_json',
  human_readable_text: 'human_readable_text',
  label_template_name: 'label_template_name',
  label_size_mm: 'label_size_mm',
  label_format_file: 'label_format_file',
  print_status: 'print_status',
  printed_at: 'printed_at',
  printed_by: 'printed_by',
  print_count: 'print_count',
  printer_name: 'printer_name',
  label_file_url: 'label_file_url',
  label_file_format: 'label_file_format',
  is_validated: 'is_validated',
  validated_at: 'validated_at',
  first_scan_at: 'first_scan_at',
  is_active: 'is_active',
  voided_at: 'voided_at',
  void_reason: 'void_reason',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.BaysScalarFieldEnum = {
  bay_id: 'bay_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  zone_id: 'zone_id',
  aisle_id: 'aisle_id',
  bay_code: 'bay_code',
  bay_name: 'bay_name',
  bay_number: 'bay_number',
  length_meters: 'length_meters',
  side: 'side',
  position_start_meters: 'position_start_meters',
  is_active: 'is_active',
  is_reserved: 'is_reserved',
  reservation_notes: 'reservation_notes',
  created_at: 'created_at',
  created_by: 'created_by',
  updated_at: 'updated_at',
  updated_by: 'updated_by',
  version: 'version',
  rack_row_id: 'rack_row_id',
  positions_per_level: 'positions_per_level',
  status: 'status',
  status_changed_at: 'status_changed_at'
};

exports.Prisma.Billing_cyclesScalarFieldEnum = {
  billing_cycle_id: 'billing_cycle_id',
  tenant_id: 'tenant_id',
  cycle_number: 'cycle_number',
  cycle_name: 'cycle_name',
  client_id: 'client_id',
  cycle_start_date: 'cycle_start_date',
  cycle_end_date: 'cycle_end_date',
  billing_frequency: 'billing_frequency',
  status: 'status',
  total_storage_charges: 'total_storage_charges',
  total_handling_charges: 'total_handling_charges',
  total_vas_charges: 'total_vas_charges',
  total_shipping_charges: 'total_shipping_charges',
  total_other_charges: 'total_other_charges',
  grand_total: 'grand_total',
  currency_code: 'currency_code',
  storage_charge_count: 'storage_charge_count',
  handling_charge_count: 'handling_charge_count',
  vas_charge_count: 'vas_charge_count',
  shipping_charge_count: 'shipping_charge_count',
  calculation_started_at: 'calculation_started_at',
  calculation_completed_at: 'calculation_completed_at',
  approved_by: 'approved_by',
  approved_at: 'approved_at',
  approval_notes: 'approval_notes',
  invoice_id: 'invoice_id',
  invoice_generated_at: 'invoice_generated_at',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.CarriersScalarFieldEnum = {
  carrier_id: 'carrier_id',
  tenant_id: 'tenant_id',
  carrier_code: 'carrier_code',
  carrier_name: 'carrier_name',
  description: 'description',
  contact_name: 'contact_name',
  contact_email: 'contact_email',
  contact_phone: 'contact_phone',
  api_endpoint_url: 'api_endpoint_url',
  api_key: 'api_key',
  api_username: 'api_username',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Charge_calculation_rulesScalarFieldEnum = {
  rule_id: 'rule_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  rule_code: 'rule_code',
  rule_name: 'rule_name',
  rule_type: 'rule_type',
  client_id: 'client_id',
  product_category_id: 'product_category_id',
  zone_type: 'zone_type',
  calculation_method: 'calculation_method',
  rate: 'rate',
  currency_code: 'currency_code',
  tiered_pricing_json: 'tiered_pricing_json',
  effective_start_date: 'effective_start_date',
  effective_end_date: 'effective_end_date',
  day_of_week_json: 'day_of_week_json',
  time_range_json: 'time_range_json',
  priority: 'priority',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Client_addressesScalarFieldEnum = {
  client_address_id: 'client_address_id',
  tenant_id: 'tenant_id',
  client_id: 'client_id',
  address_type: 'address_type',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  city: 'city',
  state_province: 'state_province',
  postal_code: 'postal_code',
  country_code: 'country_code',
  is_default: 'is_default',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Client_contactsScalarFieldEnum = {
  contact_id: 'contact_id',
  tenant_id: 'tenant_id',
  client_id: 'client_id',
  first_name: 'first_name',
  last_name: 'last_name',
  job_title: 'job_title',
  email: 'email',
  phone: 'phone',
  is_primary: 'is_primary',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Client_facility_assignmentsScalarFieldEnum = {
  assignment_id: 'assignment_id',
  tenant_id: 'tenant_id',
  client_id: 'client_id',
  facility_id: 'facility_id',
  is_active: 'is_active',
  assigned_at: 'assigned_at',
  assigned_by: 'assigned_by',
  unassigned_at: 'unassigned_at',
  unassigned_by: 'unassigned_by',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Client_invoice_linesScalarFieldEnum = {
  line_id: 'line_id',
  invoice_id: 'invoice_id',
  charge_type: 'charge_type',
  charge_reference_id: 'charge_reference_id',
  description: 'description',
  quantity: 'quantity',
  unit_rate: 'unit_rate',
  line_total: 'line_total',
  currency: 'currency'
};

exports.Prisma.Client_invoicesScalarFieldEnum = {
  invoice_id: 'invoice_id',
  tenant_id: 'tenant_id',
  client_id: 'client_id',
  billing_cycle_id: 'billing_cycle_id',
  invoice_date: 'invoice_date',
  due_date: 'due_date',
  total_storage_charges: 'total_storage_charges',
  total_vas_charges: 'total_vas_charges',
  total_amount: 'total_amount',
  currency_code: 'currency_code',
  payment_status: 'payment_status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ClientsScalarFieldEnum = {
  client_id: 'client_id',
  tenant_id: 'tenant_id',
  client_code: 'client_code',
  client_name: 'client_name',
  description: 'description',
  primary_contact_name: 'primary_contact_name',
  primary_contact_email: 'primary_contact_email',
  primary_contact_phone: 'primary_contact_phone',
  credit_limit: 'credit_limit',
  payment_terms: 'payment_terms',
  preferred_carrier_id: 'preferred_carrier_id',
  delivery_instructions: 'delivery_instructions',
  is_active: 'is_active',
  is_deleted: 'is_deleted',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  client_type: 'client_type'
};

exports.Prisma.Compliance_auditsScalarFieldEnum = {
  audit_id: 'audit_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  audit_number: 'audit_number',
  requirement_id: 'requirement_id',
  audit_type: 'audit_type',
  audit_date: 'audit_date',
  auditor_name: 'auditor_name',
  auditor_organization: 'auditor_organization',
  status: 'status',
  score: 'score',
  findings: 'findings',
  recommendations: 'recommendations',
  corrective_actions: 'corrective_actions',
  follow_up_required: 'follow_up_required',
  follow_up_due_date: 'follow_up_due_date',
  follow_up_completed_date: 'follow_up_completed_date',
  report_url: 'report_url',
  evidence_urls: 'evidence_urls',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Compliance_requirementsScalarFieldEnum = {
  requirement_id: 'requirement_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  requirement_code: 'requirement_code',
  requirement_name: 'requirement_name',
  description: 'description',
  category: 'category',
  sub_category: 'sub_category',
  regulatory_body: 'regulatory_body',
  regulation_reference: 'regulation_reference',
  compliance_frequency: 'compliance_frequency',
  due_day_of_period: 'due_day_of_period',
  next_due_date: 'next_due_date',
  last_completed_date: 'last_completed_date',
  status: 'status',
  priority: 'priority',
  responsible_role: 'responsible_role',
  assigned_to: 'assigned_to',
  documentation_required: 'documentation_required',
  documentation_template_url: 'documentation_template_url',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Count_accuracy_historyScalarFieldEnum = {
  history_id: 'history_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  count_id: 'count_id',
  count_number: 'count_number',
  count_date: 'count_date',
  product_id: 'product_id',
  product_sku: 'product_sku',
  product_name: 'product_name',
  abc_classification: 'abc_classification',
  location_id: 'location_id',
  location_code: 'location_code',
  zone_id: 'zone_id',
  system_quantity: 'system_quantity',
  counted_quantity: 'counted_quantity',
  variance_quantity: 'variance_quantity',
  variance_percentage: 'variance_percentage',
  is_accurate: 'is_accurate',
  times_counted_last_30d: 'times_counted_last_30d',
  variance_count_last_30d: 'variance_count_last_30d',
  accuracy_trend: 'accuracy_trend',
  adjustment_created: 'adjustment_created',
  requires_investigation: 'requires_investigation',
  root_cause_category: 'root_cause_category',
  investigation_notes: 'investigation_notes',
  investigated_by_user_id: 'investigated_by_user_id',
  investigation_completed_at: 'investigation_completed_at',
  counted_by_user_id: 'counted_by_user_id',
  count_duration_seconds: 'count_duration_seconds',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Cross_dock_operationsScalarFieldEnum = {
  cross_dock_id: 'cross_dock_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  cross_dock_number: 'cross_dock_number',
  inbound_shipment_id: 'inbound_shipment_id',
  outbound_shipment_id: 'outbound_shipment_id',
  product_id: 'product_id',
  sku: 'sku',
  quantity: 'quantity',
  unit_of_measure: 'unit_of_measure',
  receiving_dock_id: 'receiving_dock_id',
  shipping_dock_id: 'shipping_dock_id',
  staging_location_id: 'staging_location_id',
  status: 'status',
  priority: 'priority',
  expected_arrival_time: 'expected_arrival_time',
  actual_arrival_time: 'actual_arrival_time',
  expected_departure_time: 'expected_departure_time',
  actual_departure_time: 'actual_departure_time',
  transfer_start_time: 'transfer_start_time',
  transfer_end_time: 'transfer_end_time',
  assigned_to: 'assigned_to',
  assigned_at: 'assigned_at',
  notes: 'notes',
  customer_order_id: 'customer_order_id',
  carrier_id: 'carrier_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Customer_return_itemsScalarFieldEnum = {
  return_item_id: 'return_item_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  return_id: 'return_id',
  original_order_line_id: 'original_order_line_id',
  product_id: 'product_id',
  product_name: 'product_name',
  product_code: 'product_code',
  returned_quantity: 'returned_quantity',
  uom_id: 'uom_id',
  condition_received: 'condition_received',
  return_reason_detail: 'return_reason_detail',
  status: 'status',
  received_location_id: 'received_location_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Customer_returnsScalarFieldEnum = {
  return_id: 'return_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  return_number: 'return_number',
  return_name: 'return_name',
  description: 'description',
  original_order_number: 'original_order_number',
  original_shipment_number: 'original_shipment_number',
  client_id: 'client_id',
  client_name: 'client_name',
  return_date: 'return_date',
  received_date: 'received_date',
  return_reason: 'return_reason',
  return_status: 'return_status',
  currency_code: 'currency_code',
  total_return_value: 'total_return_value',
  total_return_quantity: 'total_return_quantity',
  assigned_to_user_id: 'assigned_to_user_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.CustomersScalarFieldEnum = {
  customer_id: 'customer_id',
  tenant_id: 'tenant_id',
  customer_code: 'customer_code',
  customer_name: 'customer_name',
  email: 'email',
  phone: 'phone',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  city: 'city',
  state_province: 'state_province',
  postal_code: 'postal_code',
  country: 'country',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Cycle_count_metricsScalarFieldEnum = {
  metric_id: 'metric_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  metric_date: 'metric_date',
  period_type: 'period_type',
  total_counts_initiated: 'total_counts_initiated',
  total_counts_completed: 'total_counts_completed',
  total_counts_cancelled: 'total_counts_cancelled',
  total_lines_counted: 'total_lines_counted',
  lines_with_zero_variance: 'lines_with_zero_variance',
  lines_with_variance: 'lines_with_variance',
  overall_accuracy_percentage: 'overall_accuracy_percentage',
  total_variance_quantity: 'total_variance_quantity',
  positive_variance_quantity: 'positive_variance_quantity',
  negative_variance_quantity: 'negative_variance_quantity',
  avg_variance_per_line: 'avg_variance_per_line',
  a_class_counts: 'a_class_counts',
  b_class_counts: 'b_class_counts',
  c_class_counts: 'c_class_counts',
  a_class_accuracy: 'a_class_accuracy',
  b_class_accuracy: 'b_class_accuracy',
  c_class_accuracy: 'c_class_accuracy',
  adjustments_created: 'adjustments_created',
  adjustments_auto_approved: 'adjustments_auto_approved',
  adjustments_requiring_approval: 'adjustments_requiring_approval',
  avg_count_duration_minutes: 'avg_count_duration_minutes',
  total_count_hours: 'total_count_hours',
  items_counted_per_hour: 'items_counted_per_hour',
  unique_counters: 'unique_counters',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Daily_kpi_metricsScalarFieldEnum = {
  kpi_id: 'kpi_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  metric_date: 'metric_date',
  asns_received: 'asns_received',
  grns_created: 'grns_created',
  units_received: 'units_received',
  putaway_tasks_completed: 'putaway_tasks_completed',
  average_receiving_time_minutes: 'average_receiving_time_minutes',
  total_inventory_units: 'total_inventory_units',
  total_inventory_value: 'total_inventory_value',
  inventory_locations_occupied: 'inventory_locations_occupied',
  inventory_locations_available: 'inventory_locations_available',
  location_utilization_pct: 'location_utilization_pct',
  orders_received: 'orders_received',
  orders_shipped: 'orders_shipped',
  units_shipped: 'units_shipped',
  picking_tasks_completed: 'picking_tasks_completed',
  packing_tasks_completed: 'packing_tasks_completed',
  average_picking_time_minutes: 'average_picking_time_minutes',
  average_packing_time_minutes: 'average_packing_time_minutes',
  vas_tasks_created: 'vas_tasks_created',
  vas_tasks_completed: 'vas_tasks_completed',
  vas_revenue: 'vas_revenue',
  total_charges_generated: 'total_charges_generated',
  invoices_generated: 'invoices_generated',
  quality_inspections_passed: 'quality_inspections_passed',
  quality_inspections_failed: 'quality_inspections_failed',
  defect_rate_pct: 'defect_rate_pct',
  order_fill_rate_pct: 'order_fill_rate_pct',
  on_time_shipment_rate_pct: 'on_time_shipment_rate_pct',
  inventory_accuracy_pct: 'inventory_accuracy_pct',
  total_labor_hours: 'total_labor_hours',
  units_per_labor_hour: 'units_per_labor_hour',
  calculated_at: 'calculated_at'
};

exports.Prisma.Dock_appointmentsScalarFieldEnum = {
  appointment_id: 'appointment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  appointment_number: 'appointment_number',
  appointment_type: 'appointment_type',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  vendor_id: 'vendor_id',
  carrier_id: 'carrier_id',
  contact_name: 'contact_name',
  contact_phone: 'contact_phone',
  vehicle_type: 'vehicle_type',
  license_plate: 'license_plate',
  requested_date: 'requested_date',
  requested_time_slot_start: 'requested_time_slot_start',
  requested_time_slot_end: 'requested_time_slot_end',
  assigned_dock_id: 'assigned_dock_id',
  confirmed_at: 'confirmed_at',
  confirmed_by_user_id: 'confirmed_by_user_id',
  arrived_at: 'arrived_at',
  started_at: 'started_at',
  finished_at: 'finished_at',
  departed_at: 'departed_at',
  status: 'status',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Equipment_maintenanceScalarFieldEnum = {
  maintenance_id: 'maintenance_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  equipment_id: 'equipment_id',
  maintenance_type: 'maintenance_type',
  maintenance_date: 'maintenance_date',
  next_maintenance_date: 'next_maintenance_date',
  performed_by_user_id: 'performed_by_user_id',
  technician_name: 'technician_name',
  maintenance_cost: 'maintenance_cost',
  description: 'description',
  duration_minutes: 'duration_minutes',
  status: 'status',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Exception_commentsScalarFieldEnum = {
  comment_id: 'comment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  exception_id: 'exception_id',
  comment_text: 'comment_text',
  comment_type: 'comment_type',
  commented_by_user_id: 'commented_by_user_id',
  commented_at: 'commented_at',
  is_internal: 'is_internal',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Exception_escalation_rulesScalarFieldEnum = {
  rule_id: 'rule_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  rule_code: 'rule_code',
  rule_name: 'rule_name',
  description: 'description',
  exception_type: 'exception_type',
  exception_severity: 'exception_severity',
  exception_category: 'exception_category',
  escalation_level: 'escalation_level',
  time_threshold_minutes: 'time_threshold_minutes',
  notify_roles: 'notify_roles',
  notify_users: 'notify_users',
  notification_method: 'notification_method',
  notification_template: 'notification_template',
  auto_assign_to_role: 'auto_assign_to_role',
  auto_assign_to_user: 'auto_assign_to_user',
  condition_expression: 'condition_expression',
  is_active: 'is_active',
  priority: 'priority',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Exception_managementScalarFieldEnum = {
  exception_id: 'exception_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  exception_number: 'exception_number',
  exception_name: 'exception_name',
  description: 'description',
  exception_type: 'exception_type',
  exception_severity: 'exception_severity',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  location_id: 'location_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  status: 'status',
  reported_by_user_id: 'reported_by_user_id',
  assigned_to_user_id: 'assigned_to_user_id',
  reported_at: 'reported_at',
  acknowledged_at: 'acknowledged_at',
  resolved_at: 'resolved_at',
  closed_at: 'closed_at',
  resolution_description: 'resolution_description',
  root_cause_description: 'root_cause_description',
  impact_level: 'impact_level',
  financial_impact_amount: 'financial_impact_amount',
  financial_impact_currency: 'financial_impact_currency',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Facility_access_controlScalarFieldEnum = {
  access_id: 'access_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  user_id: 'user_id',
  role_in_facility: 'role_in_facility',
  permissions_json: 'permissions_json',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Facility_user_assignmentsScalarFieldEnum = {
  assignment_id: 'assignment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  user_id: 'user_id',
  user_email: 'user_email',
  user_name: 'user_name',
  is_active: 'is_active',
  assigned_at: 'assigned_at',
  assigned_by: 'assigned_by',
  unassigned_at: 'unassigned_at',
  unassigned_by: 'unassigned_by',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Flyway_schema_historyScalarFieldEnum = {
  installed_rank: 'installed_rank',
  version: 'version',
  description: 'description',
  type: 'type',
  script: 'script',
  checksum: 'checksum',
  installed_by: 'installed_by',
  installed_on: 'installed_on',
  execution_time: 'execution_time',
  success: 'success'
};

exports.Prisma.Fulfillment_billing_eventsScalarFieldEnum = {
  billing_event_id: 'billing_event_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  event_type: 'event_type',
  event_category: 'event_category',
  source_entity_type: 'source_entity_type',
  source_entity_id: 'source_entity_id',
  source_entity_reference: 'source_entity_reference',
  client_id: 'client_id',
  charge_amount: 'charge_amount',
  charge_quantity: 'charge_quantity',
  charge_rate: 'charge_rate',
  currency_code: 'currency_code',
  charge_description: 'charge_description',
  charge_details: 'charge_details',
  billing_status: 'billing_status',
  billed_at: 'billed_at',
  billing_run_id: 'billing_run_id',
  invoice_id: 'invoice_id',
  event_date: 'event_date',
  event_timestamp: 'event_timestamp',
  created_at: 'created_at'
};

exports.Prisma.Fulfillment_billing_run_eventsScalarFieldEnum = {
  run_event_id: 'run_event_id',
  billing_run_id: 'billing_run_id',
  billing_event_id: 'billing_event_id',
  processed_at: 'processed_at',
  invoice_id: 'invoice_id',
  invoice_line_id: 'invoice_line_id'
};

exports.Prisma.Fulfillment_billing_runsScalarFieldEnum = {
  billing_run_id: 'billing_run_id',
  tenant_id: 'tenant_id',
  run_number: 'run_number',
  run_type: 'run_type',
  run_start_date: 'run_start_date',
  run_end_date: 'run_end_date',
  execution_status: 'execution_status',
  started_at: 'started_at',
  completed_at: 'completed_at',
  events_processed: 'events_processed',
  invoices_generated: 'invoices_generated',
  total_amount: 'total_amount',
  currency_code: 'currency_code',
  error_message: 'error_message',
  initiated_by: 'initiated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Fulfillment_workflow_definitionsScalarFieldEnum = {
  workflow_id: 'workflow_id',
  tenant_id: 'tenant_id',
  workflow_code: 'workflow_code',
  workflow_name: 'workflow_name',
  workflow_description: 'workflow_description',
  entity_type: 'entity_type',
  initial_status: 'initial_status',
  auto_progression_enabled: 'auto_progression_enabled',
  require_manual_approval: 'require_manual_approval',
  max_retry_attempts: 'max_retry_attempts',
  retry_delay_seconds: 'retry_delay_seconds',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Fulfillment_workflow_eventsScalarFieldEnum = {
  event_id: 'event_id',
  tenant_id: 'tenant_id',
  workflow_id: 'workflow_id',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  entity_reference: 'entity_reference',
  from_status: 'from_status',
  to_status: 'to_status',
  event_payload: 'event_payload',
  event_status: 'event_status',
  scheduled_at: 'scheduled_at',
  processed_at: 'processed_at',
  handler_name: 'handler_name',
  handler_result: 'handler_result',
  error_message: 'error_message',
  retry_count: 'retry_count',
  max_retries: 'max_retries',
  next_retry_at: 'next_retry_at',
  triggered_by_user_id: 'triggered_by_user_id',
  created_at: 'created_at',
  version: 'version',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Fulfillment_workflow_executionsScalarFieldEnum = {
  execution_id: 'execution_id',
  tenant_id: 'tenant_id',
  workflow_event_id: 'workflow_event_id',
  handler_name: 'handler_name',
  started_at: 'started_at',
  completed_at: 'completed_at',
  execution_status: 'execution_status',
  entities_created: 'entities_created',
  actions_performed: 'actions_performed',
  error_message: 'error_message',
  error_stack_trace: 'error_stack_trace',
  retries_attempted: 'retries_attempted',
  parent_execution_id: 'parent_execution_id',
  version: 'version',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Fulfillment_workflow_transitionsScalarFieldEnum = {
  transition_id: 'transition_id',
  tenant_id: 'tenant_id',
  workflow_id: 'workflow_id',
  from_status: 'from_status',
  to_status: 'to_status',
  transition_name: 'transition_name',
  condition_expression: 'condition_expression',
  require_approval: 'require_approval',
  automation_handler: 'automation_handler',
  automation_enabled: 'automation_enabled',
  priority: 'priority',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Goods_receipt_itemsScalarFieldEnum = {
  receipt_item_id: 'receipt_item_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  receipt_line_id: 'receipt_line_id',
  product_id: 'product_id',
  quantity: 'quantity',
  uom_id: 'uom_id',
  lot_number: 'lot_number',
  serial_numbers_json: 'serial_numbers_json',
  condition_status: 'condition_status',
  temporary_location_id: 'temporary_location_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Goods_receipt_linesScalarFieldEnum = {
  receipt_line_id: 'receipt_line_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  receipt_id: 'receipt_id',
  product_id: 'product_id',
  expected_quantity: 'expected_quantity',
  received_quantity: 'received_quantity',
  damaged_quantity: 'damaged_quantity',
  short_quantity: 'short_quantity',
  over_quantity: 'over_quantity',
  uom_id: 'uom_id',
  lot_number: 'lot_number',
  serial_numbers_json: 'serial_numbers_json',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  expiry_date: 'expiry_date',
  qc_result: 'qc_result',
  qc_failure_reason: 'qc_failure_reason',
  qc_inspected_quantity: 'qc_inspected_quantity',
  qc_passed_quantity: 'qc_passed_quantity',
  qc_failed_quantity: 'qc_failed_quantity',
  disposition_action: 'disposition_action',
  rejected_quantity: 'rejected_quantity',
  line_status: 'line_status',
  variance_type: 'variance_type',
  qc_status: 'qc_status',
  qc_inspector_id: 'qc_inspector_id',
  qc_inspected_at: 'qc_inspected_at',
  asn_line_id: 'asn_line_id'
};

exports.Prisma.Goods_receiptsScalarFieldEnum = {
  receipt_id: 'receipt_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  receipt_number: 'receipt_number',
  receipt_name: 'receipt_name',
  description: 'description',
  po_number: 'po_number',
  asn_number: 'asn_number',
  vendor_id: 'vendor_id',
  expected_date: 'expected_date',
  received_date: 'received_date',
  total_weight: 'total_weight',
  total_volume: 'total_volume',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  inbound_for_client_id: 'inbound_for_client_id',
  status: 'status',
  qc_required: 'qc_required',
  qc_result: 'qc_result',
  qc_failure_reason: 'qc_failure_reason',
  qc_completed_at: 'qc_completed_at',
  qc_completed_by_user_id: 'qc_completed_by_user_id',
  qc_status_summary: 'qc_status_summary',
  status_changed_at: 'status_changed_at',
  status_changed_by: 'status_changed_by'
};

exports.Prisma.Hazmat_materialsScalarFieldEnum = {
  hazmat_id: 'hazmat_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  material_code: 'material_code',
  material_name: 'material_name',
  un_number: 'un_number',
  hazard_class: 'hazard_class',
  packing_group: 'packing_group',
  product_id: 'product_id',
  required_storage_conditions: 'required_storage_conditions',
  max_storage_quantity: 'max_storage_quantity',
  storage_temperature_min: 'storage_temperature_min',
  storage_temperature_max: 'storage_temperature_max',
  requires_ventilation: 'requires_ventilation',
  requires_grounding: 'requires_grounding',
  incompatible_materials: 'incompatible_materials',
  handling_instructions: 'handling_instructions',
  ppe_requirements: 'ppe_requirements',
  emergency_procedures: 'emergency_procedures',
  spill_response: 'spill_response',
  sds_document_url: 'sds_document_url',
  sds_last_updated: 'sds_last_updated',
  dot_regulated: 'dot_regulated',
  epa_regulated: 'epa_regulated',
  osha_regulated: 'osha_regulated',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Inventory_adjustment_linesScalarFieldEnum = {
  adjustment_line_id: 'adjustment_line_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  adjustment_id: 'adjustment_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  location_id: 'location_id',
  quantity_before_adjustment: 'quantity_before_adjustment',
  quantity_adjustment: 'quantity_adjustment',
  quantity_after_adjustment: 'quantity_after_adjustment',
  uom_id: 'uom_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Inventory_adjustmentsScalarFieldEnum = {
  adjustment_id: 'adjustment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  adjustment_number: 'adjustment_number',
  adjustment_name: 'adjustment_name',
  description: 'description',
  status: 'status',
  adjustment_type: 'adjustment_type',
  reason_code: 'reason_code',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  requested_by_user_id: 'requested_by_user_id',
  approved_by_user_id: 'approved_by_user_id',
  executed_by_user_id: 'executed_by_user_id',
  requested_date: 'requested_date',
  approved_date: 'approved_date',
  executed_date: 'executed_date',
  total_lines: 'total_lines',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Inventory_allocation_rule_constraintsScalarFieldEnum = {
  constraint_id: 'constraint_id',
  tenant_id: 'tenant_id',
  rule_id: 'rule_id',
  constraint_type: 'constraint_type',
  attribute_name: 'attribute_name',
  operator: 'operator',
  constraint_value: 'constraint_value',
  is_mandatory: 'is_mandatory'
};

exports.Prisma.Inventory_allocation_rule_locationsScalarFieldEnum = {
  rule_location_id: 'rule_location_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  rule_id: 'rule_id',
  zone_id: 'zone_id',
  location_id: 'location_id',
  location_type: 'location_type',
  preference_rank: 'preference_rank'
};

exports.Prisma.Inventory_allocation_rulesScalarFieldEnum = {
  rule_id: 'rule_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  rule_code: 'rule_code',
  rule_name: 'rule_name',
  rule_description: 'rule_description',
  client_id: 'client_id',
  product_category_id: 'product_category_id',
  allocation_strategy: 'allocation_strategy',
  priority: 'priority',
  respect_lot_control: 'respect_lot_control',
  respect_expiry_dates: 'respect_expiry_dates',
  min_shelf_life_days: 'min_shelf_life_days',
  prefer_full_pallets: 'prefer_full_pallets',
  prefer_single_location: 'prefer_single_location',
  max_locations_per_order: 'max_locations_per_order',
  is_active: 'is_active',
  effective_from: 'effective_from',
  effective_to: 'effective_to',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Inventory_allocationsScalarFieldEnum = {
  allocation_id: 'allocation_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  location_id: 'location_id',
  item_id: 'item_id',
  quantity_allocated: 'quantity_allocated',
  uom_id: 'uom_id',
  allocation_type: 'allocation_type',
  allocated_for_reference_type: 'allocated_for_reference_type',
  allocated_for_reference_id: 'allocated_for_reference_id',
  status: 'status',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Inventory_count_linesScalarFieldEnum = {
  count_line_id: 'count_line_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  count_id: 'count_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  location_id: 'location_id',
  counted_quantity: 'counted_quantity',
  system_quantity: 'system_quantity',
  variance_quantity: 'variance_quantity',
  status: 'status',
  adjustment_transaction_id: 'adjustment_transaction_id',
  counted_by_user_id: 'counted_by_user_id',
  counted_at: 'counted_at',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Inventory_countsScalarFieldEnum = {
  count_id: 'count_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  count_number: 'count_number',
  count_name: 'count_name',
  description: 'description',
  count_scope_type: 'count_scope_type',
  count_scope_identifier: 'count_scope_identifier',
  status: 'status',
  scheduled_date: 'scheduled_date',
  started_at: 'started_at',
  completed_at: 'completed_at',
  assigned_to_user_id: 'assigned_to_user_id',
  variance_threshold_percentage: 'variance_threshold_percentage',
  auto_adjust_on_variance: 'auto_adjust_on_variance',
  total_items_counted: 'total_items_counted',
  total_variances: 'total_variances',
  total_variance_quantity: 'total_variance_quantity',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  count_method: 'count_method',
  count_frequency_type: 'count_frequency_type',
  count_frequency_value: 'count_frequency_value',
  count_priority: 'count_priority',
  auto_generated: 'auto_generated',
  last_auto_generated_date: 'last_auto_generated_date',
  next_scheduled_date: 'next_scheduled_date',
  sampling_method: 'sampling_method',
  sample_size_percentage: 'sample_size_percentage',
  accuracy_percentage: 'accuracy_percentage'
};

exports.Prisma.Inventory_holdsScalarFieldEnum = {
  hold_id: 'hold_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  lpn_id: 'lpn_id',
  inventory_item_id: 'inventory_item_id',
  hold_reason: 'hold_reason',
  status: 'status',
  hold_reason_code: 'hold_reason_code',
  hold_reason_description: 'hold_reason_description',
  placed_by_user_id: 'placed_by_user_id',
  placed_at: 'placed_at',
  released_by_user_id: 'released_by_user_id',
  released_at: 'released_at',
  release_notes: 'release_notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Inventory_itemsScalarFieldEnum = {
  item_id: 'item_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  serial_number: 'serial_number',
  quantity: 'quantity',
  uom_id: 'uom_id',
  status: 'status',
  hold_reason: 'hold_reason',
  is_damaged: 'is_damaged',
  damage_description: 'damage_description',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  owner_client_id: 'owner_client_id',
  lpn_id: 'lpn_id'
};

exports.Prisma.Inventory_lotsScalarFieldEnum = {
  lot_id: 'lot_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  lot_number: 'lot_number',
  supplier_lot_number: 'supplier_lot_number',
  manufacturing_date: 'manufacturing_date',
  expiry_date: 'expiry_date',
  received_date: 'received_date',
  received_quantity: 'received_quantity',
  remaining_quantity: 'remaining_quantity',
  status: 'status',
  hold_reason: 'hold_reason',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  owner_client_id: 'owner_client_id'
};

exports.Prisma.Inventory_on_handScalarFieldEnum = {
  on_hand_id: 'on_hand_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  location_id: 'location_id',
  lot_id: 'lot_id',
  quantity_on_hand: 'quantity_on_hand',
  quantity_allocated: 'quantity_allocated',
  quantity_reserved: 'quantity_reserved',
  quantity_picked: 'quantity_picked',
  quantity_on_hold: 'quantity_on_hold',
  quantity_damaged: 'quantity_damaged',
  uom_id: 'uom_id',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  owner_client_id: 'owner_client_id'
};

exports.Prisma.Inventory_policiesScalarFieldEnum = {
  policy_id: 'policy_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  location_id: 'location_id',
  abc_analysis_class: 'abc_analysis_class',
  cycle_count_frequency_days: 'cycle_count_frequency_days',
  reorder_point_quantity: 'reorder_point_quantity',
  economic_order_quantity: 'economic_order_quantity',
  minimum_stock_level: 'minimum_stock_level',
  maximum_stock_level: 'maximum_stock_level',
  safety_stock_quantity: 'safety_stock_quantity',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Inventory_reservationsScalarFieldEnum = {
  reservation_id: 'reservation_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  location_id: 'location_id',
  quantity_reserved: 'quantity_reserved',
  uom_id: 'uom_id',
  reservation_type: 'reservation_type',
  reserved_for_reference_type: 'reserved_for_reference_type',
  reserved_for_reference_id: 'reserved_for_reference_id',
  status: 'status',
  expiration_date: 'expiration_date',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Inventory_transactionsScalarFieldEnum = {
  transaction_id: 'transaction_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  from_location_id: 'from_location_id',
  to_location_id: 'to_location_id',
  item_id: 'item_id',
  transaction_type: 'transaction_type',
  transaction_status: 'transaction_status',
  quantity: 'quantity',
  uom_id: 'uom_id',
  reason_code: 'reason_code',
  notes: 'notes',
  performed_by_user_id: 'performed_by_user_id',
  transaction_timestamp: 'transaction_timestamp',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  owner_client_id: 'owner_client_id',
  reference_document_type: 'reference_document_type',
  reference_document_number: 'reference_document_number',
  reference_line_number: 'reference_line_number',
  adjustment_notes: 'adjustment_notes',
  adjustment_reason: 'adjustment_reason',
  quantity_before: 'quantity_before',
  quantity_after: 'quantity_after',
  cost_adjustment: 'cost_adjustment',
  quality_status: 'quality_status',
  inspection_notes: 'inspection_notes',
  lot_number: 'lot_number',
  serial_number: 'serial_number',
  expiration_date: 'expiration_date',
  manufacturing_date: 'manufacturing_date',
  unit_cost: 'unit_cost',
  total_cost: 'total_cost',
  quantity_uom: 'quantity_uom',
  location_id: 'location_id',
  custom_attributes: 'custom_attributes',
  transaction_date: 'transaction_date'
};

exports.Prisma.Labor_performance_metricsScalarFieldEnum = {
  metric_id: 'metric_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  user_id: 'user_id',
  date_calculated: 'date_calculated',
  task_type: 'task_type',
  total_tasks_completed: 'total_tasks_completed',
  total_quantity_processed: 'total_quantity_processed',
  total_standard_minutes_required: 'total_standard_minutes_required',
  total_net_minutes_worked: 'total_net_minutes_worked',
  efficiency_percentage: 'efficiency_percentage',
  items_per_hour: 'items_per_hour',
  tasks_per_hour: 'tasks_per_hour',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Labor_shift_assignmentsScalarFieldEnum = {
  assignment_id: 'assignment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  shift_id: 'shift_id',
  user_id: 'user_id',
  assignment_date: 'assignment_date',
  scheduled_start_time: 'scheduled_start_time',
  scheduled_end_time: 'scheduled_end_time',
  status: 'status',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Labor_shiftsScalarFieldEnum = {
  shift_id: 'shift_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  shift_name: 'shift_name',
  shift_code: 'shift_code',
  description: 'description',
  start_time: 'start_time',
  end_time: 'end_time',
  break_duration_minutes: 'break_duration_minutes',
  scheduled_days_json: 'scheduled_days_json',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Labor_time_logsScalarFieldEnum = {
  time_log_id: 'time_log_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  assignment_id: 'assignment_id',
  user_id: 'user_id',
  date_worked: 'date_worked',
  clock_in_time: 'clock_in_time',
  clock_out_time: 'clock_out_time',
  break_start_time: 'break_start_time',
  break_end_time: 'break_end_time',
  total_scheduled_minutes: 'total_scheduled_minutes',
  total_worked_minutes: 'total_worked_minutes',
  total_break_minutes: 'total_break_minutes',
  net_worked_minutes: 'net_worked_minutes',
  status: 'status',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.License_plate_numbersScalarFieldEnum = {
  lpn_id: 'lpn_id',
  lpn_number: 'lpn_number',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  location_id: 'location_id',
  product_id: 'product_id',
  parent_lpn_id: 'parent_lpn_id',
  lpn_type: 'lpn_type',
  status: 'status',
  grn_line_id: 'grn_line_id',
  gross_weight: 'gross_weight',
  net_weight: 'net_weight',
  volume: 'volume',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version',
  assigned_shipment_id: 'assigned_shipment_id',
  assigned_load_id: 'assigned_load_id',
  staged_at: 'staged_at',
  staging_location_id: 'staging_location_id',
  loaded_at: 'loaded_at'
};

exports.Prisma.Load_shipmentsScalarFieldEnum = {
  load_shipment_id: 'load_shipment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  load_id: 'load_id',
  shipment_id: 'shipment_id',
  sequence_number: 'sequence_number',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Loading_docksScalarFieldEnum = {
  dock_id: 'dock_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  dock_name: 'dock_name',
  dock_code: 'dock_code',
  dock_type: 'dock_type',
  description: 'description',
  location_id: 'location_id',
  max_trailer_length: 'max_trailer_length',
  max_trailer_height: 'max_trailer_height',
  has_leveler: 'has_leveler',
  has_sealant: 'has_sealant',
  is_active: 'is_active',
  is_available: 'is_available',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.LoadsScalarFieldEnum = {
  load_id: 'load_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  load_number: 'load_number',
  load_name: 'load_name',
  description: 'description',
  vehicle_number: 'vehicle_number',
  driver_name: 'driver_name',
  driver_phone: 'driver_phone',
  planned_departure_date: 'planned_departure_date',
  planned_departure_time: 'planned_departure_time',
  actual_departure_time: 'actual_departure_time',
  planned_arrival_date: 'planned_arrival_date',
  planned_arrival_time: 'planned_arrival_time',
  status: 'status',
  total_weight: 'total_weight',
  total_volume: 'total_volume',
  number_of_shipments: 'number_of_shipments',
  number_of_packages: 'number_of_packages',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  carrier_id: 'carrier_id',
  carrier_code: 'carrier_code',
  carrier_name: 'carrier_name',
  service_type: 'service_type',
  trailer_number: 'trailer_number',
  seal_number: 'seal_number',
  dock_door_number: 'dock_door_number',
  load_start_time: 'load_start_time',
  load_completed_time: 'load_completed_time',
  weight_uom: 'weight_uom',
  volume_uom: 'volume_uom',
  total_cartons: 'total_cartons',
  loaded_cartons: 'loaded_cartons',
  bol_number: 'bol_number',
  pro_number: 'pro_number',
  loaded_by: 'loaded_by'
};

exports.Prisma.Location_pick_heatmapScalarFieldEnum = {
  heatmap_id: 'heatmap_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  location_id: 'location_id',
  location_code: 'location_code',
  zone_id: 'zone_id',
  zone_type: 'zone_type',
  analysis_date: 'analysis_date',
  week_number: 'week_number',
  month_number: 'month_number',
  year_number: 'year_number',
  total_picks: 'total_picks',
  unique_products_picked: 'unique_products_picked',
  total_quantity_picked: 'total_quantity_picked',
  average_pick_time_seconds: 'average_pick_time_seconds',
  pick_density_score: 'pick_density_score',
  density_class: 'density_class',
  picks_per_day: 'picks_per_day',
  zone_rank: 'zone_rank',
  facility_rank: 'facility_rank',
  last_picked_at: 'last_picked_at',
  days_since_last_pick: 'days_since_last_pick',
  calculated_at: 'calculated_at'
};

exports.Prisma.Lpn_transactionsScalarFieldEnum = {
  transaction_id: 'transaction_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  lpn_id: 'lpn_id',
  transaction_type: 'transaction_type',
  from_location_id: 'from_location_id',
  to_location_id: 'to_location_id',
  from_status: 'from_status',
  to_status: 'to_status',
  reference_document_type: 'reference_document_type',
  reference_document_number: 'reference_document_number',
  performed_by_user_id: 'performed_by_user_id',
  transaction_time: 'transaction_time',
  notes: 'notes',
  created_at: 'created_at',
  version: 'version',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Non_conformance_reportsScalarFieldEnum = {
  ncr_id: 'ncr_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  ncr_number: 'ncr_number',
  ncr_name: 'ncr_name',
  description: 'description',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  severity: 'severity',
  status: 'status',
  reported_by_user_id: 'reported_by_user_id',
  assigned_to_user_id: 'assigned_to_user_id',
  reported_at: 'reported_at',
  resolved_at: 'resolved_at',
  closed_at: 'closed_at',
  root_cause_description: 'root_cause_description',
  resolution_description: 'resolution_description',
  corrective_action_required: 'corrective_action_required',
  corrective_action_taken: 'corrective_action_taken',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Outbound_shipment_itemsScalarFieldEnum = {
  shipment_item_id: 'shipment_item_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  shipment_id: 'shipment_id',
  packing_slip_item_id: 'packing_slip_item_id',
  product_id: 'product_id',
  quantity_shipped: 'quantity_shipped',
  uom_id: 'uom_id',
  lot_number: 'lot_number',
  serial_numbers_json: 'serial_numbers_json',
  container_id: 'container_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Outbound_shipmentsScalarFieldEnum = {
  shipment_id: 'shipment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  shipment_number: 'shipment_number',
  shipment_name: 'shipment_name',
  description: 'description',
  order_id: 'order_id',
  client_id: 'client_id',
  carrier_id: 'carrier_id',
  service_level: 'service_level',
  delivery_address_line1: 'delivery_address_line1',
  delivery_address_line2: 'delivery_address_line2',
  delivery_city: 'delivery_city',
  delivery_state_province: 'delivery_state_province',
  delivery_postal_code: 'delivery_postal_code',
  delivery_country_code: 'delivery_country_code',
  delivery_contact_name: 'delivery_contact_name',
  delivery_contact_phone: 'delivery_contact_phone',
  delivery_instructions: 'delivery_instructions',
  scheduled_ship_date: 'scheduled_ship_date',
  shipped_date: 'shipped_date',
  delivered_date: 'delivered_date',
  total_weight: 'total_weight',
  total_volume: 'total_volume',
  number_of_packages: 'number_of_packages',
  tracking_number: 'tracking_number',
  tracking_url: 'tracking_url',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  load_id: 'load_id',
  status: 'status',
  carrier_code: 'carrier_code',
  carrier_name: 'carrier_name',
  pro_number: 'pro_number',
  driver_name: 'driver_name',
  trailer_number: 'trailer_number',
  total_cartons: 'total_cartons'
};

exports.Prisma.Packing_containersScalarFieldEnum = {
  container_id: 'container_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  container_code: 'container_code',
  container_type: 'container_type',
  description: 'description',
  length: 'length',
  width: 'width',
  height: 'height',
  weight_tare: 'weight_tare',
  max_weight_capacity: 'max_weight_capacity',
  max_volume_capacity: 'max_volume_capacity',
  status: 'status',
  current_location_id: 'current_location_id',
  packing_slip_id: 'packing_slip_id',
  shipment_id: 'shipment_id',
  seal_number: 'seal_number',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  staging_location_id: 'staging_location_id',
  staging_lane_code: 'staging_lane_code',
  staged_at: 'staged_at',
  staged_by: 'staged_by'
};

exports.Prisma.Packing_materialsScalarFieldEnum = {
  material_id: 'material_id',
  tenant_id: 'tenant_id',
  material_code: 'material_code',
  material_name: 'material_name',
  description: 'description',
  length: 'length',
  width: 'width',
  height: 'height',
  weight: 'weight',
  volume: 'volume',
  uom_id: 'uom_id',
  standard_cost: 'standard_cost',
  currency_code: 'currency_code',
  compatible_products_json: 'compatible_products_json',
  compatible_containers_json: 'compatible_containers_json',
  is_active: 'is_active',
  is_deleted: 'is_deleted',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Packing_session_status_historyScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  session_id: 'session_id',
  previous_status: 'previous_status',
  current_status: 'current_status',
  changed_at: 'changed_at',
  changed_by: 'changed_by',
  user_id: 'user_id',
  reason_code: 'reason_code',
  notes: 'notes',
  device_id: 'device_id',
  created_at: 'created_at'
};

exports.Prisma.Packing_sessionsScalarFieldEnum = {
  id: 'id',
  session_number: 'session_number',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  user_id: 'user_id',
  station_id: 'station_id',
  station_code: 'station_code',
  start_time: 'start_time',
  end_time: 'end_time',
  last_activity_time: 'last_activity_time',
  current_order_id: 'current_order_id',
  orders_completed: 'orders_completed',
  cartons_completed: 'cartons_completed',
  items_packed: 'items_packed',
  errors_count: 'errors_count',
  notes: 'notes',
  created_date: 'created_date',
  created_by: 'created_by',
  modified_date: 'modified_date',
  modified_by: 'modified_by',
  status: 'status'
};

exports.Prisma.Packing_slip_itemsScalarFieldEnum = {
  packing_slip_item_id: 'packing_slip_item_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  packing_slip_id: 'packing_slip_id',
  picking_task_id: 'picking_task_id',
  product_id: 'product_id',
  quantity_packed: 'quantity_packed',
  uom_id: 'uom_id',
  lot_number: 'lot_number',
  serial_numbers_json: 'serial_numbers_json',
  container_id: 'container_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Packing_slipsScalarFieldEnum = {
  packing_slip_id: 'packing_slip_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  packing_slip_number: 'packing_slip_number',
  packing_slip_name: 'packing_slip_name',
  description: 'description',
  order_id: 'order_id',
  shipment_id: 'shipment_id',
  status: 'status',
  created_date: 'created_date',
  packed_date: 'packed_date',
  packed_by_user_id: 'packed_by_user_id',
  weight: 'weight',
  volume: 'volume',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  session_id: 'session_id'
};

exports.Prisma.Packing_stationsScalarFieldEnum = {
  station_id: 'station_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  station_name: 'station_name',
  station_code: 'station_code',
  description: 'description',
  location_id: 'location_id',
  printer_type: 'printer_type',
  scale_type: 'scale_type',
  scanner_type: 'scanner_type',
  is_active: 'is_active',
  is_available: 'is_available',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Picking_tasksScalarFieldEnum = {
  task_id: 'task_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  task_number: 'task_number',
  task_name: 'task_name',
  description: 'description',
  order_id: 'order_id',
  order_line_id: 'order_line_id',
  allocation_id: 'allocation_id',
  wave_id: 'wave_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  quantity_to_pick: 'quantity_to_pick',
  quantity_picked: 'quantity_picked',
  uom_id: 'uom_id',
  from_location_id: 'from_location_id',
  to_location_id: 'to_location_id',
  assigned_to_user_id: 'assigned_to_user_id',
  priority: 'priority',
  created_date: 'created_date',
  due_date: 'due_date',
  completed_at: 'completed_at',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  product_sku: 'product_sku',
  lot_number: 'lot_number',
  lpn_id: 'lpn_id',
  lpn_number: 'lpn_number',
  status: 'status',
  hold_reason: 'hold_reason'
};

exports.Prisma.Picking_wavesScalarFieldEnum = {
  wave_id: 'wave_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  wave_number: 'wave_number',
  wave_name: 'wave_name',
  description: 'description',
  status: 'status',
  assigned_to_user_id: 'assigned_to_user_id',
  created_date: 'created_date',
  scheduled_start_time: 'scheduled_start_time',
  started_at: 'started_at',
  completed_at: 'completed_at',
  selection_criteria_json: 'selection_criteria_json',
  total_tasks: 'total_tasks',
  completed_tasks: 'completed_tasks',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Product_attributesScalarFieldEnum = {
  attribute_id: 'attribute_id',
  tenant_id: 'tenant_id',
  attribute_name: 'attribute_name',
  attribute_code: 'attribute_code',
  attribute_type: 'attribute_type',
  allowed_values: 'allowed_values',
  is_required: 'is_required',
  is_searchable: 'is_searchable',
  description: 'description',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Product_barcodesScalarFieldEnum = {
  barcode_id: 'barcode_id',
  tenant_id: 'tenant_id',
  product_id: 'product_id',
  variant_id: 'variant_id',
  barcode_value: 'barcode_value',
  barcode_type: 'barcode_type',
  is_primary: 'is_primary',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Product_brandsScalarFieldEnum = {
  brand_id: 'brand_id',
  tenant_id: 'tenant_id',
  brand_name: 'brand_name',
  brand_code: 'brand_code',
  description: 'description',
  logo_url: 'logo_url',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Product_categoriesScalarFieldEnum = {
  category_id: 'category_id',
  tenant_id: 'tenant_id',
  parent_category_id: 'parent_category_id',
  category_name: 'category_name',
  category_code: 'category_code',
  description: 'description',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Product_client_assignmentsScalarFieldEnum = {
  assignment_id: 'assignment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  client_id: 'client_id',
  is_active: 'is_active',
  effective_date: 'effective_date',
  expiry_date: 'expiry_date',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Product_import_jobsScalarFieldEnum = {
  job_id: 'job_id',
  tenant_id: 'tenant_id',
  job_number: 'job_number',
  job_name: 'job_name',
  uploaded_by: 'uploaded_by',
  uploaded_at: 'uploaded_at',
  file_name: 'file_name',
  file_path: 'file_path',
  file_size_bytes: 'file_size_bytes',
  file_format: 'file_format',
  job_status: 'job_status',
  total_rows: 'total_rows',
  processed_rows: 'processed_rows',
  successful_rows: 'successful_rows',
  failed_rows: 'failed_rows',
  started_at: 'started_at',
  completed_at: 'completed_at',
  error_summary: 'error_summary',
  configuration_json: 'configuration_json',
  is_deleted: 'is_deleted',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Product_import_resultsScalarFieldEnum = {
  result_id: 'result_id',
  tenant_id: 'tenant_id',
  job_id: 'job_id',
  row_number: 'row_number',
  product_code: 'product_code',
  product_name: 'product_name',
  import_status: 'import_status',
  error_message: 'error_message',
  created_product_id: 'created_product_id',
  processed_at: 'processed_at',
  raw_data_json: 'raw_data_json',
  is_deleted: 'is_deleted',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Product_packaging_hierarchyScalarFieldEnum = {
  hierarchy_id: 'hierarchy_id',
  tenant_id: 'tenant_id',
  product_id: 'product_id',
  parent_uom_id: 'parent_uom_id',
  child_uom_id: 'child_uom_id',
  quantity_per_parent: 'quantity_per_parent',
  version: 'version'
};

exports.Prisma.Product_suppliersScalarFieldEnum = {
  product_supplier_id: 'product_supplier_id',
  tenant_id: 'tenant_id',
  product_id: 'product_id',
  vendor_id: 'vendor_id',
  supplier_part_number: 'supplier_part_number',
  lead_time_days: 'lead_time_days',
  cost_price: 'cost_price',
  currency_code: 'currency_code',
  minimum_order_quantity: 'minimum_order_quantity',
  maximum_order_quantity: 'maximum_order_quantity',
  preferred_supplier: 'preferred_supplier',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Product_variantsScalarFieldEnum = {
  variant_id: 'variant_id',
  tenant_id: 'tenant_id',
  product_id: 'product_id',
  variant_code: 'variant_code',
  variant_name: 'variant_name',
  length: 'length',
  width: 'width',
  height: 'height',
  weight: 'weight',
  volume: 'volume',
  is_active: 'is_active',
  is_deleted: 'is_deleted',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Product_velocity_classificationScalarFieldEnum = {
  classification_id: 'classification_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  product_sku: 'product_sku',
  analysis_start_date: 'analysis_start_date',
  analysis_end_date: 'analysis_end_date',
  analysis_period_days: 'analysis_period_days',
  total_orders: 'total_orders',
  total_quantity_shipped: 'total_quantity_shipped',
  average_daily_quantity: 'average_daily_quantity',
  abc_class: 'abc_class',
  velocity_score: 'velocity_score',
  velocity_rank: 'velocity_rank',
  movement_type: 'movement_type',
  pick_frequency: 'pick_frequency',
  recommended_zone_type: 'recommended_zone_type',
  recommended_location_type: 'recommended_location_type',
  calculated_at: 'calculated_at',
  next_calculation_due: 'next_calculation_due'
};

exports.Prisma.ProductsScalarFieldEnum = {
  product_id: 'product_id',
  tenant_id: 'tenant_id',
  category_id: 'category_id',
  brand_id: 'brand_id',
  primary_uom_id: 'primary_uom_id',
  product_code: 'product_code',
  product_name: 'product_name',
  description: 'description',
  short_description: 'short_description',
  base_price: 'base_price',
  cost_price: 'cost_price',
  length: 'length',
  width: 'width',
  height: 'height',
  weight: 'weight',
  volume: 'volume',
  storage_temperature_min: 'storage_temperature_min',
  storage_temperature_max: 'storage_temperature_max',
  requires_temperature_control: 'requires_temperature_control',
  requires_light_control: 'requires_light_control',
  requires_humidity_control: 'requires_humidity_control',
  is_hazardous: 'is_hazardous',
  hazmat_class: 'hazmat_class',
  hazmat_description: 'hazmat_description',
  is_perishable: 'is_perishable',
  shelf_life_days: 'shelf_life_days',
  track_serial_numbers: 'track_serial_numbers',
  track_lot_numbers: 'track_lot_numbers',
  abc_analysis_class: 'abc_analysis_class',
  default_cycle_count_frequency_days: 'default_cycle_count_frequency_days',
  is_active: 'is_active',
  is_deleted: 'is_deleted',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  primary_image_url: 'primary_image_url',
  thumbnail_image_url: 'thumbnail_image_url',
  image_gallery_urls_json: 'image_gallery_urls_json',
  track_expiry: 'track_expiry'
};

exports.Prisma.Purchase_order_linesScalarFieldEnum = {
  line_id: 'line_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  po_id: 'po_id',
  line_number: 'line_number',
  product_id: 'product_id',
  product_name: 'product_name',
  product_code: 'product_code',
  supplier_part_number: 'supplier_part_number',
  ordered_quantity: 'ordered_quantity',
  received_quantity: 'received_quantity',
  remaining_quantity: 'remaining_quantity',
  uom_id: 'uom_id',
  unit_cost: 'unit_cost',
  line_total: 'line_total',
  required_date: 'required_date',
  promised_date: 'promised_date',
  expected_receipt_date: 'expected_receipt_date',
  status: 'status',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Purchase_ordersScalarFieldEnum = {
  po_id: 'po_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  po_number: 'po_number',
  po_name: 'po_name',
  description: 'description',
  vendor_id: 'vendor_id',
  vendor_name: 'vendor_name',
  vendor_code: 'vendor_code',
  vendor_address_line1: 'vendor_address_line1',
  vendor_address_line2: 'vendor_address_line2',
  vendor_city: 'vendor_city',
  vendor_state_province: 'vendor_state_province',
  vendor_postal_code: 'vendor_postal_code',
  vendor_country_code: 'vendor_country_code',
  vendor_contact_name: 'vendor_contact_name',
  vendor_contact_phone: 'vendor_contact_phone',
  vendor_contact_email: 'vendor_contact_email',
  order_date: 'order_date',
  required_date: 'required_date',
  promised_date: 'promised_date',
  currency_code: 'currency_code',
  total_po_value: 'total_po_value',
  total_po_quantity: 'total_po_quantity',
  requested_by_user_id: 'requested_by_user_id',
  approved_by_user_id: 'approved_by_user_id',
  assigned_buyer_id: 'assigned_buyer_id',
  approved_date: 'approved_date',
  confirmed_date: 'confirmed_date',
  expected_receipt_date: 'expected_receipt_date',
  fully_received_date: 'fully_received_date',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Putaway_rulesScalarFieldEnum = {
  rule_id: 'rule_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  rule_name: 'rule_name',
  rule_code: 'rule_code',
  description: 'description',
  priority: 'priority',
  product_category_ids_json: 'product_category_ids_json',
  product_attribute_rules_json: 'product_attribute_rules_json',
  product_uom_ids_json: 'product_uom_ids_json',
  storage_condition_requirements_json: 'storage_condition_requirements_json',
  destination_zone_ids_json: 'destination_zone_ids_json',
  destination_location_types_json: 'destination_location_types_json',
  destination_location_attributes_json: 'destination_location_attributes_json',
  action_type: 'action_type',
  fixed_location_code: 'fixed_location_code',
  rotation_logic: 'rotation_logic',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  velocity_class_filter: 'velocity_class_filter',
  min_pick_frequency_per_day: 'min_pick_frequency_per_day',
  prefer_pick_face_for_fast_movers: 'prefer_pick_face_for_fast_movers',
  client_id: 'client_id',
  product_id: 'product_id',
  product_category_id: 'product_category_id',
  destination_zone_id: 'destination_zone_id',
  location_type_preference: 'location_type_preference'
};

exports.Prisma.Putaway_tasksScalarFieldEnum = {
  task_id: 'task_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  task_number: 'task_number',
  task_name: 'task_name',
  description: 'description',
  receipt_line_id: 'receipt_line_id',
  receipt_item_id: 'receipt_item_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  quantity: 'quantity',
  uom_id: 'uom_id',
  from_location_id: 'from_location_id',
  to_location_id: 'to_location_id',
  assigned_to_user_id: 'assigned_to_user_id',
  status: 'status',
  priority: 'priority',
  created_date: 'created_date',
  due_date: 'due_date',
  completed_at: 'completed_at',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  grn_number: 'grn_number',
  lot_number: 'lot_number',
  lpn_barcode: 'lpn_barcode',
  suggested_location_barcode: 'suggested_location_barcode',
  actual_location_barcode: 'actual_location_barcode',
  override_reason_code: 'override_reason_code'
};

exports.Prisma.Quality_holdsScalarFieldEnum = {
  hold_id: 'hold_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  hold_number: 'hold_number',
  hold_name: 'hold_name',
  description: 'description',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  location_id: 'location_id',
  hold_reason: 'hold_reason',
  hold_reason_code: 'hold_reason_code',
  placed_by_user_id: 'placed_by_user_id',
  released_by_user_id: 'released_by_user_id',
  placed_at: 'placed_at',
  released_at: 'released_at',
  affected_quantity: 'affected_quantity',
  uom_id: 'uom_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  status: 'status'
};

exports.Prisma.Quality_inspection_eventsScalarFieldEnum = {
  event_id: 'event_id',
  tenant_id: 'tenant_id',
  inspection_id: 'inspection_id',
  grn_id: 'grn_id',
  grn_line_id: 'grn_line_id',
  event_type: 'event_type',
  previous_result: 'previous_result',
  new_result: 'new_result',
  inspector_user_id: 'inspector_user_id',
  inspector_name: 'inspector_name',
  reason: 'reason',
  metadata: 'metadata',
  event_timestamp: 'event_timestamp',
  created_at: 'created_at'
};

exports.Prisma.Quality_inspection_resultsScalarFieldEnum = {
  result_id: 'result_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  inspection_id: 'inspection_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  item_id: 'item_id',
  result_status: 'result_status',
  failure_reason: 'failure_reason',
  inspection_criteria_results_json: 'inspection_criteria_results_json',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Quality_inspectionsScalarFieldEnum = {
  inspection_id: 'inspection_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  inspection_number: 'inspection_number',
  inspection_name: 'inspection_name',
  description: 'description',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  inspection_type: 'inspection_type',
  inspection_scope: 'inspection_scope',
  sampling_plan_json: 'sampling_plan_json',
  status: 'status',
  result: 'result',
  assigned_to_user_id: 'assigned_to_user_id',
  scheduled_date: 'scheduled_date',
  started_at: 'started_at',
  completed_at: 'completed_at',
  total_items_inspected: 'total_items_inspected',
  total_passed_items: 'total_passed_items',
  total_failed_items: 'total_failed_items',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Rack_levelsScalarFieldEnum = {
  level_id: 'level_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  level_number: 'level_number',
  level_name: 'level_name',
  description: 'description',
  height: 'height',
  width: 'width',
  depth: 'depth',
  weight_capacity: 'weight_capacity',
  volume_capacity: 'volume_capacity',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  bay_id: 'bay_id'
};

exports.Prisma.Rack_rowsScalarFieldEnum = {
  rack_row_id: 'rack_row_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  zone_id: 'zone_id',
  rack_row_name: 'rack_row_name',
  rack_row_code: 'rack_row_code',
  description: 'description',
  length: 'length',
  width: 'width',
  height: 'height',
  total_levels: 'total_levels',
  total_bays: 'total_bays',
  total_capacity: 'total_capacity',
  weight_capacity_per_level: 'weight_capacity_per_level',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  barcode_value: 'barcode_value',
  qr_code_data: 'qr_code_data',
  label_printed_at: 'label_printed_at',
  aisle_id: 'aisle_id'
};

exports.Prisma.Replenishment_rulesScalarFieldEnum = {
  rule_id: 'rule_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  product_id: 'product_id',
  from_location_id: 'from_location_id',
  to_location_id: 'to_location_id',
  zone_id: 'zone_id',
  min_quantity: 'min_quantity',
  max_quantity: 'max_quantity',
  reorder_point: 'reorder_point',
  reorder_quantity: 'reorder_quantity',
  priority: 'priority',
  is_active: 'is_active',
  auto_generate_tasks: 'auto_generate_tasks',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Replenishment_tasksScalarFieldEnum = {
  task_id: 'task_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  task_number: 'task_number',
  task_name: 'task_name',
  description: 'description',
  product_id: 'product_id',
  lot_id: 'lot_id',
  from_location_id: 'from_location_id',
  to_location_id: 'to_location_id',
  quantity_requested: 'quantity_requested',
  quantity_moved: 'quantity_moved',
  uom_id: 'uom_id',
  status: 'status',
  priority: 'priority',
  assigned_to_user_id: 'assigned_to_user_id',
  rule_id: 'rule_id',
  created_date: 'created_date',
  due_date: 'due_date',
  started_at: 'started_at',
  completed_at: 'completed_at',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Sales_order_linesScalarFieldEnum = {
  line_id: 'line_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  order_id: 'order_id',
  line_number: 'line_number',
  product_id: 'product_id',
  product_name: 'product_name',
  product_code: 'product_code',
  requested_quantity: 'requested_quantity',
  fulfilled_quantity: 'fulfilled_quantity',
  remaining_quantity: 'remaining_quantity',
  uom_id: 'uom_id',
  unit_price: 'unit_price',
  line_total: 'line_total',
  status: 'status',
  promised_delivery_date: 'promised_delivery_date',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Sales_ordersScalarFieldEnum = {
  order_id: 'order_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  order_number: 'order_number',
  order_name: 'order_name',
  description: 'description',
  client_id: 'client_id',
  client_name: 'client_name',
  client_code: 'client_code',
  delivery_address_line1: 'delivery_address_line1',
  delivery_address_line2: 'delivery_address_line2',
  delivery_city: 'delivery_city',
  delivery_state_province: 'delivery_state_province',
  delivery_postal_code: 'delivery_postal_code',
  delivery_country_code: 'delivery_country_code',
  delivery_contact_name: 'delivery_contact_name',
  delivery_contact_phone: 'delivery_contact_phone',
  delivery_instructions: 'delivery_instructions',
  order_date: 'order_date',
  requested_delivery_date: 'requested_delivery_date',
  promised_delivery_date: 'promised_delivery_date',
  currency_code: 'currency_code',
  total_order_value: 'total_order_value',
  total_order_quantity: 'total_order_quantity',
  priority: 'priority',
  assigned_sales_rep_id: 'assigned_sales_rep_id',
  assigned_warehouse_user_id: 'assigned_warehouse_user_id',
  confirmed_date: 'confirmed_date',
  shipped_date: 'shipped_date',
  delivered_date: 'delivered_date',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  status: 'status',
  order_type: 'order_type',
  customer_id: 'customer_id'
};

exports.Prisma.Shipment_status_historyScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  shipment_id: 'shipment_id',
  previous_status: 'previous_status',
  current_status: 'current_status',
  changed_at: 'changed_at',
  changed_by: 'changed_by',
  user_id: 'user_id',
  reason_code: 'reason_code',
  notes: 'notes',
  device_id: 'device_id',
  created_at: 'created_at'
};

exports.Prisma.Shipping_labelsScalarFieldEnum = {
  label_id: 'label_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  shipment_id: 'shipment_id',
  tracking_number: 'tracking_number',
  label_data_url: 'label_data_url',
  label_format: 'label_format',
  service_level: 'service_level',
  weight: 'weight',
  length: 'length',
  width: 'width',
  height: 'height',
  shipping_cost: 'shipping_cost',
  currency_code: 'currency_code',
  status: 'status',
  generated_at: 'generated_at',
  printed_at: 'printed_at',
  applied_to_shipment_at: 'applied_to_shipment_at',
  carrier_confirmation_number: 'carrier_confirmation_number',
  carrier_picked_up_at: 'carrier_picked_up_at',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Storage_billing_cyclesScalarFieldEnum = {
  cycle_id: 'cycle_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  cycle_number: 'cycle_number',
  cycle_name: 'cycle_name',
  billing_period_start: 'billing_period_start',
  billing_period_end: 'billing_period_end',
  status: 'status',
  total_storage_days: 'total_storage_days',
  total_volumetric_weight: 'total_volumetric_weight',
  total_storage_charges: 'total_storage_charges',
  total_vas_charges: 'total_vas_charges',
  currency_code: 'currency_code',
  processed_at: 'processed_at',
  processed_by_user_id: 'processed_by_user_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Storage_chargesScalarFieldEnum = {
  charge_id: 'charge_id',
  tenant_id: 'tenant_id',
  billing_cycle_id: 'billing_cycle_id',
  owner_client_id: 'owner_client_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  storage_start_date: 'storage_start_date',
  storage_end_date: 'storage_end_date',
  days_in_storage: 'days_in_storage',
  volume_stored: 'volume_stored',
  volumetric_weight: 'volumetric_weight',
  unit_type: 'unit_type',
  applicable_rate: 'applicable_rate',
  charge_amount: 'charge_amount',
  currency: 'currency',
  created_at: 'created_at'
};

exports.Prisma.Storage_inventory_snapshotsScalarFieldEnum = {
  snapshot_id: 'snapshot_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  cycle_id: 'cycle_id',
  snapshot_date: 'snapshot_date',
  product_id: 'product_id',
  lot_id: 'lot_id',
  location_id: 'location_id',
  quantity_on_hand: 'quantity_on_hand',
  volumetric_weight: 'volumetric_weight',
  storage_days: 'storage_days',
  storage_rate_id: 'storage_rate_id',
  daily_storage_charge: 'daily_storage_charge',
  currency_code: 'currency_code',
  created_by: 'created_by',
  created_at: 'created_at'
};

exports.Prisma.Storage_locationsScalarFieldEnum = {
  location_id: 'location_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  zone_id: 'zone_id',
  rack_row_id: 'rack_row_id',
  level_id: 'level_id',
  bay_number: 'bay_number',
  location_name: 'location_name',
  location_code: 'location_code',
  location_type: 'location_type',
  description: 'description',
  length: 'length',
  width: 'width',
  height: 'height',
  max_weight: 'max_weight',
  max_volume: 'max_volume',
  allowed_product_categories_json: 'allowed_product_categories_json',
  allowed_product_attributes_json: 'allowed_product_attributes_json',
  allowed_storage_conditions_json: 'allowed_storage_conditions_json',
  is_active: 'is_active',
  is_blocked: 'is_blocked',
  is_reserved: 'is_reserved',
  block_reason: 'block_reason',
  reservation_details_json: 'reservation_details_json',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  pick_sequence_number: 'pick_sequence_number',
  travel_distance_from_dock: 'travel_distance_from_dock',
  last_picked_at: 'last_picked_at',
  barcode_value: 'barcode_value',
  qr_code_data: 'qr_code_data',
  label_printed_at: 'label_printed_at',
  aisle_id: 'aisle_id',
  bay_id: 'bay_id',
  client_id: 'client_id'
};

exports.Prisma.Storage_rate_masterScalarFieldEnum = {
  rate_id: 'rate_id',
  tenant_id: 'tenant_id',
  client_id: 'client_id',
  location_zone_type: 'location_zone_type',
  unit_type: 'unit_type',
  rate_per_unit: 'rate_per_unit',
  rate_currency: 'rate_currency',
  rate_calculation_method: 'rate_calculation_method',
  minimum_charge_days: 'minimum_charge_days',
  free_storage_days: 'free_storage_days',
  effective_from: 'effective_from',
  effective_to: 'effective_to'
};

exports.Prisma.Storage_ratesScalarFieldEnum = {
  rate_id: 'rate_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  rate_code: 'rate_code',
  rate_name: 'rate_name',
  description: 'description',
  rate_type: 'rate_type',
  base_rate: 'base_rate',
  currency_code: 'currency_code',
  uom_id: 'uom_id',
  volumetric_divisor: 'volumetric_divisor',
  minimum_charge: 'minimum_charge',
  maximum_charge: 'maximum_charge',
  effective_from_date: 'effective_from_date',
  effective_to_date: 'effective_to_date',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Storage_vas_invoice_linesScalarFieldEnum = {
  line_id: 'line_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  invoice_id: 'invoice_id',
  line_type: 'line_type',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  location_id: 'location_id',
  description: 'description',
  quantity: 'quantity',
  uom_id: 'uom_id',
  unit_rate: 'unit_rate',
  line_amount: 'line_amount',
  currency_code: 'currency_code',
  service_date: 'service_date',
  billing_period_start: 'billing_period_start',
  billing_period_end: 'billing_period_end',
  created_by: 'created_by',
  created_at: 'created_at'
};

exports.Prisma.Storage_vas_invoicesScalarFieldEnum = {
  invoice_id: 'invoice_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  invoice_number: 'invoice_number',
  invoice_type: 'invoice_type',
  billing_entity_type: 'billing_entity_type',
  billing_entity_id: 'billing_entity_id',
  cycle_id: 'cycle_id',
  invoice_date: 'invoice_date',
  due_date: 'due_date',
  currency_code: 'currency_code',
  subtotal_amount: 'subtotal_amount',
  tax_amount: 'tax_amount',
  total_amount: 'total_amount',
  status: 'status',
  payment_terms: 'payment_terms',
  issued_at: 'issued_at',
  paid_at: 'paid_at',
  payment_reference: 'payment_reference',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.System_audit_logScalarFieldEnum = {
  audit_log_id: 'audit_log_id',
  tenant_id: 'tenant_id',
  action: 'action',
  table_name: 'table_name',
  record_id: 'record_id',
  user_id: 'user_id',
  session_id: 'session_id',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  old_values_json: 'old_values_json',
  new_values_json: 'new_values_json',
  changes_summary_json: 'changes_summary_json',
  notes: 'notes',
  action_timestamp: 'action_timestamp',
  version: 'version',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Units_of_measureScalarFieldEnum = {
  uom_id: 'uom_id',
  tenant_id: 'tenant_id',
  uom_name: 'uom_name',
  uom_code: 'uom_code',
  description: 'description',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Variance_investigationsScalarFieldEnum = {
  investigation_id: 'investigation_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  count_id: 'count_id',
  count_number: 'count_number',
  accuracy_history_id: 'accuracy_history_id',
  product_id: 'product_id',
  product_sku: 'product_sku',
  location_id: 'location_id',
  location_code: 'location_code',
  variance_quantity: 'variance_quantity',
  variance_percentage: 'variance_percentage',
  system_quantity: 'system_quantity',
  counted_quantity: 'counted_quantity',
  variance_reason: 'variance_reason',
  root_cause: 'root_cause',
  investigation_notes: 'investigation_notes',
  corrective_action: 'corrective_action',
  status: 'status',
  priority: 'priority',
  assigned_to: 'assigned_to',
  assigned_to_name: 'assigned_to_name',
  assigned_at: 'assigned_at',
  investigated_by: 'investigated_by',
  investigated_by_name: 'investigated_by_name',
  investigated_at: 'investigated_at',
  resolved_at: 'resolved_at',
  days_to_resolve: 'days_to_resolve',
  is_recurring_variance: 'is_recurring_variance',
  occurrences_last_30_days: 'occurrences_last_30_days',
  occurrences_last_90_days: 'occurrences_last_90_days',
  created_at: 'created_at',
  created_by: 'created_by',
  updated_at: 'updated_at',
  updated_by: 'updated_by',
  version: 'version'
};

exports.Prisma.Vas_execution_chargesScalarFieldEnum = {
  charge_id: 'charge_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  charge_number: 'charge_number',
  charge_date: 'charge_date',
  vas_task_id: 'vas_task_id',
  task_number: 'task_number',
  vas_service_id: 'vas_service_id',
  service_code: 'service_code',
  service_name: 'service_name',
  service_category: 'service_category',
  client_id: 'client_id',
  order_id: 'order_id',
  order_number: 'order_number',
  shipment_id: 'shipment_id',
  product_id: 'product_id',
  product_sku: 'product_sku',
  product_name: 'product_name',
  quantity: 'quantity',
  rate_per_unit: 'rate_per_unit',
  line_total: 'line_total',
  currency_code: 'currency_code',
  labor_hours: 'labor_hours',
  labor_rate_per_hour: 'labor_rate_per_hour',
  labor_charge: 'labor_charge',
  charge_status: 'charge_status',
  billing_cycle_id: 'billing_cycle_id',
  invoice_id: 'invoice_id',
  invoice_line_id: 'invoice_line_id',
  billed_at: 'billed_at',
  executed_by_user_id: 'executed_by_user_id',
  executed_at: 'executed_at',
  work_station_id: 'work_station_id',
  approved_by: 'approved_by',
  approved_at: 'approved_at',
  approval_notes: 'approval_notes',
  disputed: 'disputed',
  dispute_reason: 'dispute_reason',
  dispute_resolved_at: 'dispute_resolved_at',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  billing_rate_id: 'billing_rate_id',
  billed_invoice_line_id: 'billed_invoice_line_id'
};

exports.Prisma.Vas_execution_tasksScalarFieldEnum = {
  task_id: 'task_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  task_number: 'task_number',
  task_type: 'task_type',
  vas_service_id: 'vas_service_id',
  service_code: 'service_code',
  service_name: 'service_name',
  order_id: 'order_id',
  order_line_id: 'order_line_id',
  shipment_id: 'shipment_id',
  inventory_item_id: 'inventory_item_id',
  product_id: 'product_id',
  product_sku: 'product_sku',
  product_name: 'product_name',
  quantity_required: 'quantity_required',
  quantity_completed: 'quantity_completed',
  uom_id: 'uom_id',
  source_location_id: 'source_location_id',
  work_station_id: 'work_station_id',
  scheduled_start_time: 'scheduled_start_time',
  scheduled_end_time: 'scheduled_end_time',
  priority: 'priority',
  status: 'status',
  assigned_to_user_id: 'assigned_to_user_id',
  assigned_at: 'assigned_at',
  started_at: 'started_at',
  completed_at: 'completed_at',
  estimated_duration_minutes: 'estimated_duration_minutes',
  actual_duration_minutes: 'actual_duration_minutes',
  quality_check_required: 'quality_check_required',
  quality_checked_by: 'quality_checked_by',
  quality_checked_at: 'quality_checked_at',
  quality_status: 'quality_status',
  rate_per_unit: 'rate_per_unit',
  total_charge: 'total_charge',
  charge_status: 'charge_status',
  billed_at: 'billed_at',
  invoice_id: 'invoice_id',
  special_instructions: 'special_instructions',
  execution_notes: 'execution_notes',
  exception_notes: 'exception_notes',
  attachments_json: 'attachments_json',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by',
  sales_order_line_id: 'sales_order_line_id',
  source_wave_id: 'source_wave_id',
  source_picking_task_id: 'source_picking_task_id'
};

exports.Prisma.Vas_service_catalogScalarFieldEnum = {
  service_code: 'service_code',
  service_name: 'service_name',
  rate_type: 'rate_type',
  standard_rate: 'standard_rate',
  default_currency: 'default_currency',
  created_at: 'created_at',
  updated_at: 'updated_at',
  tenant_id: 'tenant_id',
  service_category: 'service_category',
  is_active: 'is_active'
};

exports.Prisma.Vas_service_client_ratesScalarFieldEnum = {
  id: 'id',
  service_code: 'service_code',
  client_id: 'client_id',
  client_specific_rate: 'client_specific_rate',
  currency: 'currency',
  tenant_id: 'tenant_id'
};

exports.Prisma.Vas_servicesScalarFieldEnum = {
  vas_id: 'vas_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  vas_code: 'vas_code',
  vas_name: 'vas_name',
  description: 'description',
  service_category: 'service_category',
  charge_type: 'charge_type',
  base_charge: 'base_charge',
  currency_code: 'currency_code',
  uom_id: 'uom_id',
  minimum_charge: 'minimum_charge',
  maximum_charge: 'maximum_charge',
  requires_approval: 'requires_approval',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Vas_task_eventsScalarFieldEnum = {
  vas_task_event_id: 'vas_task_event_id',
  tenant_id: 'tenant_id',
  vas_task_id: 'vas_task_id',
  event_type: 'event_type',
  event_payload: 'event_payload',
  recorded_by: 'recorded_by',
  recorded_at: 'recorded_at'
};

exports.Prisma.Vas_transactionsScalarFieldEnum = {
  vas_transaction_id: 'vas_transaction_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  cycle_id: 'cycle_id',
  reference_type: 'reference_type',
  reference_id: 'reference_id',
  vas_id: 'vas_id',
  product_id: 'product_id',
  lot_id: 'lot_id',
  quantity_processed: 'quantity_processed',
  uom_id: 'uom_id',
  service_date: 'service_date',
  performed_by_user_id: 'performed_by_user_id',
  charge_amount: 'charge_amount',
  currency_code: 'currency_code',
  billing_status: 'billing_status',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Vas_workstationsScalarFieldEnum = {
  workstation_id: 'workstation_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  workstation_code: 'workstation_code',
  workstation_name: 'workstation_name',
  zone_id: 'zone_id',
  aisle: 'aisle',
  floor_level: 'floor_level',
  station_type: 'station_type',
  supported_services: 'supported_services',
  equipment_json: 'equipment_json',
  max_concurrent_tasks: 'max_concurrent_tasks',
  current_active_tasks: 'current_active_tasks',
  status: 'status',
  operational_hours_json: 'operational_hours_json',
  assigned_user_id: 'assigned_user_id',
  last_used_at: 'last_used_at',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Vendor_addressesScalarFieldEnum = {
  vendor_address_id: 'vendor_address_id',
  tenant_id: 'tenant_id',
  vendor_id: 'vendor_id',
  address_type: 'address_type',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  city: 'city',
  state_province: 'state_province',
  postal_code: 'postal_code',
  country_code: 'country_code',
  is_default: 'is_default',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Vendor_contactsScalarFieldEnum = {
  contact_id: 'contact_id',
  tenant_id: 'tenant_id',
  vendor_id: 'vendor_id',
  first_name: 'first_name',
  last_name: 'last_name',
  job_title: 'job_title',
  email: 'email',
  phone: 'phone',
  is_primary: 'is_primary',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.VendorsScalarFieldEnum = {
  vendor_id: 'vendor_id',
  tenant_id: 'tenant_id',
  vendor_code: 'vendor_code',
  vendor_name: 'vendor_name',
  description: 'description',
  primary_contact_name: 'primary_contact_name',
  primary_contact_email: 'primary_contact_email',
  primary_contact_phone: 'primary_contact_phone',
  payment_terms: 'payment_terms',
  tax_id_number: 'tax_id_number',
  performance_score: 'performance_score',
  preferred_status: 'preferred_status',
  is_active: 'is_active',
  is_deleted: 'is_deleted',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Warehouse_equipmentScalarFieldEnum = {
  equipment_id: 'equipment_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  equipment_name: 'equipment_name',
  equipment_code: 'equipment_code',
  equipment_type: 'equipment_type',
  description: 'description',
  model_number: 'model_number',
  serial_number: 'serial_number',
  manufacturer: 'manufacturer',
  purchase_date: 'purchase_date',
  purchase_cost: 'purchase_cost',
  status: 'status',
  current_location_id: 'current_location_id',
  assigned_user_id: 'assigned_user_id',
  last_maintenance_date: 'last_maintenance_date',
  next_maintenance_date: 'next_maintenance_date',
  maintenance_interval_months: 'maintenance_interval_months',
  is_active: 'is_active',
  is_deleted: 'is_deleted',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Warehouse_eventsScalarFieldEnum = {
  event_id: 'event_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  event_type: 'event_type',
  event_subtype: 'event_subtype',
  description: 'description',
  severity: 'severity',
  related_object_type: 'related_object_type',
  related_object_id: 'related_object_id',
  affected_user_id: 'affected_user_id',
  resolved_at: 'resolved_at',
  resolved_by_user_id: 'resolved_by_user_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Warehouse_facilitiesScalarFieldEnum = {
  facility_id: 'facility_id',
  tenant_id: 'tenant_id',
  facility_name: 'facility_name',
  facility_code: 'facility_code',
  facility_type: 'facility_type',
  description: 'description',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  city: 'city',
  state_province: 'state_province',
  postal_code: 'postal_code',
  country_code: 'country_code',
  contact_person: 'contact_person',
  contact_phone: 'contact_phone',
  contact_email: 'contact_email',
  timezone_name: 'timezone_name',
  default_uom_id: 'default_uom_id',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Warehouse_zonesScalarFieldEnum = {
  zone_id: 'zone_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  zone_name: 'zone_name',
  zone_code: 'zone_code',
  zone_type: 'zone_type',
  description: 'description',
  configuration_json: 'configuration_json',
  is_active: 'is_active',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version',
  layout_coordinates_json: 'layout_coordinates_json',
  visual_map_url: 'visual_map_url',
  zone_color_hex: 'zone_color_hex'
};

exports.Prisma.Wave_ordersScalarFieldEnum = {
  wave_order_id: 'wave_order_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  wave_id: 'wave_id',
  order_id: 'order_id',
  added_at: 'added_at',
  released_at: 'released_at',
  completed_at: 'completed_at',
  removed_at: 'removed_at',
  added_by: 'added_by',
  removed_by: 'removed_by',
  version: 'version',
  status: 'status'
};

exports.Prisma.Work_order_componentsScalarFieldEnum = {
  component_id: 'component_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  work_order_id: 'work_order_id',
  component_product_id: 'component_product_id',
  component_product_name: 'component_product_name',
  component_product_code: 'component_product_code',
  required_quantity: 'required_quantity',
  total_required_quantity: 'total_required_quantity',
  issued_quantity: 'issued_quantity',
  remaining_required_quantity: 'remaining_required_quantity',
  uom_id: 'uom_id',
  status: 'status',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Work_order_operationsScalarFieldEnum = {
  operation_id: 'operation_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  work_order_id: 'work_order_id',
  operation_number: 'operation_number',
  operation_name: 'operation_name',
  description: 'description',
  required_equipment_type: 'required_equipment_type',
  required_skill_set: 'required_skill_set',
  standard_time_minutes: 'standard_time_minutes',
  status: 'status',
  assigned_to_user_id: 'assigned_to_user_id',
  started_at: 'started_at',
  completed_at: 'completed_at',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Work_ordersScalarFieldEnum = {
  work_order_id: 'work_order_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  work_order_number: 'work_order_number',
  work_order_name: 'work_order_name',
  description: 'description',
  work_order_type: 'work_order_type',
  product_id: 'product_id',
  product_name: 'product_name',
  product_code: 'product_code',
  planned_quantity: 'planned_quantity',
  fulfilled_quantity: 'fulfilled_quantity',
  remaining_quantity: 'remaining_quantity',
  uom_id: 'uom_id',
  status: 'status',
  priority: 'priority',
  assigned_to_user_id: 'assigned_to_user_id',
  created_date: 'created_date',
  released_date: 'released_date',
  scheduled_start_date: 'scheduled_start_date',
  scheduled_end_date: 'scheduled_end_date',
  actual_start_date: 'actual_start_date',
  actual_end_date: 'actual_end_date',
  completed_at: 'completed_at',
  assigned_at: 'assigned_at',
  started_at: 'started_at',
  progress_percentage: 'progress_percentage',
  actual_duration_hours: 'actual_duration_hours',
  completed_items_count: 'completed_items_count',
  source_type: 'source_type',
  source_reference_id: 'source_reference_id',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.Yard_vehiclesScalarFieldEnum = {
  vehicle_id: 'vehicle_id',
  tenant_id: 'tenant_id',
  facility_id: 'facility_id',
  vehicle_type: 'vehicle_type',
  license_plate: 'license_plate',
  vin: 'vin',
  description: 'description',
  current_location_code: 'current_location_code',
  status: 'status',
  assigned_to_reference_type: 'assigned_to_reference_type',
  assigned_to_reference_id: 'assigned_to_reference_id',
  arrival_time: 'arrival_time',
  departure_time: 'departure_time',
  notes: 'notes',
  created_by: 'created_by',
  updated_by: 'updated_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  version: 'version'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.approval_level = exports.$Enums.approval_level = {
  AUTO_APPROVED: 'AUTO_APPROVED',
  SUPERVISOR: 'SUPERVISOR',
  MANAGER: 'MANAGER',
  DIRECTOR: 'DIRECTOR',
  EXECUTIVE: 'EXECUTIVE'
};

exports.approval_status = exports.$Enums.approval_status = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ESCALATED: 'ESCALATED',
  CANCELLED: 'CANCELLED'
};

exports.asn_status = exports.$Enums.asn_status = {
  CREATED: 'CREATED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  IN_RECEIVING: 'IN_RECEIVING',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
};

exports.bay_status = exports.$Enums.bay_status = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  ASSIGNED: 'ASSIGNED',
  LOADING: 'LOADING',
  LOADING_COMPLETE: 'LOADING_COMPLETE',
  MAINTENANCE: 'MAINTENANCE',
  BLOCKED: 'BLOCKED'
};

exports.zone_type = exports.$Enums.zone_type = {
  BULK: 'BULK',
  RACK: 'RACK',
  COLD_STORAGE: 'COLD_STORAGE',
  HAZMAT: 'HAZMAT',
  PICKING: 'PICKING',
  RECEIVING: 'RECEIVING',
  SHIPPING: 'SHIPPING',
  PACKING: 'PACKING',
  QUALITY_HOLD: 'QUALITY_HOLD',
  DAMAGE: 'DAMAGE',
  TEMPORARY: 'TEMPORARY',
  YARD: 'YARD',
  RETURNS: 'RETURNS'
};

exports.period_type = exports.$Enums.period_type = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY'
};

exports.exception_type = exports.$Enums.exception_type = {
  INVENTORY_DISCREPANCY: 'INVENTORY_DISCREPANCY',
  QUALITY_ISSUE: 'QUALITY_ISSUE',
  TASK_EXCEPTION: 'TASK_EXCEPTION',
  EQUIPMENT_FAILURE: 'EQUIPMENT_FAILURE',
  SAFETY_VIOLATION: 'SAFETY_VIOLATION',
  PROCESS_DEVIATION: 'PROCESS_DEVIATION',
  DOCUMENTATION_ERROR: 'DOCUMENTATION_ERROR',
  OTHER: 'OTHER'
};

exports.exception_severity = exports.$Enums.exception_severity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.receipt_status = exports.$Enums.receipt_status = {
  CREATED: 'CREATED',
  ARRIVED: 'ARRIVED',
  RECEIVING: 'RECEIVING',
  PARTIAL: 'PARTIAL',
  RECEIVED: 'RECEIVED',
  INSPECTION_IN_PROGRESS: 'INSPECTION_IN_PROGRESS',
  INSPECTED: 'INSPECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.location_type = exports.$Enums.location_type = {
  PALLET: 'PALLET',
  CASE: 'CASE',
  EACH: 'EACH',
  SPECIALIZED: 'SPECIALIZED',
  TEMPORARY: 'TEMPORARY'
};

exports.count_method = exports.$Enums.count_method = {
  CYCLE: 'CYCLE',
  PHYSICAL: 'PHYSICAL',
  SPOT: 'SPOT',
  BLIND: 'BLIND',
  CONTROL_GROUP: 'CONTROL_GROUP',
  OPPORTUNITY: 'OPPORTUNITY'
};

exports.count_frequency_type = exports.$Enums.count_frequency_type = {
  MANUAL: 'MANUAL',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ABC_DRIVEN: 'ABC_DRIVEN'
};

exports.count_priority = exports.$Enums.count_priority = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

exports.sampling_method = exports.$Enums.sampling_method = {
  FULL: 'FULL',
  STRATIFIED: 'STRATIFIED',
  RANDOM: 'RANDOM',
  RISK_BASED: 'RISK_BASED'
};

exports.hold_reason = exports.$Enums.hold_reason = {
  QC_PENDING: 'QC_PENDING',
  QC_FAILED: 'QC_FAILED',
  DAMAGE: 'DAMAGE',
  EXPIRY: 'EXPIRY',
  CREDIT_HOLD: 'CREDIT_HOLD',
  CYCLE_COUNT: 'CYCLE_COUNT',
  INVESTIGATION: 'INVESTIGATION',
  COMPLIANCE: 'COMPLIANCE',
  CUSTOMER_REQUEST: 'CUSTOMER_REQUEST',
  VENDOR_RETURN: 'VENDOR_RETURN',
  RECALL: 'RECALL',
  QUARANTINE: 'QUARANTINE',
  OTHER: 'OTHER'
};

exports.hold_status = exports.$Enums.hold_status = {
  ACTIVE: 'ACTIVE',
  RELEASED: 'RELEASED',
  EXPIRED: 'EXPIRED',
  SUPERSEDED: 'SUPERSEDED'
};

exports.transaction_type = exports.$Enums.transaction_type = {
  RECEIPT: 'RECEIPT',
  ISSUE: 'ISSUE',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
  RETURN: 'RETURN',
  PHYSICAL_COUNT: 'PHYSICAL_COUNT',
  CYCLE_COUNT: 'CYCLE_COUNT',
  SPOT_CHECK: 'SPOT_CHECK',
  WRITE_OFF: 'WRITE_OFF',
  RESERVATION: 'RESERVATION',
  ALLOCATION: 'ALLOCATION',
  DEALLOCATION: 'DEALLOCATION',
  PICK: 'PICK',
  PUTAWAY: 'PUTAWAY',
  ADJUSTMENT_INCREASE: 'ADJUSTMENT_INCREASE',
  ADJUSTMENT_DECREASE: 'ADJUSTMENT_DECREASE',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  QUARANTINE: 'QUARANTINE',
  SCRAP: 'SCRAP'
};

exports.transaction_status = exports.$Enums.transaction_status = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ERROR: 'ERROR'
};

exports.lpn_type = exports.$Enums.lpn_type = {
  PALLET: 'PALLET',
  CARTON: 'CARTON',
  CASE: 'CASE',
  EACH: 'EACH',
  MIXED: 'MIXED',
  TOTE: 'TOTE',
  BIN: 'BIN'
};

exports.lpn_status = exports.$Enums.lpn_status = {
  RECEIVED: 'RECEIVED',
  IN_STAGING: 'IN_STAGING',
  IN_QC: 'IN_QC',
  PUTAWAY_PENDING: 'PUTAWAY_PENDING',
  IN_TRANSIT: 'IN_TRANSIT',
  STORED: 'STORED',
  ALLOCATED: 'ALLOCATED',
  PICK_PENDING: 'PICK_PENDING',
  PICKED: 'PICKED',
  PACKED: 'PACKED',
  NESTED: 'NESTED',
  STAGED: 'STAGED',
  LOADED: 'LOADED',
  SHIPPED: 'SHIPPED',
  QUARANTINED: 'QUARANTINED',
  CONSUMED: 'CONSUMED',
  DISPOSED: 'DISPOSED'
};

exports.load_status = exports.$Enums.load_status = {
  PLANNED: 'PLANNED',
  READY: 'READY',
  LOADING: 'LOADING',
  LOADED: 'LOADED',
  DEPARTED: 'DEPARTED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  CLOSED: 'CLOSED'
};

exports.lpn_transaction_type = exports.$Enums.lpn_transaction_type = {
  CREATED: 'CREATED',
  RECEIVED: 'RECEIVED',
  MOVED: 'MOVED',
  NESTED: 'NESTED',
  UNNESTED: 'UNNESTED',
  PICKED: 'PICKED',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  STATUS_CHANGE: 'STATUS_CHANGE',
  MERGED: 'MERGED',
  SPLIT: 'SPLIT',
  DISPOSED: 'DISPOSED'
};

exports.shipment_status = exports.$Enums.shipment_status = {
  CREATED: 'CREATED',
  CARRIER_ASSIGNED: 'CARRIER_ASSIGNED',
  STAGED: 'STAGED',
  LOADED: 'LOADED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

exports.packing_session_status = exports.$Enums.packing_session_status = {
  STATION_ASSIGNED: 'STATION_ASSIGNED',
  PACKING_ACTIVE: 'PACKING_ACTIVE',
  PACKING_PAUSED: 'PACKING_PAUSED',
  PACKING_COMPLETED: 'PACKING_COMPLETED',
  PACKING_CANCELLED: 'PACKING_CANCELLED',
  STATION_TIMEOUT: 'STATION_TIMEOUT'
};

exports.task_status = exports.$Enums.task_status = {
  CREATED: 'CREATED',
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  EXCEPTION: 'EXCEPTION',
  CANCELLED: 'CANCELLED'
};

exports.task_status_old = exports.$Enums.task_status_old = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD'
};

exports.quality_hold_status = exports.$Enums.quality_hold_status = {
  OPEN: 'OPEN',
  RELEASED: 'RELEASED',
  CANCELLED: 'CANCELLED'
};

exports.order_line_status = exports.$Enums.order_line_status = {
  CREATED: 'CREATED',
  ON_HOLD: 'ON_HOLD',
  ALLOCATED: 'ALLOCATED',
  RELEASED: 'RELEASED',
  PICK_IN_PROGRESS: 'PICK_IN_PROGRESS',
  PICKED: 'PICKED',
  SHORT: 'SHORT',
  PACKED: 'PACKED',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  BACKORDERED: 'BACKORDERED',
  CANCELLED: 'CANCELLED'
};

exports.order_status = exports.$Enums.order_status = {
  CREATED: 'CREATED',
  VALIDATED: 'VALIDATED',
  ON_HOLD: 'ON_HOLD',
  RELEASED: 'RELEASED',
  WAVED: 'WAVED',
  SHIPPED: 'SHIPPED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  ALLOCATED: 'ALLOCATED',
  PICKED: 'PICKED',
  PACKED: 'PACKED',
  READY_TO_SHIP: 'READY_TO_SHIP'
};

exports.order_type = exports.$Enums.order_type = {
  STANDARD: 'STANDARD',
  EXPEDITED: 'EXPEDITED',
  BACKORDER: 'BACKORDER',
  DROP_SHIP: 'DROP_SHIP',
  TRANSFER: 'TRANSFER',
  REPLACEMENT: 'REPLACEMENT',
  RETURN: 'RETURN'
};

exports.variance_reason = exports.$Enums.variance_reason = {
  COUNT_ERROR: 'COUNT_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  PHYSICAL_DAMAGE: 'PHYSICAL_DAMAGE',
  THEFT: 'THEFT',
  RECEIVING_ERROR: 'RECEIVING_ERROR',
  PICKING_ERROR: 'PICKING_ERROR',
  PUTAWAY_ERROR: 'PUTAWAY_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  LOCATION_ERROR: 'LOCATION_ERROR',
  PRODUCT_MIX: 'PRODUCT_MIX',
  UNIT_OF_MEASURE_ERROR: 'UNIT_OF_MEASURE_ERROR',
  EXPIRATION: 'EXPIRATION',
  QUALITY_HOLD: 'QUALITY_HOLD',
  OTHER: 'OTHER'
};

exports.investigation_status = exports.$Enums.investigation_status = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

exports.equipment_type = exports.$Enums.equipment_type = {
  FORKLIFT: 'FORKLIFT',
  PALLET_JACK: 'PALLET_JACK',
  HAND_TRUCK: 'HAND_TRUCK',
  CONVEYOR: 'CONVEYOR',
  SCANNER: 'SCANNER',
  PRINTER: 'PRINTER',
  COMPUTER: 'COMPUTER',
  OTHER: 'OTHER'
};

exports.equipment_status = exports.$Enums.equipment_status = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  DECOMMISSIONED: 'DECOMMISSIONED'
};

exports.facility_type = exports.$Enums.facility_type = {
  WAREHOUSE: 'WAREHOUSE',
  DISTRIBUTION_CENTER: 'DISTRIBUTION_CENTER',
  MANUFACTURING_PLANT: 'MANUFACTURING_PLANT',
  RETAIL_STORE: 'RETAIL_STORE',
  OFFICE: 'OFFICE',
  COLD_STORAGE: 'COLD_STORAGE',
  HAZMAT_FACILITY: 'HAZMAT_FACILITY',
  CROSS_DOCK: 'CROSS_DOCK',
  FULFILLMENT_CENTER: 'FULFILLMENT_CENTER',
  STORAGE_FACILITY: 'STORAGE_FACILITY'
};

exports.Prisma.ModelName = {
  adjustment_approval_requests: 'adjustment_approval_requests',
  advance_ship_notices: 'advance_ship_notices',
  aisles: 'aisles',
  asn_import_documents: 'asn_import_documents',
  asn_import_jobs: 'asn_import_jobs',
  asn_import_results: 'asn_import_results',
  asn_lines: 'asn_lines',
  barcode_labels: 'barcode_labels',
  bays: 'bays',
  billing_cycles: 'billing_cycles',
  carriers: 'carriers',
  charge_calculation_rules: 'charge_calculation_rules',
  client_addresses: 'client_addresses',
  client_contacts: 'client_contacts',
  client_facility_assignments: 'client_facility_assignments',
  client_invoice_lines: 'client_invoice_lines',
  client_invoices: 'client_invoices',
  clients: 'clients',
  compliance_audits: 'compliance_audits',
  compliance_requirements: 'compliance_requirements',
  count_accuracy_history: 'count_accuracy_history',
  cross_dock_operations: 'cross_dock_operations',
  customer_return_items: 'customer_return_items',
  customer_returns: 'customer_returns',
  customers: 'customers',
  cycle_count_metrics: 'cycle_count_metrics',
  daily_kpi_metrics: 'daily_kpi_metrics',
  dock_appointments: 'dock_appointments',
  equipment_maintenance: 'equipment_maintenance',
  exception_comments: 'exception_comments',
  exception_escalation_rules: 'exception_escalation_rules',
  exception_management: 'exception_management',
  facility_access_control: 'facility_access_control',
  facility_user_assignments: 'facility_user_assignments',
  flyway_schema_history: 'flyway_schema_history',
  fulfillment_billing_events: 'fulfillment_billing_events',
  fulfillment_billing_run_events: 'fulfillment_billing_run_events',
  fulfillment_billing_runs: 'fulfillment_billing_runs',
  fulfillment_workflow_definitions: 'fulfillment_workflow_definitions',
  fulfillment_workflow_events: 'fulfillment_workflow_events',
  fulfillment_workflow_executions: 'fulfillment_workflow_executions',
  fulfillment_workflow_transitions: 'fulfillment_workflow_transitions',
  goods_receipt_items: 'goods_receipt_items',
  goods_receipt_lines: 'goods_receipt_lines',
  goods_receipts: 'goods_receipts',
  hazmat_materials: 'hazmat_materials',
  inventory_adjustment_lines: 'inventory_adjustment_lines',
  inventory_adjustments: 'inventory_adjustments',
  inventory_allocation_rule_constraints: 'inventory_allocation_rule_constraints',
  inventory_allocation_rule_locations: 'inventory_allocation_rule_locations',
  inventory_allocation_rules: 'inventory_allocation_rules',
  inventory_allocations: 'inventory_allocations',
  inventory_count_lines: 'inventory_count_lines',
  inventory_counts: 'inventory_counts',
  inventory_holds: 'inventory_holds',
  inventory_items: 'inventory_items',
  inventory_lots: 'inventory_lots',
  inventory_on_hand: 'inventory_on_hand',
  inventory_policies: 'inventory_policies',
  inventory_reservations: 'inventory_reservations',
  inventory_transactions: 'inventory_transactions',
  labor_performance_metrics: 'labor_performance_metrics',
  labor_shift_assignments: 'labor_shift_assignments',
  labor_shifts: 'labor_shifts',
  labor_time_logs: 'labor_time_logs',
  license_plate_numbers: 'license_plate_numbers',
  load_shipments: 'load_shipments',
  loading_docks: 'loading_docks',
  loads: 'loads',
  location_pick_heatmap: 'location_pick_heatmap',
  lpn_transactions: 'lpn_transactions',
  non_conformance_reports: 'non_conformance_reports',
  outbound_shipment_items: 'outbound_shipment_items',
  outbound_shipments: 'outbound_shipments',
  packing_containers: 'packing_containers',
  packing_materials: 'packing_materials',
  packing_session_status_history: 'packing_session_status_history',
  packing_sessions: 'packing_sessions',
  packing_slip_items: 'packing_slip_items',
  packing_slips: 'packing_slips',
  packing_stations: 'packing_stations',
  picking_tasks: 'picking_tasks',
  picking_waves: 'picking_waves',
  product_attributes: 'product_attributes',
  product_barcodes: 'product_barcodes',
  product_brands: 'product_brands',
  product_categories: 'product_categories',
  product_client_assignments: 'product_client_assignments',
  product_import_jobs: 'product_import_jobs',
  product_import_results: 'product_import_results',
  product_packaging_hierarchy: 'product_packaging_hierarchy',
  product_suppliers: 'product_suppliers',
  product_variants: 'product_variants',
  product_velocity_classification: 'product_velocity_classification',
  products: 'products',
  purchase_order_lines: 'purchase_order_lines',
  purchase_orders: 'purchase_orders',
  putaway_rules: 'putaway_rules',
  putaway_tasks: 'putaway_tasks',
  quality_holds: 'quality_holds',
  quality_inspection_events: 'quality_inspection_events',
  quality_inspection_results: 'quality_inspection_results',
  quality_inspections: 'quality_inspections',
  rack_levels: 'rack_levels',
  rack_rows: 'rack_rows',
  replenishment_rules: 'replenishment_rules',
  replenishment_tasks: 'replenishment_tasks',
  sales_order_lines: 'sales_order_lines',
  sales_orders: 'sales_orders',
  shipment_status_history: 'shipment_status_history',
  shipping_labels: 'shipping_labels',
  storage_billing_cycles: 'storage_billing_cycles',
  storage_charges: 'storage_charges',
  storage_inventory_snapshots: 'storage_inventory_snapshots',
  storage_locations: 'storage_locations',
  storage_rate_master: 'storage_rate_master',
  storage_rates: 'storage_rates',
  storage_vas_invoice_lines: 'storage_vas_invoice_lines',
  storage_vas_invoices: 'storage_vas_invoices',
  system_audit_log: 'system_audit_log',
  units_of_measure: 'units_of_measure',
  variance_investigations: 'variance_investigations',
  vas_execution_charges: 'vas_execution_charges',
  vas_execution_tasks: 'vas_execution_tasks',
  vas_service_catalog: 'vas_service_catalog',
  vas_service_client_rates: 'vas_service_client_rates',
  vas_services: 'vas_services',
  vas_task_events: 'vas_task_events',
  vas_transactions: 'vas_transactions',
  vas_workstations: 'vas_workstations',
  vendor_addresses: 'vendor_addresses',
  vendor_contacts: 'vendor_contacts',
  vendors: 'vendors',
  warehouse_equipment: 'warehouse_equipment',
  warehouse_events: 'warehouse_events',
  warehouse_facilities: 'warehouse_facilities',
  warehouse_zones: 'warehouse_zones',
  wave_orders: 'wave_orders',
  work_order_components: 'work_order_components',
  work_order_operations: 'work_order_operations',
  work_orders: 'work_orders',
  yard_vehicles: 'yard_vehicles'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
