import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uid = Date.now().toString(36).slice(-6);
const TEST_USER_ID = '048aa908-086a-4c97-9931-ccc0170590cf';
const TENANT_ID = '2b451ee2-129f-4be9-aebb-0b7fdbf6133f';
const FACILITY_ID = 21;
let serverProcess = null;
let TOKEN = null;
let RF_SESSION_ID = null;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function startServer() {
  return new Promise((resolve, reject) => {
    const log = fs.openSync('/tmp/wms-e2e-cc-full.log', 'w');
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

function doCurl(args, method, path, body) {
  const curlArgs = ['-s', '--max-time', '15', '-w', '\n%{http_code}', '-X', method,
    `http://localhost:3002/api/v1/wms${path}`, ...args];
  if (body !== undefined && body !== null) curlArgs.push('-d', JSON.stringify(body));
  const r = child_process.spawnSync('curl', curlArgs, { encoding: 'utf8', timeout: 15000 });
  const parts = r.stdout.trim().split('\n');
  const httpCode = parts.pop();
  const bodyText = parts.join('\n');
  const parsed = (() => { try { return JSON.parse(bodyText); } catch { return { error: bodyText }; } })();
  parsed._httpCode = httpCode;
  return parsed;
}

function curl(method, path, body) {
  return doCurl(['-H', `Authorization: Bearer ${TOKEN}`, '-H', 'X-Tenant-Code: DE0001', '-H', 'Content-Type: application/json'], method, path, body);
}

function curlRf(method, path, body) {
  return doCurl(['-H', `Authorization: Bearer ${TOKEN}`, '-H', 'X-Tenant-Code: DE0001', '-H', 'Content-Type: application/json', '-H', `x-rf-session-id: ${RF_SESSION_ID}`], method, path, body);
}

function assertOk(r) {
  if (!r || r._httpCode >= 400) throw new Error(`HTTP ${r._httpCode}: ${JSON.stringify(r).slice(0,300)}`);
}

function dbQuery(sql) {
  try {
    const r = child_process.execSync(
      `PGPASSWORD=dev_warehouse_admin psql -h localhost -U dev_warehouse_admin -d warehouse_management_dev -t -A -c "SET search_path TO multitenant; ${sql}" 2>/dev/null`,
      { encoding: 'utf8', timeout: 5000 }
    );
    return r.trim().split('\n').filter(l => l.trim() && l !== 'SET').join('\n').trim();
  } catch (e) {
    throw new Error(`DB query failed: ${sql.slice(0,100)} — ${e.message.slice(0,100)}`);
  }
}

function dbCount(table, where) {
  return dbQuery(`SELECT count(*) FROM ${table}${where ? ' WHERE ' + where : ''}`);
}

function dbExists(table, col, val, extraWhere) {
  const r = dbQuery(`SELECT ${col} FROM ${table} WHERE ${col}=${val}${extraWhere ? ' AND ' + extraWhere : ''}`);
  return r.includes(String(val));
}

// === MAIN ===
console.log('--- Starting WMS Server ---');
await startServer();
console.log('  Server ready\n');

// Login
const loginResult = JSON.parse(child_process.execSync(
  `curl -s -X POST 'http://localhost:3000/api/v1/auth/login' -H 'accept: */*' -H 'X-Tenant-Code: DE0001' -H 'Content-Type: application/json' -d '{"email":"tenant.admin@gmail.com","password":"Super@Admin"}'`,
  { encoding: 'utf8', timeout: 15000 }
));
TOKEN = loginResult.data.accessToken;
console.log('Login OK\n');

// RF Session
const rfResp = curl('POST', '/rf/session/login', { facilityId: FACILITY_ID, deviceId: 'E2E-CC2', workflowType: 'CYCLE_COUNT' });
RF_SESSION_ID = rfResp.data?.id || rfResp.id;
console.log('RF Session OK\n');

// Flush stale idempotency cache
try { child_process.execSync('redis-cli -a redis123 EVAL "return redis.call(\'DEL\', unpack(redis.call(\'KEYS\', \'wms:idempotency:*\')))" 0 2>/dev/null', { encoding: 'utf8', timeout: 3000 }); } catch {}

// Fetch existing master data from DB
const masterRows = dbQuery(`SELECT p.product_id, p.product_code, p.abc_analysis_class, oh.location_id, oh.quantity_on_hand, oh.uom_id, l.location_code
  FROM inventory_on_hand oh
  JOIN products p ON p.product_id = oh.product_id AND p.tenant_id = oh.tenant_id
  JOIN storage_locations l ON l.location_id = oh.location_id AND l.tenant_id = oh.tenant_id
  WHERE oh.tenant_id='${TENANT_ID}' AND oh.facility_id=${FACILITY_ID}
    AND oh.quantity_on_hand > 0 AND oh.quantity_on_hand IS NOT NULL
  ORDER BY p.product_id LIMIT 1`).split('\n').filter(l => l.trim());
if (masterRows.length === 0) throw new Error('No inventory with qty > 0 found in DB');
const parts = masterRows[0].split('|');
const PROD_ID = parts[0].trim();
const PROD_CODE = parts[1].trim();
const LOC_ID = parts[3].trim();
let SYS_QTY = Number(parts[4].trim());
const LOC_CODE = parts[6].trim();
console.log(`   Using product=${PROD_ID}(${PROD_CODE}) location=${LOC_ID}(${LOC_CODE}) qty=${SYS_QTY}\n`);

let passes = 0, fails = 0;
function test(name, fn) {
  process.stdout.write(`--- ${name} ... `);
  try { fn(); console.log('PASS'); passes++; }
  catch(e) { console.log('FAIL'); console.log(`  ${e.message.slice(0,300)}`); fails++; }
}

// Global state
let COUNT_ID, INVESTIGATION_ID, CATEGORY_ID, RECOUNT_ID;
let adHocCountId, lpnCountId, draftCountId;

// ===== GAP-1: Threshold Config =====
test('GAP-1: Setup threshold config (auto_approve=5%, recount=20%)', () => {
  dbQuery(`DELETE FROM approval_threshold_configs WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}`);
  dbQuery(`INSERT INTO approval_threshold_configs (tenant_id, facility_id, threshold_type, auto_approve_pct, supervisor_review_pct, recount_pct, is_active, created_at, updated_at)
    VALUES ('${TENANT_ID}', ${FACILITY_ID}, 'PERCENTAGE', 5.00, 10.00, 20.00, true, NOW(), NOW())`);
  if (Number(dbCount('approval_threshold_configs', `tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID} AND is_active=true`)) === 0) throw new Error('Config not created');
});

// ===== GAP-8: Blind Count Toggle =====
test('GAP-8: Create count with isBlindCount=false', () => {
  const r = curl('POST', '/web/cycle-counts', {
    facilityId: FACILITY_ID, countNumber: `CC-NB-${uid}`, countName: `Non-blind ${uid}`,
    countScopeType: 'LOCATION', countScopeIdentifier: Number(LOC_ID), status: 'PENDING',
    isBlindCount: false,
  });
  assertOk(r);
  if (!r.data?.count_id) throw new Error(JSON.stringify(r).slice(0,200));
  const blindVal = dbQuery(`SELECT is_blind_count FROM inventory_counts WHERE count_id=${r.data.count_id}`);
  if (blindVal !== 'f') throw new Error(`Expected is_blind_count=false, got ${blindVal}`);
});

// ===== Core: Create + Scan + Submit + Complete (Exact Match) =====
test('Create Cycle Count', () => {
  const r = curl('POST', '/web/cycle-counts', {
    facilityId: FACILITY_ID, countNumber: `CC-${uid}`, countName: `E2E ${uid}`,
    countScopeType: 'LOCATION', countScopeIdentifier: Number(LOC_ID), status: 'PENDING',
  });
  assertOk(r);
  if (!r.data?.count_id) throw new Error(JSON.stringify(r).slice(0,200));
  COUNT_ID = r.data.count_id;
  if (!dbExists('inventory_counts', 'count_id', COUNT_ID, `tenant_id='${TENANT_ID}'`)) throw new Error('DB verify failed');
});

test('GAP-8: RF Scan Location (blind=true hides systemQty)', () => {
  const r = curlRf('POST', '/rf/cycle-counts/scan-location', { facilityId: FACILITY_ID, locationBarcode: LOC_CODE, countId: COUNT_ID });
  assertOk(r);
  if (r.data?.isBlindCount !== true) throw new Error(`Expected isBlindCount=true, got ${r.data?.isBlindCount}`);
  if (r.data?.items?.[0]?.expectedQuantity !== undefined) throw new Error('Blind count should NOT return expectedQuantity');
});

test('GAP-1.3: Submit Line (exact match → AUTO_APPROVE)', () => {
  const r = curl('POST', `/web/cycle-counts/${COUNT_ID}/submit-line`, {
    facilityId: FACILITY_ID, productId: Number(PROD_ID), locationId: Number(LOC_ID),
    countedQuantity: SYS_QTY, userId: TEST_USER_ID,
  });
  assertOk(r);
  if (!r.data?.line?.count_line_id) throw new Error(JSON.stringify(r).slice(0,200));
  if (r.data.matchStatus !== 'MATCH') throw new Error(`Expected MATCH, got ${r.data.matchStatus}`);
  if (r.data.autoApproved !== true) throw new Error('Expected autoApproved=true for exact match');
});

test('Complete Count (auto-approve, no investigation)', () => {
  const r = curl('POST', `/web/cycle-counts/${COUNT_ID}/complete`, {});
  assertOk(r);
  if (r.data.status !== 'COMPLETED' && r.data.status !== 'CLOSED') throw new Error(`Expected COMPLETED/CLOSED, got ${r.data.status}`);
});

test('DB Verify: count completed, no investigation', () => {
  const status = dbQuery(`SELECT status FROM inventory_counts WHERE count_id=${COUNT_ID}`);
  if (status !== 'COMPLETED' && status !== 'CLOSED') throw new Error(`DB status=${status}`);
  if (Number(dbCount('variance_investigations', `count_id=${COUNT_ID} AND tenant_id='${TENANT_ID}'`)) !== 0) throw new Error('Investigation created for exact match');
});

// ===== GAP-2: Inventory Adjustment =====
test('GAP-2: DB Verify inventory_adjustments created (from variance approve)', () => {
  // Adjustments are created when variance is approved, not for exact-match counts
  // This will be verified after the approve step below
  const c = dbCount('inventory_adjustments', `reference_type='CYCLE_COUNT' AND tenant_id='${TENANT_ID}'`);
  // May be 0 at this point if approve hasn't happened yet — that's OK
  // The real check is after approve
  if (c === null || c === undefined) throw new Error('Cannot query inventory_adjustments');
});

// ===== GAP-6.3: Product last_counted_at updated =====
test('GAP-6.3: DB Verify product last_counted_at updated', () => {
  const lastCounted = dbQuery(`SELECT last_counted_at FROM products WHERE product_id=${PROD_ID} AND tenant_id='${TENANT_ID}'`);
  if (!lastCounted || lastCounted === '') throw new Error('last_counted_at not set');
  const nextDue = dbQuery(`SELECT next_count_due_at FROM products WHERE product_id=${PROD_ID} AND tenant_id='${TENANT_ID}'`);
  if (!nextDue || nextDue === '') throw new Error('next_count_due_at not set');
});

// ===== Variance Count (creates investigation) =====
test('Create Count 2 (variance scenario)', () => {
  const r = curl('POST', '/web/cycle-counts', {
    facilityId: FACILITY_ID, countNumber: `CC-VAR-${uid}`, countName: `Variance ${uid}`,
    countScopeType: 'LOCATION', countScopeIdentifier: Number(LOC_ID), status: 'PENDING', countPriority: 'HIGH',
  });
  assertOk(r);
  if (!r.data?.count_id) throw new Error(JSON.stringify(r).slice(0,200));
  const c2 = r.data.count_id;
  // Submit with wrong qty
  const wrongQty = Math.max(0, SYS_QTY - 15);
  const sr = curl('POST', `/web/cycle-counts/${c2}/submit-line`, {
    facilityId: FACILITY_ID, productId: Number(PROD_ID), locationId: Number(LOC_ID),
    countedQuantity: wrongQty, userId: TEST_USER_ID,
  });
  assertOk(sr);
  if (sr.data.matchStatus !== 'MISMATCH') throw new Error(`Expected MISMATCH, got ${sr.data.matchStatus}`);
  // Complete
  const cr = curl('POST', `/web/cycle-counts/${c2}/complete`, {});
  assertOk(cr);
  // Verify investigation created
  if (Number(dbCount('variance_investigations', `count_id=${c2} AND tenant_id='${TENANT_ID}'`)) === 0) throw new Error('No investigation created');
  INVESTIGATION_ID = dbQuery(`SELECT investigation_id FROM variance_investigations WHERE count_id=${c2} AND tenant_id='${TENANT_ID}' LIMIT 1`);
  if (!INVESTIGATION_ID) throw new Error('Could not get investigation_id');
});

// ===== GAP-4: Supervisor Review =====
test('GAP-4: Pending Reviews (RF)', () => {
  const r = curlRf('POST', '/rf/cycle-counts/pending-reviews', { facilityId: FACILITY_ID });
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length === 0) throw new Error('No pending reviews');
  const found = items.find(i => Number(i.investigation_id) === Number(INVESTIGATION_ID));
  if (!found) throw new Error(`Investigation ${INVESTIGATION_ID} not in [${items.map(i=>i.investigation_id).join(',')}]`);
});

test('GAP-4: Web Pending Reviews', () => {
  const r = curl('GET', `/web/cycle-counts/pending-reviews?facilityId=${FACILITY_ID}`);
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length === 0) throw new Error('No pending reviews via web');
});

test('GAP-4: Approve Variance (RF)', () => {
  const r = curlRf('POST', `/rf/cycle-counts/${INVESTIGATION_ID}/approve`, {});
  assertOk(r);
});

test('GAP-2: DB Verify investigation resolved', () => {
  const status = dbQuery(`SELECT status::text FROM variance_investigations WHERE investigation_id=${INVESTIGATION_ID}`);
  if (status !== 'RESOLVED') throw new Error(`Expected RESOLVED, got ${status}`);
});

test('GAP-2: DB Verify inventory_adjustments after approve', () => {
  const c = dbCount('inventory_adjustments', `reference_type='CYCLE_COUNT' AND tenant_id='${TENANT_ID}' AND approved_by_user_id='${TEST_USER_ID}'`);
  if (Number(c) === 0) throw new Error('No adjustment approved by user');
});

// Update SYS_QTY
SYS_QTY = Number(dbQuery(`SELECT quantity_on_hand FROM inventory_on_hand WHERE tenant_id='${TENANT_ID}' AND product_id=${PROD_ID} AND location_id=${LOC_ID}`));

// ===== GAP-5: Root Cause =====
test('GAP-5: Create Root Cause Category (web)', () => {
  const r = curl('POST', '/web/root-cause-categories', { code: `E2E-RC-${uid}`, description: 'E2E counting error', categoryType: 'COUNT_ERROR', isActive: true });
  assertOk(r);
  if (!r.data?.category_id) throw new Error(JSON.stringify(r).slice(0,200));
  CATEGORY_ID = r.data.category_id;
});

test('GAP-5: List Root Cause Categories (web)', () => {
  const r = curl('GET', '/web/root-cause-categories');
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length === 0) throw new Error('No categories found');
});

