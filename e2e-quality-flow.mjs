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

let serverProcess = null, TOKEN = null;
let UOM_ID, CATEGORY_ID, PRODUCT_ID, VENDOR_ID, ZONE_ID, LOCATION_ID, STAGING_LOC_ID;
let PROFILE_ID, DEFECT_CODE_ID, HOLD_ID, NCR_ID;

async function startServer() {
  return new Promise((resolve, reject) => {
    const log = fs.openSync('/tmp/wms-qc2.log', 'w');
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

async function api(method, path, body, expectStatus) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'accept': '*/*', 'Authorization': `Bearer ${TOKEN}`,
      'X-Tenant-Code': TENANT_CODE, 'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : null;
  return { status: res.status, data };
}

function getId(d) {
  if (d?.data && !d.id) d = d.data;
  return Number(d?.hold_id || d?.holdId || d?.ncr_id || d?.ncrId
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

async function login() {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'accept': '*/*', 'X-Tenant-Code': TENANT_CODE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
  });
  if (res.status !== 200) throw new Error(`Login failed: ${await res.text()}`);
  TOKEN = (await res.json()).data.accessToken;
  console.log(`  PASS: Token (${TOKEN.length} chars)`);
}

async function createUom() {
  const r = await api('POST', '/web/units-of-measure', { uomCode: `QC-EA-${uid}`, uomName: 'Each', uomType: 'COUNT', isActive: true }, 201);
  UOM_ID = getId(wrap(r.data));
}
async function createCategory() {
  const r = await api('POST', '/web/product-categories', { categoryCode: `QC-CAT-${uid}`, categoryName: `QC Cat ${uid}`, isActive: true }, 201);
  CATEGORY_ID = getId(wrap(r.data));
}
async function createProduct() {
  const r = await api('POST', '/web/products', { productCode: `QC-PROD-${uid}`, productName: `QC Widget ${uid}`, primaryUomId: UOM_ID, categoryId: CATEGORY_ID, isActive: true }, 201);
  PRODUCT_ID = getId(wrap(r.data));
}
async function createVendor() {
  const r = await api('POST', '/web/vendors', { vendorCode: `QC-VEN-${uid}`, vendorName: `QC Vendor ${uid}`, isActive: true }, 201);
  VENDOR_ID = getId(wrap(r.data));
}
async function createZone() {
  const r = await api('POST', '/web/zones', { facilityId: FACILITY_ID, zoneCode: `QC-ZN-${uid}`, zoneName: `QC Zone ${uid}`, zoneType: 'RECEIVING', isActive: true }, 201);
  ZONE_ID = getId(wrap(r.data));
}
async function createLocation() {
  const c = `QC-LOC-${uid}`;
  const r = await api('POST', '/web/locations', { facilityId: FACILITY_ID, locationCode: c, locationName: c, locationType: 'PALLET', isActive: true, zoneId: ZONE_ID }, 201);
  LOCATION_ID = getId(wrap(r.data));
}
async function createStagingLocation() {
  const c = `QC-STG-${uid}`;
  const r = await api('POST', '/web/locations', { facilityId: FACILITY_ID, locationCode: c, locationName: c, locationType: 'TEMPORARY', isActive: true, zoneId: ZONE_ID }, 201);
  STAGING_LOC_ID = getId(wrap(r.data));
}

// === QUALITY INSPECTION SETUP ===

async function seedDefectCodes() {
  const r = await api('POST', '/web/defect-codes/seed', {}, 201);
  console.log(`  PASS: Defect codes seeded (10 defaults)`);
}
async function createDefectCode() {
  const r = await api('POST', '/web/defect-codes', {
    code: `QC-TEST-DMG-${uid}`, description: 'E2E test damage', category: 'PRODUCT_DAMAGE', severity: 'HIGH', isActive: true,
  }, 201);
  DEFECT_CODE_ID = getId(wrap(r.data));
  console.log(`  PASS: Defect Code ID=${DEFECT_CODE_ID}`);
}

async function createInspectionProfile() {
  const r = await api('POST', '/web/inspection-profiles', {
    profileName: `QC Profile ${uid}`,
    description: 'E2E test inspection profile',
    isActive: true,
    checklistItems: [
      { checkType: 'PACKAGING', checkLabel: 'Check packaging integrity', isMandatory: true, sortOrder: 1, acceptableCriteria: 'No visible damage' },
      { checkType: 'LABEL', checkLabel: 'Verify label matches PO', isMandatory: true, sortOrder: 2, acceptableCriteria: 'Label matches PO number' },
      { checkType: 'QUANTITY', checkLabel: 'Count received quantity', isMandatory: true, sortOrder: 3, acceptableCriteria: 'Matches ASN quantity' },
      { checkType: 'EXPIRY', checkLabel: 'Check expiry date', isMandatory: false, sortOrder: 4, acceptableCriteria: '> 90 days remaining' },
    ],
  }, 201);
  PROFILE_ID = getId(wrap(r.data));
  console.log(`  PASS: Inspection Profile ID=${PROFILE_ID}`);
}

async function assignProfileToProduct() {
  const r = await api('POST', '/web/inspection-profiles/assign-product', {
    profileId: PROFILE_ID, productId: PRODUCT_ID, vendorId: VENDOR_ID,
    minExpiryDays: 90, samplingPercentage: 10, samplingMethod: 'STATISTICAL',
  }, 201);
  console.log(`  PASS: Profile ${PROFILE_ID} -> Product ${PRODUCT_ID}`);
}

async function createQualityHold() {
  const r = await api('POST', '/web/quality-holds', {
    facilityId: FACILITY_ID, holdNumber: `HOLD-${uid}`, holdName: `QC Hold ${uid}`,
    description: 'E2E test quality hold', referenceType: 'INSPECTION',
    referenceId: 1, productId: PRODUCT_ID,
    holdReason: 'Quality check pending', holdReasonCode: 'QC_PENDING',
    placedByUserId: TEST_USER_ID, affectedQuantity: 100, uomId: UOM_ID,
    notes: 'E2E test hold', createdBy: TEST_USER_ID,
  }, 201);
  HOLD_ID = getId(wrap(r.data));
}

async function createNcr() {
  const r = await api('POST', '/web/non-conformance-reports', {
    facilityId: FACILITY_ID, ncrNumber: `NCR-${uid}`, ncrName: `QC NCR ${uid}`,
    description: 'E2E test non-conformance', referenceType: 'INSPECTION',
    referenceId: 1, productId: PRODUCT_ID, severity: 'HIGH',
    assignedToUserId: TEST_USER_ID, notes: 'E2E test NCR', correctiveActionRequired: true,
    createdBy: TEST_USER_ID,
  }, 201);
  NCR_ID = getId(wrap(r.data));
}

async function findQualityHolds() {
  const r = await api('GET', `/web/quality-holds?facilityId=${FACILITY_ID}`, undefined, 200);
  const items = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.data) ? r.data.data : []);
  console.log(`  PASS: ${items.length} quality holds found`);
}

