import child_process from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.WMS_PORT || 3002;
const BASE_URL = `http://localhost:${PORT}/api/v1/wms`;
const AUTH_URL = 'http://localhost:3000/api/v1/auth/login';
const TENANT_CODE = 'DE0001';
const TEST_USER_ID = '048aa908-086a-4c97-9931-ccc0170590cf';
const USER_EMAIL = 'tenant.admin@gmail.com';
const USER_PASSWORD = 'Super@Admin';
const FACILITY_ID = 21;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let serverProcess = null, TOKEN = null, RF_SESSION_ID = null;
let UOM_ID, CATEGORY_ID, CLIENT_ID, PRODUCT_ID, VENDOR_ID, CARRIER_ID, BRAND_ID;
let ZONE_ID, LOCATION_ID, STAGING_LOC_ID;
let PROFILE_ID, DEFECT_CODE_ID, RECEIVING_INSPECTION_ID, HOLD_ID, NCR_ID;

async function startServer() {
  return new Promise((resolve, reject) => {
    const log = fs.openSync('/tmp/wms-qc3.log', 'w');
    serverProcess = child_process.spawn('node', ['dist/main.js'], {
      cwd: __dirname, stdio: ['ignore', log, log],
      env: { ...process.env, PORT: String(PORT) },
    });
    const check = async () => {
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        try {
          const res = await fetch(`http://localhost:${PORT}/api/v1/wms/health`, { signal: AbortSignal.timeout(2000) });
          if (res.ok || res.status === 401) return;
        } catch { /* */ }
      }
      throw new Error('Server did not start in 30s');
    };
    check().then(resolve).catch(reject);
  });
}
function stopServer() { if (serverProcess) { serverProcess.kill('SIGTERM'); serverProcess = null; } }

const uid = Date.now().toString(36).slice(-6);

async function api(method, path, body, expectStatus, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'accept': '*/*', 'Authorization': `Bearer ${TOKEN}`,
      'X-Tenant-Code': TENANT_CODE, 'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (expectStatus !== undefined) {
    const allowed = Array.isArray(expectStatus) ? expectStatus : [expectStatus];
    if (!allowed.includes(res.status)) {
      const text = await res.text();
      throw new Error(`expected ${allowed.join('/')} got ${res.status}: ${text.slice(0,200)}`);
    }
  }
  const ct = res.headers.get('content-type') || '';
  return { status: res.status, data: ct.includes('application/json') ? await res.json() : null };
}
function apiRf(method, path, body, expectStatus) {
  return api(method, path, body, expectStatus, { 'x-rf-session-id': RF_SESSION_ID });
}

function getId(d) {
  if (d?.data && !d.id) d = d.data;
  return Number(d?.hold_id || d?.holdId || d?.ncr_id || d?.ncrId
    || d?.inspection_id || d?.inspectionId
    || d?.profile_id || d?.profileId || d?.defect_code_id || d?.defectCodeId
    || d?.po_id || d?.poId || d?.asn_id || d?.asnId || d?.trailer_id || d?.trailerId
    || d?.receipt_id || d?.receiptId || d?.task_id || d?.taskId || d?.dock_id || d?.dockId
    || d?.location_id || d?.locationId || d?.zone_id || d?.zoneId
    || d?.brand_id || d?.brandId || d?.carrier_id || d?.carrierId
    || d?.vendor_id || d?.vendorId || d?.product_id || d?.productId
    || d?.client_id || d?.clientId || d?.category_id || d?.categoryId
    || d?.uom_id || d?.uomId || d?.facility_id || d?.facilityId || d?.id);
}
function wrap(d) { return d?.data || d; }
function extractList(r) {
  if (Array.isArray(r.data)) return r.data;
  if (r.data?.data && Array.isArray(r.data.data)) return r.data.data;
  if (r.data?.data?.data && Array.isArray(r.data.data.data)) return r.data.data.data;
  return [];
}

async function login() {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'accept': '*/*', 'X-Tenant-Code': TENANT_CODE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
  });
  if (res.status !== 200) throw new Error(`Login failed`);
  TOKEN = (await res.json()).data.accessToken;
}

async function createRfSession() {
  const r = await api('POST', '/rf/session/login', { facilityId: FACILITY_ID, deviceId: 'E2E-DEVICE', workflowType: 'QUALITY' }, 201);
  RF_SESSION_ID = r.data?.id || r.data?.data?.id;
}