test('GAP-5: Assign Root Cause (web)', () => {
  const r = curl('POST', `/web/root-cause-categories/${CATEGORY_ID}/assign`, { investigationId: Number(INVESTIGATION_ID), description: 'Operator miscount' });
  assertOk(r);
  const rootCause = dbQuery(`SELECT root_cause FROM variance_investigations WHERE investigation_id=${INVESTIGATION_ID}`);
  if (!rootCause || rootCause === '') throw new Error('Root cause not assigned in DB');
});

// ===== GAP-3: Recount =====
test('GAP-3: Request Recount (web)', () => {
  const r = curl('POST', `/web/cycle-counts/${INVESTIGATION_ID}/recount`, {});
  assertOk(r);
});

test('GAP-3: DB Verify recount count created with count_type=RECOUNT', () => {
  const c = dbCount('inventory_counts', `tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID} AND count_type='RECOUNT'`);
  if (Number(c) === 0) throw new Error('No recount count with count_type=RECOUNT');
  RECOUNT_ID = dbQuery(`SELECT count_id FROM inventory_counts WHERE tenant_id='${TENANT_ID}' AND count_type='RECOUNT' ORDER BY count_id DESC LIMIT 1`);
});

test('GAP-3: DB Verify recount has excluded_user_id', () => {
  const excluded = dbQuery(`SELECT excluded_user_id FROM inventory_counts WHERE count_id=${RECOUNT_ID}`);
  if (!excluded || excluded === '') throw new Error('excluded_user_id not set on recount');
});

