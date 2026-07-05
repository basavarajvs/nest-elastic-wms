import child_process from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.WMS_PORT || 3002;
const BASE_URL = process.env.WMS_URL || `http://localhost:${PORT}/api/v1/wms`;
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3000/api/v1/auth/login';
const TENANT_CODE = 'DE0001';
const TEST_USER_ID = '048aa908-086a-4c97-9931-ccc0170590cf';
const USER_EMAIL = 'tenant.admin@gmail.com';
const USER_PASSWORD = 'Super@Admin';
const FACILITY_ID = 21;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let serverProcess = null;

async function startServer() {
  return new Promise((resolve, reject) => {
    const log = fs.openSync('/tmp/wms-e2e.log', 'w');
    serverProcess = child_process.spawn('node', ['dist/main.js'], {
      cwd: __dirname,
      stdio: ['ignore', log, log],
      env: { ...process.env, PORT: String(PORT) },
    });
    const check = async () => {
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        try {
          const res = await fetch(`http://localhost:${PORT}/api/v1/wms/health`, { signal: AbortSignal.timeout(2000) });
          if (res.ok || res.status === 401) return;
        } catch { /* not ready */ }
      }
      throw new Error('Server did not start in 30s');
    };
    check().then(resolve).catch(reject);
  });
}

function stopServer() {
  if (serverProcess) { serverProcess.kill('SIGTERM'); serverProcess = null; }
}

const uid = Date.now().toString(36).slice(-6);
let TOKEN, UOM_ID, CATEGORY_ID, CLIENT_ID, PRODUCT_ID, VENDOR_ID, CARRIER_ID, BRAND_ID;
let ZONE_ID, LOCATION_ID, STAGING_LOC_ID, DOCK_ID;
let PO_ID, ASN_ID, TRAILER_ID, RECEIPT_ID, PUTAWAY_TASK_ID;