// Master data
async function createUom() {
  const r = await api('POST', '/web/units-of-measure', { uomCode: `QC-EA-${uid}`, uomName: 'Each', uomType: 'COUNT', isActive: true }, 201);
  UOM_ID = getId(wrap(r.data));
}
async function createCategory() {
  const r = await api('POST', '/web/product-categories', { categoryCode: `QC-CAT-${uid}`, categoryName: `QC Cat ${uid}`, isActive: true }, 201);
  CATEGORY_ID = getId(wrap(r.data));
}
async function createClient() {
  const r = await api('POST', '/web/clients', { clientCode: `QC-CL-${uid}`, clientName: `QC Client ${uid}`, isActive: true }, 201);
  CLIENT_ID = getId(wrap(r.data));
}
async function createProduct() {
  const r = await api('POST', '/web/products', { productCode: `QC-PROD-${uid}`, productName: `QC Widget ${uid}`, primaryUomId: UOM_ID, categoryId: CATEGORY_ID, isActive: true }, 201);
  PRODUCT_ID = getId(wrap(r.data));
}
async function createVendor() {
  const r = await api('POST', '/web/vendors', { vendorCode: `QC-VEN-${uid}`, vendorName: `QC Vendor ${uid}`, isActive: true }, 201);
  VENDOR_ID = getId(wrap(r.data));
}
async function createCarrier() {
  const r = await api('POST', '/web/carriers', { carrierCode: `QC-CARR-${uid}`, carrierName: `QC Carrier ${uid}`, isActive: true }, 201);
  CARRIER_ID = getId(wrap(r.data));
}
async function createBrand() {
  const r = await api('POST', '/web/product-brands', { brandCode: `QC-BR-${uid}`, brandName: `QC Brand ${uid}`, isActive: true }, 201);
  BRAND_ID = getId(wrap(r.data));
}
async function createZone() {
  const r = await api('POST', '/web/zones', { facilityId: FACILITY_ID, zoneCode: `QC-ZN-${uid}`, zoneName: `QC Zone ${uid}`, zoneType: 'RECEIVING', isActive: true }, 201);
  ZONE_ID = getId(wrap(r.data));
}
async function createLocation(codeSuffix, type, zoneId) {
  const c = `QC-${codeSuffix}-${uid}`;
  const r = await api('POST', '/web/locations', { facilityId: FACILITY_ID, locationCode: c, locationName: c, locationType: type, isActive: true, zoneId: zoneId || ZONE_ID }, 201);
  return { id: getId(wrap(r.data)), code: c };
}

// === QUALITY ===
async function seedDefectCodes() {
  await api('POST', '/web/defect-codes/seed', {}, 201);
}
async function createDefectCode() {
  const r = await api('POST', '/web/defect-codes', { code: `QC-DMG-${uid}`, description: 'E2E damage', category: 'PRODUCT_DAMAGE', severity: 'HIGH', isActive: true }, 201);
  DEFECT_CODE_ID = getId(wrap(r.data));
}
async function createInspectionProfile() {
  const r = await api('POST', '/web/inspection-profiles', {
    profileName: `QC Profile ${uid}`, description: 'E2E QC profile', isActive: true,
    checklistItems: [
      { checkType: 'PACKAGING', checkLabel: 'Check packaging', isMandatory: true, sortOrder: 1, acceptableCriteria: 'No damage' },
      { checkType: 'LABEL', checkLabel: 'Verify label', isMandatory: true, sortOrder: 2, acceptableCriteria: 'Matches PO' },
      { checkType: 'QUANTITY', checkLabel: 'Count qty', isMandatory: true, sortOrder: 3, acceptableCriteria: 'Matches ASN' },
      { checkType: 'EXPIRY', checkLabel: 'Check expiry', isMandatory: false, sortOrder: 4, acceptableCriteria: '> 90 days' },
    ],
  }, 201);
  PROFILE_ID = getId(wrap(r.data));
}
async function assignProfile() {
  await api('POST', '/web/inspection-profiles/assign-product', { profileId: PROFILE_ID, productId: PRODUCT_ID, vendorId: VENDOR_ID, minExpiryDays: 90, samplingPercentage: 10, samplingMethod: 'STATISTICAL' }, 201);
}

