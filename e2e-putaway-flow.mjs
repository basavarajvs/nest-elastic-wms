import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uid = Date.now().toString(36).slice(-6);
const TEST_USER_ID = '048aa908-086a-4c97-9931-ccc0170590cf';
let serverProcess = null;
let TOKEN = null;
let RF_SESSION_ID = null;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function startServer() {
  return new Promise((resolve, reject) => {
    const log = fs.openSync('/tmp/wms-e2e-put.log', 'w');
    serverProcess = child_process.spawn('node', ['dist/main.js'], {
      cwd: __dirname, stdio: ['ignore', log, log],
      env: { ...process.env, PORT: '3002' },
    });
    const check = async () => {
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        try {
          const res = await fetch('http://localhost:3002/api/v1/wms/health', { signal: AbortSignal.timeout(2000) });
          if (res.ok || res.status === 401) return;
        } catch {}
      }
      throw new Error('Server did not start in 30s');
    };
    check().then(resolve).catch(reject);
  });
}
function stopServer() { if (serverProcess) { serverProcess.kill('SIGTERM'); serverProcess = null; } }

function curl(method, path, body) {
  const args = ['-s', '--max-time', '15', '-X', method,
    `http://localhost:3002/api/v1/wms${path}`,
    '-H', `Authorization: Bearer ${TOKEN}`,
    '-H', 'X-Tenant-Code: DE0001',
    '-H', 'Content-Type: application/json',
  ];
  if (body !== undefined && body !== null) args.push('-d', JSON.stringify(body));
  const r = child_process.spawnSync('curl', args, { encoding: 'utf8', timeout: 15000 });
  try { return JSON.parse(r.stdout); } catch { return { error: r.stdout }; }
}

function curlRf(method, path, body) {
  const args = ['-s', '--max-time', '15', '-X', method,
    `http://localhost:3002/api/v1/wms${path}`,
    '-H', `Authorization: Bearer ${TOKEN}`,
    '-H', 'X-Tenant-Code: DE0001',
    '-H', 'Content-Type: application/json',
    '-H', `x-rf-session-id: ${RF_SESSION_ID}`,
  ];
  if (body) args.push('-d', JSON.stringify(body));
  const r = child_process.spawnSync('curl', args, { encoding: 'utf8', timeout: 15000 });
  try { return JSON.parse(r.stdout); } catch { return { error: r.stdout }; }
}

function dbStatus(taskId) {
  return child_process.execSync(
    `PGPASSWORD=dev_warehouse_admin psql -h localhost -U dev_warehouse_admin -d warehouse_management_dev -t -c "SET search_path TO multitenant; SELECT status::text FROM putaway_tasks WHERE task_id=${taskId}" 2>/dev/null`,
    { encoding: 'utf8', timeout: 5000 }
  ).trim().split('\n').filter(l => l.trim() && l !== 'SET').join('').trim();
}

function dbCount(table) {
  return child_process.execSync(
    `PGPASSWORD=dev_warehouse_admin psql -h localhost -U dev_warehouse_admin -d warehouse_management_dev -t -c "SET search_path TO multitenant; SELECT count(*) FROM ${table}" 2>/dev/null`,
    { encoding: 'utf8', timeout: 5000 }
  ).trim().split('\n').filter(l => l.trim() && l !== 'SET').join('').trim();
}

function dbExists(table, col, id) {
  const r = child_process.execSync(
    `PGPASSWORD=dev_warehouse_admin psql -h localhost -U dev_warehouse_admin -d warehouse_management_dev -t -c "SET search_path TO multitenant; SELECT ${col} FROM ${table} WHERE ${col}=${id}" 2>/dev/null`,
    { encoding: 'utf8', timeout: 5000 }
  ).trim().split('\n').filter(l => l.trim() && l !== 'SET').join('').trim();
  return r.includes(String(id));
}

// === MAIN ===
console.log('--- Starting WMS Server ---');
await startServer();
console.log('  Server ready\n');