async function findNcrs() {
  const r = await api('GET', `/web/non-conformance-reports?facilityId=${FACILITY_ID}`, undefined, 200);
  const items = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.data) ? r.data.data : []);
  console.log(`  PASS: ${items.length} NCRs found`);
}

async function checkPendingReviews() {
  const r = await api('GET', `/web/quality/inspections/pending-review?facilityId=${FACILITY_ID}`, undefined, 200);
  const items = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.data) ? r.data.data : []);
  console.log(`  PASS: ${items.length} pending reviews`);
}

// DB verification
async function verifyDb(table, column, id, label) {
  try {
    const result = child_process.execSync(
      `PGPASSWORD=dev_warehouse_admin psql -h localhost -U dev_warehouse_admin -d warehouse_management_dev -c "SET search_path TO multitenant; SELECT ${column} FROM ${table} WHERE ${column}=${id}" -t 2>/dev/null`,
      { timeout: 5000, encoding: 'utf8' }
    ).trim();
    const clean = result.split('\n').filter(l => l.trim() && l !== 'SET').join('');
    if (clean.includes(String(id))) {
      console.log(`  DB: ${label} (${table}.${column}=${id}) EXISTS ✓`);
    } else {
      console.log(`  DB: ${label} NOT FOUND ✗`);
    }
  } catch (e) {
    console.log(`  DB: ${label} query error: ${e.message.slice(0,60)}`);
  }
}