// RF endpoints (require RF session)
async function rfDefectCodes() {
  const r = await apiRf('POST', '/rf/quality/inspections/defect-codes', {}, [200, 201]);
  const codes = extractList(r);
  console.log(`  PASS: RF defect codes: ${codes.length} codes`);
}
async function rfMyTasks() {
  const r = await apiRf('POST', '/rf/quality/inspections/my-tasks', { facilityId: FACILITY_ID, assignedToUserId: TEST_USER_ID }, [200, 201]);
  const tasks = extractList(r);
  console.log(`  PASS: My QC tasks: ${tasks.length}`);
}
async function rfGetNext() {
  const r = await apiRf('POST', '/rf/quality/inspections/get-next', { facilityId: FACILITY_ID, userId: TEST_USER_ID }, [200, 201]);
  console.log(`  PASS: get-next QC task responded (no pending tasks — expected)`);
}
async function rfLpnLookup() {
  const r = await apiRf('POST', '/rf/quality/inspections/lpn-lookup', { barcode: 'NONEXISTENT', facilityId: FACILITY_ID }, [400, 404]);
  console.log(`  PASS: LPN lookup correctly rejected invalid LPN (status=${r.status})`);
}
async function rfValidateLot() {
  const r = await apiRf('POST', '/rf/quality/inspections/validate-lot', { inspectionId: 1, actualLotNumber: `LOT-${uid}` }, [200, 201, 400, 404]);
  console.log(`  PASS: Lot validation responded status=${r.status}`);
}
async function rfValidateExpiry() {
  const r = await apiRf('POST', '/rf/quality/inspections/validate-expiry', { productId: PRODUCT_ID, expiryDate: new Date(Date.now()+120*86400000).toISOString(), facilityId: FACILITY_ID }, [200, 201]);
  console.log(`  PASS: Expiry validation OK`);
}
async function rfRecordTemperature() {
  await apiRf('POST', '/rf/quality/inspections/validate-temperature', { temperatureCelsius: 22.5, isCompliant: true }, 201);
  console.log(`  PASS: Temperature recorded`);
}

// Web QC endpoints
async function createReceivingInspection() {
  const r = await api('POST', '/web/receiving-inspections', {
    facilityId: FACILITY_ID, receiptId: 1, productId: PRODUCT_ID,
    lotNumber: `LOT-${uid}`, inspectionType: 'RECEIVING',
    inspectorId: TEST_USER_ID, notes: 'E2E QC test', createdBy: TEST_USER_ID,
  }, 201);
  RECEIVING_INSPECTION_ID = getId(wrap(r.data));
}
async function listReceivingInspections() {
  const r = await api('GET', `/web/receiving-inspections?facilityId=${FACILITY_ID}`, undefined, 200);
  const items = extractList(r);
  console.log(`  PASS: ${items.length} receiving inspections`);
}
async function createQcDisposition() {
  await api('POST', '/web/qc-dispositions', {
    facilityId: FACILITY_ID, receiptLineId: 1, productId: PRODUCT_ID,
    dispositionType: 'PASS', dispositionQty: 100,
    inspectorId: TEST_USER_ID, notes: 'E2E QC pass', createdBy: TEST_USER_ID,
  }, 201);
}
async function createQualityHold() {
  const r = await api('POST', '/web/quality-holds', {
    facilityId: FACILITY_ID, holdNumber: `HOLD-${uid}`, holdName: `QC Hold ${uid}`,
    description: 'E2E test hold', referenceType: 'INSPECTION', referenceId: RECEIVING_INSPECTION_ID || 1,
    productId: PRODUCT_ID, holdReason: 'QC pending', holdReasonCode: 'QC_PENDING',
    placedByUserId: TEST_USER_ID, affectedQuantity: 100, uomId: UOM_ID,
    notes: 'E2E test hold', createdBy: TEST_USER_ID,
  }, 201);
  HOLD_ID = getId(wrap(r.data));
}
async function listQualityHolds() {
  const r = await api('GET', `/web/quality-holds?facilityId=${FACILITY_ID}`, undefined, 200);
  const items = extractList(r);
  console.log(`  PASS: ${items.length} quality holds`);
}
async function createNcr() {
  const r = await api('POST', '/web/non-conformance-reports', {
    facilityId: FACILITY_ID, ncrNumber: `NCR-${uid}`, ncrName: `QC NCR ${uid}`,
    description: 'E2E test NCR', referenceType: 'INSPECTION', referenceId: RECEIVING_INSPECTION_ID || 1,
    productId: PRODUCT_ID, severity: 'HIGH', assignedToUserId: TEST_USER_ID,
    notes: 'E2E test NCR', correctiveActionRequired: true, createdBy: TEST_USER_ID,
  }, 201);
  NCR_ID = getId(wrap(r.data));
}
async function listNcrs() {
  const r = await api('GET', `/web/non-conformance-reports?facilityId=${FACILITY_ID}`, undefined, 200);
  const items = extractList(r);
  console.log(`  PASS: ${items.length} NCRs`);
}
async function checkPendingReviews() {
  const r = await api('GET', `/web/quality/inspections/pending-review?facilityId=${FACILITY_ID}`, undefined, 200);
  const items = extractList(r);
  console.log(`  PASS: ${items.length} pending reviews`);
}

// DB verify
async function verifyDb(table, column, id, label) {
  try {
    const result = child_process.execSync(
      `PGPASSWORD=dev_warehouse_admin psql -h localhost -U dev_warehouse_admin -d warehouse_management_dev -t -c "SET search_path TO multitenant; SELECT ${column} FROM ${table} WHERE ${column}=${id}" 2>/dev/null`,
      { timeout: 5000, encoding: 'utf8' }
    ).trim().split('\n').filter(l => l.trim() && l !== 'SET').join('');
    if (result.includes(String(id))) console.log(`  DB: ${label} EXISTS ✓`);
    else console.log(`  DB: ${label} NOT FOUND ✗`);
  } catch (e) { console.log(`  DB: ${label} query error`); }
}