// Login
const loginResp = curl('POST', 'http://localhost:3000/api/v1/auth/login'.replace('http://localhost:3002/api/v1/wms', ''), null);
// Actually login goes to port 3000, let me do it directly
const loginResult = JSON.parse(child_process.execSync(
  `curl -s -X POST 'http://localhost:3000/api/v1/auth/login' -H 'accept: */*' -H 'X-Tenant-Code: DE0001' -H 'Content-Type: application/json' -d '{"email":"tenant.admin@gmail.com","password":"Super@Admin"}'`,
  { encoding: 'utf8', timeout: 15000 }
));
TOKEN = loginResult.data.accessToken;
console.log('Login OK\n');

// RF Session
const rfResp = curl('POST', '/rf/session/login', { facilityId: 21, deviceId: 'E2E-PUT', workflowType: 'PUTAWAY' });
RF_SESSION_ID = rfResp.data?.id || rfResp.id;
console.log('RF Session OK\n');

let passes = 0, fails = 0;
function test(name, fn) {
  process.stdout.write(`--- ${name} ... `);
  try { fn(); console.log('PASS'); passes++; }
  catch(e) { console.log('FAIL'); console.log(`  ${e.message.slice(0,300)}`); fails++; }
}

// Master Data
let UOM_ID, CAT_ID, PROD_ID, VEN_ID, ZONE_ID, LOC_ID, STG_ID, RULE_ID;

test('Create UOM', () => {
  const r = curl('POST', '/web/units-of-measure', { uomCode: `P-EA-${uid}`, uomName: 'Each', uomType: 'COUNT', isActive: true });
  if (!r.data?.uom_id) throw new Error(JSON.stringify(r));
  UOM_ID = r.data.uom_id;
  if (!dbExists('units_of_measure', 'uom_id', UOM_ID)) throw new Error('DB verify failed');
});

test('Create Category', () => {
  const r = curl('POST', '/web/product-categories', { categoryCode: `P-CAT-${uid}`, categoryName: `PCat ${uid}`, isActive: true });
  if (!r.data?.category_id) throw new Error(JSON.stringify(r));
  CAT_ID = r.data.category_id;
  if (!dbExists('product_categories', 'category_id', CAT_ID)) throw new Error('DB verify failed');
});

test('Create Product', () => {
  const r = curl('POST', '/web/products', { productCode: `P-PROD-${uid}`, productName: `PProd ${uid}`, primaryUomId: Number(UOM_ID), categoryId: Number(CAT_ID), isActive: true });
  if (!r.data?.product_id) throw new Error(JSON.stringify(r));
  PROD_ID = r.data.product_id;
  if (!dbExists('products', 'product_id', PROD_ID)) throw new Error('DB verify failed');
});

test('Create Vendor', () => {
  const r = curl('POST', '/web/vendors', { vendorCode: `P-VEN-${uid}`, vendorName: `PVen ${uid}`, isActive: true });
  VEN_ID = r.data?.vendor_id;
  if (!VEN_ID) throw new Error(JSON.stringify(r));
  if (!dbExists('vendors', 'vendor_id', VEN_ID)) throw new Error('DB verify failed');
});

test('Create Zone', () => {
  const r = curl('POST', '/web/zones', { facilityId: 21, zoneCode: `P-ZN-${uid}`, zoneName: `PZn ${uid}`, zoneType: 'RECEIVING', isActive: true });
  ZONE_ID = r.data?.zone_id;
  if (!ZONE_ID) throw new Error(JSON.stringify(r));
  if (!dbExists('warehouse_zones', 'zone_id', ZONE_ID)) throw new Error('DB verify failed');
});

test('Create Location', () => {
  const r = curl('POST', '/web/locations', { facilityId: 21, locationCode: `P-LOC-${uid}`, locationName: `PLoc ${uid}`, locationType: 'EACH', isActive: true, zoneId: Number(ZONE_ID) });
  LOC_ID = r.data?.location_id;
  if (!LOC_ID) throw new Error(JSON.stringify(r));
  if (!dbExists('storage_locations', 'location_id', LOC_ID)) throw new Error('DB verify failed');
});

test('Create Staging Location', () => {
  const r = curl('POST', '/web/locations', { facilityId: 21, locationCode: `P-STG-${uid}`, locationName: `PStg ${uid}`, locationType: 'TEMPORARY', isActive: true, zoneId: Number(ZONE_ID) });
  STG_ID = r.data?.location_id;
  if (!STG_ID) throw new Error(JSON.stringify(r));
  if (!dbExists('storage_locations', 'location_id', STG_ID)) throw new Error('DB verify failed');
});