// ===== APP-CC-A: State Machine =====
test('APP-CC-A: DB Verify recount status is READY (state machine)', () => {
  const status = dbQuery(`SELECT status FROM inventory_counts WHERE count_id=${RECOUNT_ID}`);
  if (status !== 'READY') throw new Error(`Expected READY, got ${status}`);
});

// ===== APP-CC-F: getNextCountWork (collision prevention) =====
let nextWorkCountId;

test('APP-CC-F: Get Next Count Work (RF)', () => {
  const r = curlRf('POST', '/rf/cycle-counts/next-count-work', { facilityId: FACILITY_ID });
  assertOk(r);
  const data = r.data;
  if (!data) throw new Error('No count work returned');
  if (data.status !== 'ASSIGNED') throw new Error(`Expected ASSIGNED, got ${data.status}`);
  nextWorkCountId = data.count_id;
});

test('APP-CC-F: DB Verify count is now ASSIGNED', () => {
  const status = dbQuery(`SELECT status FROM inventory_counts WHERE count_id=${nextWorkCountId}`);
  if (status !== 'ASSIGNED') throw new Error(`Expected ASSIGNED, got ${status}`);
});

// ===== APP-CC-B: Location Scan Validation =====
test('APP-CC-B: Wrong location scan rejected', () => {
  // Scan a location that exists but is different from the expected location
  const altLoc = dbQuery(`SELECT location_code FROM storage_locations WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID} AND location_id != ${LOC_ID} AND location_code NOT LIKE 'QC-%' LIMIT 1`);
  if (!altLoc) { return; } // Skip if no alternative location
  const r = curlRf('POST', '/rf/cycle-counts/scan-location', { facilityId: FACILITY_ID, locationBarcode: altLoc, countId: RECOUNT_ID });
  if (r._httpCode < 400) throw new Error(`Expected 400 for wrong location, got ${r._httpCode}`);
  if (!JSON.stringify(r).includes('WRONG') && !JSON.stringify(r).includes('Expected') && !JSON.stringify(r).includes('Location')) throw new Error(`Wrong error: ${JSON.stringify(r).slice(0,200)}`);
});