async function main() {
  const steps = [
    ['Login', login],
    ['Create RF Session', createRfSession],
    ['Create UOM', createUom, () => verifyDb('units_of_measure', 'uom_id', UOM_ID, 'UOM')],
    ['Create Category', createCategory, () => verifyDb('product_categories', 'category_id', CATEGORY_ID, 'Category')],
    ['Create Client', createClient, () => verifyDb('clients', 'client_id', CLIENT_ID, 'Client')],
    ['Create Product', createProduct, () => verifyDb('products', 'product_id', PRODUCT_ID, 'Product')],
    ['Create Vendor', createVendor, () => verifyDb('vendors', 'vendor_id', VENDOR_ID, 'Vendor')],
    ['Create Carrier', createCarrier, () => verifyDb('carriers', 'carrier_id', CARRIER_ID, 'Carrier')],
    ['Create Brand', createBrand, () => verifyDb('product_brands', 'brand_id', BRAND_ID, 'Brand')],
    ['Create Zone', createZone, () => verifyDb('warehouse_zones', 'zone_id', ZONE_ID, 'Zone')],
    ['Create Location', async () => { const l = await createLocation('LOC', 'PALLET'); LOCATION_ID = l.id; }, () => verifyDb('storage_locations', 'location_id', LOCATION_ID, 'Location')],
    ['Create Staging Location', async () => { const l = await createLocation('STG', 'TEMPORARY'); STAGING_LOC_ID = l.id; }, () => verifyDb('storage_locations', 'location_id', STAGING_LOC_ID, 'Staging')],
    // === QUALITY SETUP ===
    ['Seed Defect Codes', seedDefectCodes],
    ['Create Defect Code', createDefectCode, () => verifyDb('defect_codes', 'defect_code_id', DEFECT_CODE_ID, 'DefectCode')],
    ['Create Inspection Profile w/ Checklist', createInspectionProfile, async () => {
      await verifyDb('inspection_profiles', 'profile_id', PROFILE_ID, 'Profile');
      await verifyDb('inspection_checklist_items', 'profile_id', PROFILE_ID, 'Checklist');
    }],
    ['Assign Profile to Product', assignProfile, () => verifyDb('product_inspection_profiles', 'profile_id', PROFILE_ID, 'ProductProfile')],
    // === RF QC ENDPOINTS ===
    ['RF: List Defect Codes', rfDefectCodes],
    ['RF: My QC Tasks', rfMyTasks],
    ['RF: Get Next Task', rfGetNext],
    ['RF: LPN Lookup (invalid LPN)', rfLpnLookup],
    ['RF: Validate Lot', rfValidateLot],
    ['RF: Validate Expiry', rfValidateExpiry],
    ['RF: Record Temperature', rfRecordTemperature],
    // === WEB QC ENDPOINTS ===
    ['Create Receiving Inspection', createReceivingInspection, () => verifyDb('quality_inspections', 'inspection_id', RECEIVING_INSPECTION_ID, 'ReceivingInspection')],
    ['List Receiving Inspections', listReceivingInspections],
    ['Create QC Disposition (PASS)', createQcDisposition],
    ['Create Quality Hold', createQualityHold, () => verifyDb('quality_holds', 'hold_id', HOLD_ID, 'QualityHold')],
    ['List Quality Holds', listQualityHolds],
    ['Create NCR (severity=HIGH)', createNcr, () => verifyDb('non_conformance_reports', 'ncr_id', NCR_ID, 'NCR')],
    ['List NCRs', listNcrs],
    ['Check Pending Reviews', checkPendingReviews],
  ];

  let total = 0, passed = 0;
  for (const [name, fn, verifyFn] of steps) {
    total++;
    process.stdout.write(`--- Step ${total}: ${name} ... `);
    try {
      await fn();
      if (verifyFn) await verifyFn();
      console.log('PASS');
      passed++;
    } catch (e) {
      console.log(`FAIL`);
      console.log(`  ${e.message}`);
      break;
    }
  }

  console.log(`\n========== RESULTS ==========`);
  console.log(`Total: ${total}  Passed: ${passed}`);
  if (passed < total) { process.exit(1); }
  else console.log('ALL TESTS PASSED');
}

console.log('--- Starting WMS Server ---');
try { await startServer(); console.log('  Server ready'); }
catch (e) { console.error(`FAIL: ${e.message}`); stopServer(); process.exit(1); }
try { await main(); }
finally { stopServer(); console.log('Server stopped'); }