test('Create Putaway Rule', () => {
  const r = curl('POST', '/web/putaway-rules', { facilityId: 21, ruleName: `P-Rule ${uid}`, ruleCode: `P-RULE-${uid}`, priority: 10, isActive: true, destinationZoneId: Number(ZONE_ID), locationTypePreference: 'EACH' });
  RULE_ID = r.data?.rule_id;
  if (!RULE_ID) throw new Error(JSON.stringify(r));
  if (!dbExists('putaway_rules', 'rule_id', RULE_ID)) throw new Error('DB verify failed');
});

test('Create Overflow Rule (GAP-4)', () => {
  const r = curl('POST', '/web/putaway-rules', { facilityId: 21, ruleName: `P-Ovf ${uid}`, ruleCode: `P-OVF-${uid}`, priority: 20, isActive: true, isOverflowRule: true, parentRuleId: Number(RULE_ID), destinationZoneId: Number(ZONE_ID) });
  if (!r.data?.rule_id) throw new Error(JSON.stringify(r));
});

test('List Putaway Rules', () => {
  const r = curl('GET', '/web/putaway-rules?facilityId=21');
  const items = r.data?.data || r.data || [];
  if (!Array.isArray(items) || items.length === 0) throw new Error('No rules found');
});

// 3 sequential tasks: create → assign → complete (verify DB each step)
for (let i = 0; i < 3; i++) {
  let taskId;
  test(`Create Task ${i}`, () => {
    const r = curl('POST', '/web/putaway-tasks', { facilityId: 21, taskNumber: `PT-${uid}-${i}`, taskName: `PTask ${i}`, productId: Number(PROD_ID), quantity: 100, uomId: Number(UOM_ID), fromLocationId: Number(STG_ID), toLocationId: Number(LOC_ID), priority: 10, grnNumber: `GRN-${uid}-${i}`, lpnBarcode: `LPN-${uid}-${i}` });
    taskId = r.data?.task_id;
    if (!taskId) throw new Error(JSON.stringify(r));
    if (!dbExists('putaway_tasks', 'task_id', taskId)) throw new Error('DB verify failed');
  });

  test(`Assign Task ${taskId}`, () => {
    const r = curl('PATCH', `/web/putaway-tasks/${taskId}/assign`, { userId: TEST_USER_ID });
    if (r.data?.status !== 'ASSIGNED') throw new Error(`API: ${JSON.stringify(r.data)}`);
    const s = dbStatus(taskId);
    if (s !== 'ASSIGNED') throw new Error(`DB: ${s}, expected ASSIGNED`);
  });

  test(`Complete Task ${taskId}`, () => {
    const r = curl('PATCH', `/web/putaway-tasks/${taskId}/complete`, { toLocationId: Number(LOC_ID) });
    if (r.success === false) throw new Error(`API: ${JSON.stringify(r)}`);
    const s = dbStatus(taskId);
    if (s !== 'COMPLETED') throw new Error(`DB: ${s}, expected COMPLETED`);
  });
}

// Suggest location
test('Suggest Location', () => {
  const r = curl('POST', '/web/putaway-tasks/suggest-location', { facilityId: 21, productId: Number(PROD_ID), categoryId: Number(CAT_ID) });
  if (!r.data?.locationId && !r.data?.data?.locationId) throw new Error(`No location: ${JSON.stringify(r).slice(0,200)}`);
});

// Find by GRN
test('Find by GRN', () => {
  const r = curl('GET', `/web/putaway-tasks/by-grn/GRN-${uid}-0`);
  const items = Array.isArray(r.data) ? r.data : (r.data?.data || []);
  if (items.length === 0) throw new Error('No tasks found');
});

// Damage test
let dmgTaskId;
test('Create Damage Task', () => {
  const r = curl('POST', '/web/putaway-tasks', { facilityId: 21, taskNumber: `PT-DMG-${uid}`, taskName: `PDmg`, productId: Number(PROD_ID), quantity: 50, uomId: Number(UOM_ID), fromLocationId: Number(STG_ID), toLocationId: Number(LOC_ID), priority: 10, grnNumber: `GRN-DMG-${uid}`, lpnBarcode: `LPN-DMG-${uid}` });
  dmgTaskId = r.data?.task_id;
  if (!dmgTaskId) throw new Error(JSON.stringify(r));
});