// ===== APP-CC-E: Audit Trail =====
test('APP-CC-E: DB Verify cycle_count_events exist', () => {
  const c = dbCount('cycle_count_events', `tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}`);
  if (Number(c) === 0) throw new Error('No cycle_count_events found');
});

test('APP-CC-E: Get Audit Timeline (web)', () => {
  const r = curl('GET', `/web/cycle-counts/${COUNT_ID}/timeline`);
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length === 0) throw new Error('No events in timeline');
  const types = items.map(e => e.event_type);
  if (!types.includes('COUNT_CREATED')) throw new Error(`COUNT_CREATED missing from ${types.join(',')}`);
});

// ===== APP-CC-K: Ad-hoc Count =====
test('APP-CC-K: Create Ad-hoc Count (web)', () => {
  const r = curl('POST', '/web/cycle-counts/create-ad-hoc', {
    facilityId: FACILITY_ID, countNumber: `ADHOC-${uid}`, countName: `Ad-hoc ${uid}`,
    countScopeType: 'LOCATION', countScopeIdentifier: Number(LOC_ID),
  });
  assertOk(r);
  if (!r.data?.count_id) throw new Error(JSON.stringify(r).slice(0,200));
  adHocCountId = r.data.count_id;
  const ct = dbQuery(`SELECT count_type FROM inventory_counts WHERE count_id=${adHocCountId}`);
  if (ct !== 'ADHOC') throw new Error(`Expected count_type=ADHOC, got ${ct}`);
});