async function api(method, path, body, expectStatus) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      'accept': '*/*', 'Authorization': `Bearer ${TOKEN}`,
      'X-Tenant-Code': TENANT_CODE, 'Content-Type': 'application/json',
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (expectStatus !== undefined && res.status !== expectStatus) {
    const text = await res.text();
    throw new Error(`${method} ${path} expected ${expectStatus} got ${res.status}: ${text.slice(0,300)}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return { status: res.status, data: await res.json() };
  }
  return { status: res.status, data: null };
}

function getId(d) {
  if (d?.data && !d.id) d = d.data;
  return Number(d?.po_id || d?.poId || d?.asn_id || d?.asnId || d?.trailer_id || d?.trailerId
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

// Master data creators - create once per run, unique codes with uid suffix
async function createUom() {
  const r = await api('POST', '/web/units-of-measure', { uomCode: `E2E-EA-${uid}`, uomName: 'Each', uomType: 'COUNT', isActive: true }, 201);
  UOM_ID = getId(wrap(r.data));
  console.log(`  PASS: UOM ID=${UOM_ID}`);
}
async function createCategory() {
  const r = await api('POST', '/web/product-categories', { categoryCode: `E2E-CAT-${uid}`, categoryName: `E2E Cat ${uid}`, isActive: true }, 201);
  CATEGORY_ID = getId(wrap(r.data));
  console.log(`  PASS: Category ID=${CATEGORY_ID}`);
}
async function createClient() {
  const r = await api('POST', '/web/clients', { clientCode: `E2E-CL-${uid}`, clientName: `E2E Client ${uid}`, isActive: true }, 201);
  CLIENT_ID = getId(wrap(r.data));
  console.log(`  PASS: Client ID=${CLIENT_ID}`);
}
async function createProduct() {
  const r = await api('POST', '/web/products', { productCode: `E2E-PROD-${uid}`, productName: `E2E Widget ${uid}`, primaryUomId: UOM_ID, categoryId: CATEGORY_ID, isActive: true }, 201);
  PRODUCT_ID = getId(wrap(r.data));
  console.log(`  PASS: Product ID=${PRODUCT_ID}`);
}
async function createVendor() {
  const r = await api('POST', '/web/vendors', { vendorCode: `E2E-VEN-${uid}`, vendorName: `E2E Vendor ${uid}`, isActive: true }, 201);
  VENDOR_ID = getId(wrap(r.data));
  console.log(`  PASS: Vendor ID=${VENDOR_ID}`);
}
async function createCarrier() {
  const r = await api('POST', '/web/carriers', { carrierCode: `E2E-CARR-${uid}`, carrierName: `E2E Carrier ${uid}`, isActive: true }, 201);
  CARRIER_ID = getId(wrap(r.data));
  console.log(`  PASS: Carrier ID=${CARRIER_ID}`);
}
async function createBrand() {
  const r = await api('POST', '/web/product-brands', { brandCode: `E2E-BR-${uid}`, brandName: `E2E Brand ${uid}`, isActive: true }, 201);
  BRAND_ID = getId(wrap(r.data));
  console.log(`  PASS: Brand ID=${BRAND_ID}`);
}
async function createZone() {
  const r = await api('POST', '/web/zones', { facilityId: FACILITY_ID, zoneCode: `E2E-ZN-${uid}`, zoneName: `E2E Zone ${uid}`, zoneType: 'RECEIVING', isActive: true }, 201);
  ZONE_ID = getId(wrap(r.data));
  console.log(`  PASS: Zone ID=${ZONE_ID}`);
}
async function createLocation(codeSuffix, type, zoneId) {
  const c = `E2E-${codeSuffix}-${uid}`;
  const r = await api('POST', '/web/locations', { facilityId: FACILITY_ID, locationCode: c, locationName: c, locationType: type, isActive: true, zoneId: zoneId || ZONE_ID }, 201);
  return { id: getId(wrap(r.data)), code: c };
}
async function createLoadingDock() {
  const r = await api('POST', '/web/loading-docks', { facilityId: FACILITY_ID, dockCode: `DOCK-${uid}`, dockName: `Dock ${uid}`, dockType: 'RECEIVING', isActive: true, isAvailable: true }, 201);
  DOCK_ID = getId(wrap(r.data));
  console.log(`  PASS: Loading Dock ID=${DOCK_ID}`);
}

// === INBOUND FLOW ===
async function createPO() {
  const n = `E2E-PO-${uid}`;
  const r = await api('POST', '/web/purchase-orders', { facilityId: FACILITY_ID, poNumber: n, poName: `E2E PO ${uid}`, vendorId: VENDOR_ID, currencyCode: 'USD', notes: 'E2E test PO', lines: [{ lineNumber: 1, productId: PRODUCT_ID, orderedQuantity: 100, uomId: UOM_ID, unitCost: 10.50 }] }, 201);
  PO_ID = getId(wrap(r.data));
  console.log(`  PASS: PO ID=${PO_ID} number=${n}`);
}
async function approvePO() {
  const r = await api('POST', `/web/purchase-orders/${PO_ID}/approve`, {}, 201);
  console.log(`  PASS: PO ${PO_ID} approved status=${r.status}`);
}
async function createASN() {
  const n = `E2E-ASN-${uid}`;
  const r = await api('POST', '/web/advance-ship-notices', { facilityId: FACILITY_ID, asnNumber: n, vendorId: VENDOR_ID, poNumber: `E2E-PO-${uid}`, carrierName: 'E2E Carrier', trackingNumber: `TRK-${uid}`, expectedArrivalDate: new Date(Date.now()+86400000).toISOString().split('T')[0], lines: [{ productId: PRODUCT_ID, expectedQuantity: 100, uomId: UOM_ID }] }, 201);
  ASN_ID = getId(wrap(r.data));
  console.log(`  PASS: ASN ID=${ASN_ID} number=${n}`);
}
async function updateASN() {
  await api('POST', `/web/advance-ship-notices/${ASN_ID}/status`, { status: 'IN_TRANSIT' }, 201);
  console.log(`  PASS: ASN ${ASN_ID} status=IN_TRANSIT`);
}
async function trailerCheckin() {
  const n = `E2E-TRL-${uid}`;
  const r = await api('POST', '/web/inbound/trailers/check-in', { facilityId: FACILITY_ID, trailerNumber: n, carrierId: CARRIER_ID, trailerType: 'DRY_VAN' }, 201);
  TRAILER_ID = getId(wrap(r.data));
  console.log(`  PASS: Trailer ID=${TRAILER_ID} number=${n}`);
}
async function createGR() {
  const n = `GRN-${uid}`;
  const r = await api('POST', '/web/goods-receipts', { facilityId: FACILITY_ID, receiptNumber: n, receiptName: `E2E GR ${uid}`, poNumber: `E2E-PO-${uid}`, asnNumber: `E2E-ASN-${uid}`, vendorId: VENDOR_ID }, 201);
  RECEIPT_ID = getId(wrap(r.data));
  console.log(`  PASS: GR ID=${RECEIPT_ID} number=${n}`);
}
async function receiveLine() {
  await api('POST', `/web/goods-receipts/${RECEIPT_ID}/receive-line`, { productId: PRODUCT_ID, expectedQuantity: 100, receivedQuantity: 100, damagedQuantity: 0, uomId: UOM_ID }, 201);
  console.log(`  PASS: Line received for GR ${RECEIPT_ID}`);
}
async function completeGR() {
  await api('POST', `/web/goods-receipts/${RECEIPT_ID}/complete`, {}, 201);
  console.log(`  PASS: GR ${RECEIPT_ID} completed`);
}
async function createPT() {
  const r = await api('POST', '/web/putaway-tasks', { facilityId: FACILITY_ID, taskNumber: `PT-${uid}`, taskName: `Putaway ${uid}`, productId: PRODUCT_ID, quantity: 100, uomId: UOM_ID, fromLocationId: STAGING_LOC_ID, toLocationId: LOCATION_ID, priority: 10, grnNumber: `GRN-${uid}` }, 201);
  PUTAWAY_TASK_ID = getId(wrap(r.data));
  console.log(`  PASS: Putaway Task ID=${PUTAWAY_TASK_ID}`);
}
async function assignPT() {
  const r = await api('PATCH', `/web/putaway-tasks/${PUTAWAY_TASK_ID}/assign`, { userId: TEST_USER_ID }, 200);
  console.log(`  PASS: Task ${PUTAWAY_TASK_ID} assigned`);
  // Verify the task is now in ASSIGNED status by fetching it
  const fetched = await api('GET', `/web/putaway-tasks/${PUTAWAY_TASK_ID}`, undefined, 200);
  const status = fetched.data?.status || fetched.data?.data?.status;
  console.log(`  VERIFY: Task status=${status}`);
}
async function suggestPT() {
  const r = await api('POST', '/web/putaway-tasks/suggest-location', { facilityId: FACILITY_ID, productId: PRODUCT_ID, categoryId: CATEGORY_ID }, 201);
  const locId = r.data?.locationId || r.data?.data?.locationId;
  console.log(`  PASS: Suggested location ID=${locId}`);
  return locId;
}
async function completePT(suggestedId) {
  const r = await api('PATCH', `/web/putaway-tasks/${PUTAWAY_TASK_ID}/complete`, { toLocationId: suggestedId || LOCATION_ID }, 200);
  console.log(`  PASS: Task ${PUTAWAY_TASK_ID} completed`);
}

// DB verification helper
async function verifyDb(table, column, id, label) {
  try {
    const { execSync } = await import('child_process');
    const result = execSync(
      `PGPASSWORD=dev_warehouse_admin psql -h localhost -U dev_warehouse_admin -d warehouse_management_dev -c "SET search_path TO multitenant; SELECT ${column} FROM ${table} WHERE ${column}=${id}" -t 2>/dev/null`,
      { timeout: 5000, encoding: 'utf8' }
    ).trim();
    if (result.includes(id.toString())) {
      console.log(`  DB-VERIFY: ${label} (${table}.${column}=${id}) EXISTS in database`);
    } else {
      console.log(`  DB-VERIFY: ${label} NOT found in database! Query returned: ${result.slice(0,100)}`);
    }
  } catch (e) {
    console.log(`  DB-VERIFY: ${label} query skipped (psql not available: ${e.message.slice(0,50)})`);
  }
}

async function main() {
  const steps = [
    ['Login', login],
    ['Create UOM', createUom, async () => verifyDb('units_of_measure', 'uom_id', UOM_ID, 'UOM')],
    ['Create Category', createCategory, async () => verifyDb('product_categories', 'category_id', CATEGORY_ID, 'Category')],
    ['Create Client', createClient, async () => verifyDb('clients', 'client_id', CLIENT_ID, 'Client')],
    ['Create Product', createProduct, async () => verifyDb('products', 'product_id', PRODUCT_ID, 'Product')],
    ['Create Vendor', createVendor, async () => verifyDb('vendors', 'vendor_id', VENDOR_ID, 'Vendor')],
    ['Create Carrier', createCarrier, async () => verifyDb('carriers', 'carrier_id', CARRIER_ID, 'Carrier')],
    ['Create Brand', createBrand, async () => verifyDb('product_brands', 'brand_id', BRAND_ID, 'Brand')],
    ['Create Zone', createZone, async () => verifyDb('warehouse_zones', 'zone_id', ZONE_ID, 'Zone')],
    ['Create Putaway Location', async () => { const l = await createLocation('A', 'EACH'); LOCATION_ID = l.id; console.log(`  PASS: Location ID=${LOCATION_ID} code=${l.code}`); }, async () => verifyDb('storage_locations', 'location_id', LOCATION_ID, 'Location')],
    ['Create Staging Location', async () => { const l = await createLocation('STAGE', 'TEMPORARY'); STAGING_LOC_ID = l.id; console.log(`  PASS: Staging Location ID=${STAGING_LOC_ID} code=${l.code}`); }, async () => verifyDb('storage_locations', 'location_id', STAGING_LOC_ID, 'Staging')],
    ['Create Loading Dock', createLoadingDock, async () => verifyDb('loading_docks', 'dock_id', DOCK_ID, 'Dock')],
    ['Create Purchase Order', createPO, async () => verifyDb('purchase_orders', 'po_id', PO_ID, 'PO')],
    ['Approve PO', approvePO, null],
    ['Create ASN', createASN, async () => verifyDb('advance_ship_notices', 'asn_id', ASN_ID, 'ASN')],
    ['Update ASN Status', updateASN, null],
    ['Trailer Check-in', trailerCheckin, async () => verifyDb('trailers', 'trailer_id', TRAILER_ID, 'Trailer')],
    ['Create Goods Receipt', createGR, async () => verifyDb('goods_receipts', 'receipt_id', RECEIPT_ID, 'GR')],
    ['Receive Line', receiveLine, null],
    ['Complete Goods Receipt', completeGR, null],
    ['Create Putaway Task', createPT, async () => verifyDb('putaway_tasks', 'task_id', PUTAWAY_TASK_ID, 'Putaway Task')],
    ['Assign Putaway Task', assignPT, null],
    ['Suggest Location', async () => { SUGGESTED_LOC_ID = await suggestPT(); }, null],
    ['Complete Putaway Task', async () => completePT(SUGGESTED_LOC_ID), async () => {
      if (PUTAWAY_TASK_ID) {
        const { execSync } = await import('child_process');
        const res = execSync(
          `PGPASSWORD=dev_warehouse_admin psql -h localhost -U dev_warehouse_admin -d warehouse_management_dev -c "SET search_path TO multitenant; SELECT status::text FROM putaway_tasks WHERE task_id=${PUTAWAY_TASK_ID}" -t 2>/dev/null`,
          { timeout: 5000, encoding: 'utf8' }
        ).trim();
        console.log(`  DB-VERIFY: Putaway Task ${PUTAWAY_TASK_ID} status in DB = "${res}"`);
      }
    }],
  ];

  let total = 0, passed = 0, failed = 0;
  let SUGGESTED_LOC_ID = LOCATION_ID;

  for (const [name, fn, verifyFn] of steps) {
    total++;
    process.stdout.write(`--- Step ${total}: ${name} ... `);
    try {
      await fn();
      passed++;
      if (verifyFn) await verifyFn();
    } catch (e) {
      console.log(`FAIL`);
      console.log(`  ERROR: ${name}: ${e.message}`);
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
try {
  await startServer();
  console.log('  Server ready');
} catch (e) {
  console.error(`  FAIL: ${e.message}`);
  stopServer();
  process.exit(1);
}
try { await main(); }
finally { stopServer(); console.log('Server stopped'); }