async function main() {
  const steps = [
    ['Login', login],
    ['Create UOM', createUom, async () => verifyDb('units_of_measure', 'uom_id', UOM_ID, 'UOM')],
    ['Create Category', createCategory, async () => verifyDb('product_categories', 'category_id', CATEGORY_ID, 'Category')],
    ['Create Product', createProduct, async () => verifyDb('products', 'product_id', PRODUCT_ID, 'Product')],
    ['Create Vendor', createVendor, async () => verifyDb('vendors', 'vendor_id', VENDOR_ID, 'Vendor')],
    ['Create Zone', createZone, async () => verifyDb('warehouse_zones', 'zone_id', ZONE_ID, 'Zone')],
    ['Create Location', createLocation, async () => verifyDb('storage_locations', 'location_id', LOCATION_ID, 'Location')],
    ['Create Staging Location', createStagingLocation, async () => verifyDb('storage_locations', 'location_id', STAGING_LOC_ID, 'Staging')],
    // === QUALITY SETUP (all web endpoints, all verifiable) ===
    ['Seed Default Defect Codes', seedDefectCodes],
    ['Create Custom Defect Code', createDefectCode, async () => verifyDb('defect_codes', 'defect_code_id', DEFECT_CODE_ID, 'DefectCode')],
    ['Create Inspection Profile with Checklist', createInspectionProfile, async () => {
      await verifyDb('inspection_profiles', 'profile_id', PROFILE_ID, 'Profile');
      await verifyDb('inspection_checklist_items', 'profile_id', PROFILE_ID, 'ChecklistItems');
    }],
    ['Assign Inspection Profile to Product', assignProfileToProduct, async () => verifyDb('product_inspection_profiles', 'profile_id', PROFILE_ID, 'ProductProfile')],
    ['Create Quality Hold (QC_PENDING)', createQualityHold, async () => verifyDb('quality_holds', 'hold_id', HOLD_ID, 'QualityHold')],
    ['List Quality Holds', findQualityHolds],
    ['Create NCR (severity=HIGH)', createNcr, async () => verifyDb('non_conformance_reports', 'ncr_id', NCR_ID, 'NCR')],
    ['List NCRs', findNcrs],
    ['Check Pending Supervisor Reviews', checkPendingReviews],
  ];

  let total = 0, passed = 0, failed = 0;

  for (const [name, fn, verifyFn] of steps) {
    total++;
    process.stdout.write(`--- Step ${total}: ${name} ... `);
    try {
      await fn();
      passed++;
      if (verifyFn) await verifyFn();
    } catch (e) {
      console.log(`FAIL (${e.message.slice(0,120)})`);
      failed++;
      break;
    }
  }

  console.log(`\n========== RESULTS ==========`);
  console.log(`Total: ${total}  Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) { console.log('SOME TESTS FAILED'); process.exit(1); }
  else console.log('ALL TESTS PASSED');
}

console.log('--- Starting WMS Server ---');
try { await startServer(); console.log('  Server ready'); }
catch (e) { console.error(`  FAIL: ${e.message}`); stopServer(); process.exit(1); }
try { await main(); }
finally { stopServer(); console.log('Server stopped'); }