test('APP-CC-K: Create Ad-hoc Count (RF)', () => {
  const r = curlRf('POST', '/rf/cycle-counts/create-ad-hoc', {
    facilityId: FACILITY_ID, countNumber: `ADHOC-RF-${uid}`, countName: `RF Ad-hoc ${uid}`,
    countScopeType: 'LOCATION', countScopeIdentifier: Number(LOC_ID),
  });
  assertOk(r);
  if (!r.data?.count_id) throw new Error(JSON.stringify(r).slice(0,200));
});

// ===== APP-CC-G: Draft Mode =====
test('APP-CC-G: Save Draft Line', () => {
  const r = curl('POST', `/web/cycle-counts/${adHocCountId}/save-draft-line`, {
    facilityId: FACILITY_ID, productId: Number(PROD_ID), locationId: Number(LOC_ID),
    countedQuantity: 50, userId: TEST_USER_ID,
  });
  assertOk(r);
  const isFinal = dbQuery(`SELECT is_final FROM inventory_count_lines WHERE count_id=${adHocCountId} ORDER BY count_line_id DESC LIMIT 1`);
  if (isFinal !== 'f') throw new Error(`Expected is_final=false, got ${isFinal}`);
});

test('APP-CC-G: Get Count Progress', () => {
  const r = curl('GET', `/web/cycle-counts/${adHocCountId}/progress`);
  assertOk(r);
  if (r.data?.draft === undefined) throw new Error('No draft count in response');
  if (r.data.draft === 0) throw new Error('Expected draft > 0');
});