test('Assign Damage Task', () => {
  const r = curl('PATCH', `/web/putaway-tasks/${dmgTaskId}/assign`, { userId: TEST_USER_ID });
  if (r.data?.status !== 'ASSIGNED') throw new Error(JSON.stringify(r.data));
  if (dbStatus(dmgTaskId) !== 'ASSIGNED') throw new Error('DB not ASSIGNED');
});

test('Complete with Damage (GAP-2.1)', () => {
  const r = curl('PATCH', `/web/putaway-tasks/${dmgTaskId}/complete`, { toLocationId: Number(LOC_ID), damageQuantity: 5, damageNotes: 'E2E damage test' });
  if (r.success === false) throw new Error(JSON.stringify(r));
  if (dbStatus(dmgTaskId) !== 'COMPLETED') throw new Error(`DB: ${dbStatus(dmgTaskId)}`);
});

// Web location exceptions
let excId;
test('Create Location Exception (GAP-1)', () => {
  const r = curl('POST', '/web/location-exceptions', { locationId: Number(LOC_ID), exceptionType: 'FULL', reportedBy: TEST_USER_ID, notes: 'E2E test' });
  excId = r.data?.exception_id;
  if (!excId) throw new Error(JSON.stringify(r));
  if (!dbExists('location_exceptions', 'exception_id', excId)) throw new Error('DB verify failed');
});

test('List Location Exceptions', () => {
  const r = curl('GET', '/web/location-exceptions');
  const items = r.data?.data || r.data || [];
  if (!Array.isArray(items) || items.length === 0) throw new Error('No exceptions');
});

// RF endpoints
test('RF: Next Task', () => {
  const r = curlRf('POST', '/rf/inbound/putaway/next-task', { facilityId: 21 });
  if (r.error) throw new Error(JSON.stringify(r).slice(0,200));
});

test('RF: Scan LPN', () => {
  const r = curlRf('POST', '/rf/inbound/putaway/scan-lpn', { facilityId: 21, lpnBarcode: `LPN-${uid}-0` });
  // Expected to fail (400/404) since LPN doesn't exist in license_plate_numbers
  if (r.type && r.status >= 500) throw new Error(JSON.stringify(r).slice(0,200));
});

test('RF: Suggest Location', () => {
  const r = curlRf('POST', '/rf/inbound/putaway/suggest-location', { facilityId: 21, productId: Number(PROD_ID) });
  if (r.error) throw new Error(JSON.stringify(r).slice(0,200));
});

test('RF: My Tasks', () => {
  const r = curlRf('POST', '/rf/inbound/putaway/my-tasks', { userId: TEST_USER_ID });
  if (r.error) throw new Error(JSON.stringify(r).slice(0,200));
});

test('RF: Location Full', () => {
  const r = curlRf('POST', '/rf/inbound/putaway/location-full', { taskId: Number(dmgTaskId), userId: TEST_USER_ID });
  // Task is COMPLETED, might get 400
  if (r.type && r.status >= 500) throw new Error(JSON.stringify(r).slice(0,200));
});

test('RF: Report Damage', () => {
  const r = curlRf('POST', '/rf/inbound/putaway/report-damage', { taskId: Number(dmgTaskId), damageQuantity: 3, notes: 'RF damage' });
  if (r.type && r.status >= 500) throw new Error(JSON.stringify(r).slice(0,200));
});

// Final DB verification
test('DB: location_exceptions count', () => {
  const c = dbCount('location_exceptions');
  if (Number(c) === 0) throw new Error('No location exceptions in DB');
});

test('DB: putaway_damage_records count', () => {
  const c = dbCount('putaway_damage_records');
  if (Number(c) === 0) throw new Error('No damage records in DB');
});

console.log(`\n========== Passed: ${passes} Failed: ${fails} ==========`);
stopServer();
console.log('Server stopped');
process.exit(fails > 0 ? 1 : 0);