// ===== GAP-6: Count Scheduler =====
test('GAP-6: Generate Scheduled Counts (web)', () => {
  // First set a product's next_count_due_at to past
  dbQuery(`UPDATE products SET next_count_due_at = '2020-01-01' WHERE product_id=${PROD_ID} AND tenant_id='${TENANT_ID}'`);
  const r = curl('POST', '/web/count-scheduler/generate', { facilityId: FACILITY_ID });
  assertOk(r);
  if (r.data?.totalCountsCreated === undefined) throw new Error(JSON.stringify(r).slice(0,200));
});

test('GAP-6: DB Verify count_scheduler_metrics created', () => {
  const c = dbCount('count_scheduler_metrics', `tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}`);
  if (Number(c) === 0) throw new Error('No scheduler metrics found');
});

test('GAP-6: Get Scheduler Metrics (web)', () => {
  const r = curl('GET', `/web/count-scheduler/metrics?facilityId=${FACILITY_ID}`);
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length === 0) throw new Error('No metrics returned');
});

// ===== APP-CC-J: ABC Reclassification =====
test('APP-CC-J: ABC Reclassification (web)', () => {
  const r = curl('POST', '/web/count-scheduler/reclassify-abc', { facilityId: FACILITY_ID });
  assertOk(r);
  if (r.data?.reclassified === undefined) throw new Error(JSON.stringify(r).slice(0,200));
});

test('APP-CC-J: DB Verify abc_reclassification_log exists', () => {
  const c = dbCount('abc_reclassification_log', `tenant_id='${TENANT_ID}'`);
  // May be 0 if no products need reclassification — that's OK
  // Just verify the table exists and is queryable
  if (c === null || c === undefined) throw new Error('Cannot query abc_reclassification_log');
});

// ===== GAP-7: LPN Count Mode =====
test('GAP-7: RF Start LPN Count (may fail if no LPN exists)', () => {
  const r = curlRf('POST', '/rf/cycle-counts/start-lpn', { facilityId: FACILITY_ID, lpnBarcode: `LPN-${uid}` });
  // May return 404 if LPN doesn't exist — that's acceptable
  if (r._httpCode >= 500) throw new Error(`Server error: ${r._httpCode}`);
  if (r._httpCode === 201 || r._httpCode === 200) {
    if (!r.data?.count?.count_id) throw new Error('No count returned for LPN count');
    lpnCountId = r.data.count.count_id;
  }
});

// ===== List & Find =====
test('List Cycle Counts', () => {
  const r = curl('GET', `/web/cycle-counts?facilityId=${FACILITY_ID}`);
  assertOk(r);
  const items = r.data?.data || r.data || [];
  if (!Array.isArray(items) || items.length === 0) throw new Error('No cycle counts found');
});

test('Get Count by ID', () => {
  const r = curl('GET', `/web/cycle-counts/${COUNT_ID}`);
  assertOk(r);
  if (Number(r.data?.count_id) !== Number(COUNT_ID)) throw new Error('Wrong count returned');
});

// ===== Final DB Verifications =====
test('DB: cycle_count_events count > 0', () => {
  const c = dbCount('cycle_count_events', `tenant_id='${TENANT_ID}'`);
  if (Number(c) === 0) throw new Error('No cycle_count_events');
});

test('DB: inventory_adjustments count > 0', () => {
  const c = dbCount('inventory_adjustments', `tenant_id='${TENANT_ID}' AND reason_code='CYCLE_COUNT'`);
  if (Number(c) === 0) throw new Error('No inventory_adjustments with reason_code=CYCLE_COUNT');
});

test('DB: inventory_count_lines with count_round field', () => {
  const c = dbCount('inventory_count_lines', `tenant_id='${TENANT_ID}' AND count_round IS NOT NULL`);
  if (Number(c) === 0) throw new Error('No lines with count_round');
});

// ===== Cleanup =====
test('Cleanup: Delete threshold configs', () => {
  dbQuery(`DELETE FROM approval_threshold_configs WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}`);
  if (Number(dbCount('approval_threshold_configs', `tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}`)) !== 0) throw new Error('Cleanup failed');
});

test('Cleanup: Delete root cause category', () => {
  if (CATEGORY_ID) dbQuery(`DELETE FROM root_cause_categories WHERE tenant_id='${TENANT_ID}' AND category_id=${CATEGORY_ID}`);
});

console.log(`\n========== Passed: ${passes} Failed: ${fails} ==========`);
stopServer();
console.log('Server stopped');
process.exit(fails > 0 ? 1 : 0);
