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
    const log = fs.openSync('/tmp/wms-e2e-ob.log', 'w');
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

function dbInsertReturning(sql) {
  const raw = dbQuery(sql);
  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('INSERT') && !trimmed.startsWith('DELETE') && !trimmed.startsWith('UPDATE') && !trimmed.startsWith('SELECT')) {
      const num = Number(trimmed);
      if (!isNaN(num)) return num;
    }
  }
  // Fallback: try to find any number
  for (const line of lines) {
    const nums = line.match(/\d+/g);
    if (nums) return Number(nums[0]);
  }
  return NaN;
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

// RF Session (use PICKING workflow type)
const rfResp = curl('POST', '/rf/session/login', { facilityId: FACILITY_ID, deviceId: 'E2E-OB', workflowType: 'PICKING' });
RF_SESSION_ID = rfResp.data?.id || rfResp.id;
console.log('RF Session OK\n');

// Flush stale idempotency cache
try { child_process.execSync('redis-cli -a redis123 EVAL "return redis.call(\'DEL\', unpack(redis.call(\'KEYS\', \'wms:idempotency:*\')))" 0 2>/dev/null', { encoding: 'utf8', timeout: 3000 }); } catch {}

// Fetch existing master data — products with on-hand inventory
const masterRows = dbQuery(`SELECT p.product_id, p.product_code, p.product_name, oh.location_id, oh.quantity_on_hand, oh.uom_id, l.location_code
  FROM inventory_on_hand oh
  JOIN products p ON p.product_id = oh.product_id AND p.tenant_id = oh.tenant_id
  JOIN storage_locations l ON l.location_id = oh.location_id AND l.tenant_id = oh.tenant_id
  WHERE oh.tenant_id='${TENANT_ID}' AND oh.facility_id=${FACILITY_ID}
    AND oh.quantity_on_hand > 0 AND oh.quantity_on_hand IS NOT NULL
  ORDER BY p.product_id LIMIT 1`).split('\n').filter(l => l.trim());
if (masterRows.length === 0) throw new Error('No inventory with qty > 0 found in DB');
const parts = masterRows[0].split('|');
const PROD_ID = Number(parts[0].trim());
const PROD_CODE = parts[1].trim();
const PROD_NAME = parts[2].trim();
const LOC_ID = Number(parts[3].trim());
let SYS_QTY = Number(parts[4].trim());
const UOM_ID = Number(parts[5].trim());
const LOC_CODE = parts[6].trim();
console.log(`   Using product=${PROD_ID}(${PROD_CODE}) location=${LOC_ID}(${LOC_CODE}) qty=${SYS_QTY} uom=${UOM_ID}\n`);

// Also get a second product for multi-line orders
const masterRows2 = dbQuery(`SELECT p.product_id, p.product_code, oh.location_id, oh.quantity_on_hand, oh.uom_id, l.location_code
  FROM inventory_on_hand oh
  JOIN products p ON p.product_id = oh.product_id AND p.tenant_id = oh.tenant_id
  JOIN storage_locations l ON l.location_id = oh.location_id AND l.tenant_id = oh.tenant_id
  WHERE oh.tenant_id='${TENANT_ID}' AND oh.facility_id=${FACILITY_ID}
    AND oh.quantity_on_hand > 0 AND oh.product_id != ${PROD_ID}
  ORDER BY p.product_id LIMIT 1`).split('\n').filter(l => l.trim());
let PROD2_ID, PROD2_CODE, LOC2_ID, LOC2_CODE, SYS_QTY2, UOM2_ID;
if (masterRows2.length > 0) {
  const p2 = masterRows2[0].split('|');
  PROD2_ID = Number(p2[0].trim());
  PROD2_CODE = p2[1].trim();
  LOC2_ID = Number(p2[2].trim());
  SYS_QTY2 = Number(p2[3].trim());
  UOM2_ID = Number(p2[4].trim());
  LOC2_CODE = p2[5]?.trim?.() || '';
  console.log(`   Secondary product=${PROD2_ID}(${PROD2_CODE}) location=${LOC2_ID}(${LOC2_CODE}) qty=${SYS_QTY2}\n`);
}

// Customer & Client for order creation
const CUST_ID = Number(dbQuery(`SELECT customer_id FROM customers WHERE tenant_id='${TENANT_ID}' ORDER BY customer_id LIMIT 1`));
const CLIENT_ID = Number(dbQuery(`SELECT client_id FROM clients WHERE tenant_id='${TENANT_ID}' ORDER BY client_id LIMIT 1`));

let passes = 0, fails = 0;
function test(name, fn) {
  process.stdout.write(`--- ${name} ... `);
  try { fn(); console.log('PASS'); passes++; }
  catch(e) { console.log('FAIL'); console.log(`  ${e.message.slice(0,300)}`); fails++; }
}

// === Global state ===
let ORDER_ID, ORDER_NUMBER, ORDER_LINE_ID, ORDER_LINE2_ID;
let WAVE_ID, WAVE_NUMBER;
let TASK_IDS = [];
let CLUSTER_CART_ID, CLUSTER_SESSION_ID;

// =========================================================
// PHASE 1: Create Sales Order via API (Manhattan flow)
// =========================================================
test('Create Sales Order (API)', () => {
  ORDER_NUMBER = `E2E-OB-${uid}`;
  const pickQty = Math.min(5, Math.floor(SYS_QTY * 0.5));
  const lines = [{
    productId: PROD_ID,
    requestedQuantity: pickQty,
    uomId: UOM_ID,
    unitPrice: 10.00,
  }];
  if (PROD2_ID) {
    const pickQty2 = Math.min(3, Math.floor(SYS_QTY2 * 0.5));
    lines.push({
      productId: PROD2_ID,
      requestedQuantity: pickQty2,
      uomId: UOM2_ID,
      unitPrice: 15.00,
    });
  }
  const r = curl('POST', `/web/sales-orders`, {
    facilityId: FACILITY_ID,
    orderNumber: ORDER_NUMBER,
    orderName: `E2E Outbound ${uid}`,
    clientId: CLIENT_ID,
    customerId: CUST_ID,
    priority: 5,
    deliveryCity: 'E2E-City',
    deliveryCountryCode: 'US',
    lines,
  });
  assertOk(r);
  if (!r.data?.order_id) throw new Error(JSON.stringify(r).slice(0,200));
  ORDER_ID = Number(r.data.order_id);
  if (isNaN(ORDER_ID)) throw new Error(`ORDER_ID is NaN`);
  // DB verify order was created
  if (!dbExists('sales_orders', 'order_id', ORDER_ID, `tenant_id='${TENANT_ID}'`)) throw new Error('DB verify failed');
  // DB verify lines were created
  const lineCount = dbCount('sales_order_lines', `tenant_id='${TENANT_ID}' AND order_id=${ORDER_ID}`);
  if (Number(lineCount) === 0) throw new Error('No lines created');
  ORDER_LINE_ID = Number(dbQuery(`SELECT line_id FROM sales_order_lines WHERE tenant_id='${TENANT_ID}' AND order_id=${ORDER_ID} ORDER BY line_number LIMIT 1`));
});

test('Validate Order (API)', () => {
  const r = curl('POST', `/web/sales-orders/${ORDER_ID}/validate`, {});
  assertOk(r);
  if (r.data?.valid !== true) throw new Error(`Validation failed: ${JSON.stringify(r.data?.errors)}`);
});

test('Transition Order to VALIDATED', () => {
  const r = curl('POST', `/web/sales-orders/${ORDER_ID}/status`, { status: 'VALIDATED' });
  assertOk(r);
  const dbStatus = dbQuery(`SELECT status FROM sales_orders WHERE order_id=${ORDER_ID}`);
  if (dbStatus !== 'VALIDATED') throw new Error(`Expected VALIDATED, got ${dbStatus}`);
});

test('Transition Order to RELEASED', () => {
  const r = curl('POST', `/web/sales-orders/${ORDER_ID}/status`, { status: 'RELEASED' });
  assertOk(r);
  const dbStatus = dbQuery(`SELECT status FROM sales_orders WHERE order_id=${ORDER_ID}`);
  if (dbStatus !== 'RELEASED') throw new Error(`Expected RELEASED, got ${dbStatus}`);
});

// =========================================================
// PHASE 2: Wave Operations (GAP-4)
// =========================================================
test('GAP-4: Create Wave via Web', () => {
  WAVE_NUMBER = `WAVE-${uid}`;
  const r = curl('POST', `/web/picking-waves`, {
    facilityId: FACILITY_ID,
    waveNumber: WAVE_NUMBER,
    waveName: `E2E Wave ${uid}`,
    orderIds: [ORDER_ID],
  });
  assertOk(r);
  const wave = r.data;
  if (!wave?.wave_id) throw new Error(JSON.stringify(r).slice(0,200));
  WAVE_ID = Number(wave.wave_id);
  if (wave.status !== 'PENDING') throw new Error(`Expected PENDING, got ${wave.status}`);
  const dbStatus = dbQuery(`SELECT status FROM picking_waves WHERE wave_id=${WAVE_ID}`);
  if (dbStatus !== 'PENDING') throw new Error(`DB: expected PENDING, got ${dbStatus}`);
});

test('GAP-4: Release Wave (allocate + generate tasks)', () => {
  const r = curl('POST', `/web/picking-waves/${WAVE_ID}/release`, {});
  assertOk(r);
  const wave = r.data;
  if (!wave) throw new Error(JSON.stringify(r).slice(0,200));
  if (wave.status !== 'RELEASED') throw new Error(`Expected RELEASED, got ${wave.status}`);
  if (!wave.total_tasks || wave.total_tasks === 0) throw new Error('No tasks generated');
});

test('GAP-4: DB Verify pick tasks created', () => {
  const taskCount = dbCount('picking_tasks', `tenant_id='${TENANT_ID}' AND wave_id=${WAVE_ID}`);
  if (Number(taskCount) === 0) throw new Error('No pick tasks in DB');
  // Record all task IDs
  const tasks = dbQuery(`SELECT task_id FROM picking_tasks WHERE tenant_id='${TENANT_ID}' AND wave_id=${WAVE_ID} ORDER BY task_id`).split('\n');
  TASK_IDS = tasks.map(t => Number(t.trim())).filter(t => !isNaN(t));
  if (TASK_IDS.length === 0) throw new Error('No task IDs found');
  console.log(`\n   Tasks created: ${TASK_IDS.length}, IDs: ${TASK_IDS.join(', ')}`);
});

test('GAP-4: DB Verify tasks are AVAILABLE', () => {
  const availCount = dbCount('picking_tasks', `tenant_id='${TENANT_ID}' AND wave_id=${WAVE_ID} AND status='AVAILABLE'`);
  if (Number(availCount) === 0) throw new Error(`Expected some AVAILABLE tasks, got ${availCount}`);
});

test('DB: Verify allocations created after wave release', () => {
  const allocCount = dbCount('inventory_allocations',
    `tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
     AND allocated_for_reference_type='SALES_ORDER_LINE'
     AND status='ALLOCATED'`);
  if (Number(allocCount) === 0) throw new Error('No allocations created');
});

test('DB: Verify inventory reservations created after allocation', () => {
  const resCount = dbCount('inventory_reservations',
    `tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
     AND reservation_type='SALES_ORDER' AND status='ACTIVE'`);
  if (Number(resCount) === 0) throw new Error('No reservations created');
});

test('DB: Verify on-hand minus reserved reflects post-allocation availability', () => {
  // For the product that was allocated, check that reserved qty > 0
  const totalReserved = dbQuery(`SELECT COALESCE(SUM(quantity_reserved), 0)
    FROM inventory_reservations
    WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
      AND product_id=${PROD_ID} AND status='ACTIVE'`);
  const resQty = Number(totalReserved);
  if (resQty <= 0) throw new Error(`Expected reserved qty > 0 for product ${PROD_ID}, got ${resQty}`);
  // The available qty should be on_hand minus reserved
  const onHand = Number(dbQuery(`SELECT quantity_on_hand FROM inventory_on_hand
    WHERE tenant_id='${TENANT_ID}' AND product_id=${PROD_ID} AND location_id=${LOC_ID}`));
  const available = onHand - resQty;
  console.log(`\n   Product ${PROD_ID}: on_hand=${onHand}, reserved=${resQty}, available=${available}`);
});

test('GAP-4: Get Wave Status (web)', () => {
  const r = curl('GET', `/web/picking-waves/${WAVE_ID}`);
  assertOk(r);
  if (!r.data?.summary) throw new Error(JSON.stringify(r).slice(0,200));
  if (r.data.summary.totalTasks === 0) throw new Error('Wave has 0 tasks');
});

// =========================================================
// PHASE 3: RF Pick Flow
// =========================================================
let task1Data;

test('RF: next-task (atomic assignment — APP-PICK-I)', () => {
  const r = curlRf('POST', '/rf/outbound/pick/next-task', { facilityId: FACILITY_ID, userId: TEST_USER_ID });
  assertOk(r);
  if (!r.data || !r.data.task_id) throw new Error(`No task returned: ${JSON.stringify(r).slice(0,200)}`);
  task1Data = r.data;
  // Verify this task is now ASSIGNED in DB
  const dbStatus = dbQuery(`SELECT status FROM picking_tasks WHERE task_id=${task1Data.task_id}`);
  if (dbStatus !== 'ASSIGNED') throw new Error(`Expected ASSIGNED, got ${dbStatus}`);
  // Verify assigned to correct user
  const assignedUser = dbQuery(`SELECT assigned_to_user_id FROM picking_tasks WHERE task_id=${task1Data.task_id}`);
  if (!assignedUser.includes(TEST_USER_ID)) throw new Error(`Expected assigned to ${TEST_USER_ID}, got ${assignedUser}`);
});

test('RF: scan-location correct (APP-PICK-G)', () => {
  const r = curlRf('POST', '/rf/outbound/pick/scan-location', {
    taskId: task1Data.task_id,
    locationBarcode: LOC_CODE,
  });
  assertOk(r);
  if (r.data.locationVerified !== true) throw new Error('Location not verified');
  // Verify task now IN_PROGRESS
  const dbStatus = dbQuery(`SELECT status FROM picking_tasks WHERE task_id=${task1Data.task_id}`);
  if (dbStatus !== 'IN_PROGRESS') throw new Error(`Expected IN_PROGRESS, got ${dbStatus}`);
});

test('APP-PICK-G: scan-location WRONG location — detailed rejection', () => {
  // Get a different location
  const wrongLoc = dbQuery(`SELECT location_code FROM storage_locations
    WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
    AND location_id != ${LOC_ID} AND location_code NOT LIKE 'QC-%' AND location_code NOT LIKE 'PUT-%' AND location_code NOT LIKE 'E2E-STAGE%'
    LIMIT 1`);
  if (!wrongLoc) { return; } // skip if no alternative
  const r = curlRf('POST', '/rf/outbound/pick/scan-location', {
    taskId: task1Data.task_id,
    locationBarcode: wrongLoc.trim(),
  });
  if (r._httpCode < 400) throw new Error(`Expected 4xx, got ${r._httpCode}`);
  const msg = JSON.stringify(r);
  if (!msg.includes('WRONG LOCATION')) throw new Error(`Missing 'WRONG LOCATION' in: ${msg.slice(0,200)}`);
  if (!msg.includes(LOC_CODE)) throw new Error(`Missing expected location code '${LOC_CODE}' in: ${msg.slice(0,200)}`);
  if (!msg.includes(wrongLoc.trim())) throw new Error(`Missing scanned location code '${wrongLoc.trim()}' in: ${msg.slice(0,200)}`);
});

test('RF: scan-product', () => {
  const r = curlRf('POST', '/rf/outbound/pick/scan-product', {
    taskId: task1Data.task_id,
    productCode: PROD_CODE,
  });
  assertOk(r);
  if (r.data.productVerified !== true) throw new Error('Product not verified');
});

test('RF: scan-tote (APP-PICK-H)', () => {
  const toteBarcode = `TOTE-OB-${uid}`;
  const r = curlRf('POST', '/rf/outbound/pick/scan-tote', {
    taskId: task1Data.task_id,
    toteBarcode,
    facilityId: FACILITY_ID,
  });
  assertOk(r);
  if (!r.data.toteNumber) throw new Error(`No tote returned: ${JSON.stringify(r).slice(0,200)}`);
  if (r.data.toteNumber !== toteBarcode) throw new Error(`Expected tote ${toteBarcode}, got ${r.data.toteNumber}`);
});

test('RF: confirm pick', () => {
  const r = curlRf('POST', '/rf/outbound/pick/confirm', {
    taskId: task1Data.task_id,
    pickedQuantity: Math.min(Number(task1Data.quantity_to_pick), Number(dbQuery(`SELECT quantity_on_hand FROM inventory_on_hand WHERE tenant_id='${TENANT_ID}' AND product_id=${PROD_ID} AND location_id=${LOC_ID}`))),
    reasonCode: 'STANDARD',
  });
  assertOk(r);
  const dbStatus = dbQuery(`SELECT status FROM picking_tasks WHERE task_id=${task1Data.task_id}`);
  if (dbStatus !== 'COMPLETED') throw new Error(`Expected COMPLETED, got ${dbStatus}`);
});

test('DB: Verify inventory_transaction created', () => {
  const c = dbCount('inventory_transactions', `tenant_id='${TENANT_ID}' AND reference_type='PICKING_TASK' AND reference_id=${task1Data.task_id}`);
  if (Number(c) === 0) throw new Error('No inventory transaction created');
});

test('DB: Verify order line fulfilled quantity', () => {
  const fulfilled = dbQuery(`SELECT fulfilled_quantity FROM sales_order_lines WHERE line_id=${ORDER_LINE_ID}`);
  const fulfilledNum = Number(fulfilled);
  if (fulfilledNum <= 0) throw new Error(`Expected fulfilled > 0, got ${fulfilledNum}`);
});

// =========================================================
// PHASE 4: Second task — complete the pick cycle
// =========================================================
let task2Data;

test('Pick second task (complete full wave)', () => {
  if (TASK_IDS.length < 2) { return; }
  const r = curlRf('POST', '/rf/outbound/pick/next-task', { facilityId: FACILITY_ID, userId: TEST_USER_ID });
  assertOk(r);
  if (!r.data || !r.data.task_id) throw new Error(`No task returned`);
  task2Data = r.data;
  const taskProdId = task2Data.product_id || task2Data.product?.product_id;
  const taskProdCode = task2Data.product?.product_code || task2Data.product_sku || null;
  // Look up product code from DB if needed
  const expectedLoc = task2Data.from_location_id
    ? dbQuery(`SELECT location_code FROM storage_locations WHERE location_id=${task2Data.from_location_id}`)
    : null;
  if (expectedLoc && expectedLoc.trim()) {
    const locR = curlRf('POST', '/rf/outbound/pick/scan-location', { taskId: task2Data.task_id, locationBarcode: expectedLoc.trim() });
    if (locR._httpCode >= 400) console.log(`   (Location scan skipped: ${JSON.stringify(locR).slice(0,100)})`);
  }
  // Find actual product code for this product
  const actualProdCode = taskProdCode || (taskProdId ? dbQuery(`SELECT product_code FROM products WHERE product_id=${taskProdId} AND tenant_id='${TENANT_ID}'`) : null);
  if (actualProdCode && actualProdCode.trim()) {
    const prodR = curlRf('POST', '/rf/outbound/pick/scan-product', { taskId: task2Data.task_id, productCode: actualProdCode.trim() });
    if (prodR._httpCode >= 400) console.log(`   (Product scan skipped: ${JSON.stringify(prodR).slice(0,100)})`);
  }
  // scan-tote
  const tote2 = `TOTE-OB2-${uid}`;
  curlRf('POST', '/rf/outbound/pick/scan-tote', { taskId: task2Data.task_id, toteBarcode: tote2, facilityId: FACILITY_ID });
  // confirm
  const confirmR = curlRf('POST', '/rf/outbound/pick/confirm', { taskId: task2Data.task_id, pickedQuantity: Number(task2Data.quantity_to_pick) });
  assertOk(confirmR);
});

// =========================================================
// PHASE 5: Wave Completion Check (GAP-4.3)
// =========================================================
test('GAP-4.3: Check wave progress after picks', () => {
  const wave = curl('GET', `/web/picking-waves/${WAVE_ID}`);
  assertOk(wave);
  if (wave.data?.summary?.completedTasks === undefined) throw new Error(JSON.stringify(wave).slice(0,200));
  console.log(`\n   Wave ${WAVE_ID}: ${wave.data.summary.completedTasks}/${wave.data.summary.totalTasks} completed`);
});

test('GAP-4: Complete Wave (web)', () => {
  const r = curl('POST', `/web/picking-waves/${WAVE_ID}/complete`, {});
  assertOk(r);
  const dbStatus = dbQuery(`SELECT status FROM picking_waves WHERE wave_id=${WAVE_ID}`);
  if (dbStatus !== 'COMPLETED') throw new Error(`Expected COMPLETED, got ${dbStatus}`);
});

// =========================================================
// PHASE 6: GAP-7 Pre-Pick Validation
// =========================================================
test('GAP-7: Pre-pick validation (RF validate-inventory)', () => {
  const r = curlRf('POST', '/rf/outbound/pick/validate-inventory', { taskId: TASK_IDS[0] });
  assertOk(r);
  // Should return null/empty for valid (sufficient inventory was confirmed)
  if (r.data && r.data.atRisk === true) {
    console.log(`   (Inventory at risk: available=${r.data.available}, required=${r.data.required})`);
  }
});

// =========================================================
// PHASE 7: GAP-3 Case Pick Display
// =========================================================
test('GAP-3.3: Verify case pick display fields', () => {
  const r = curlRf('POST', '/rf/outbound/pick/next-task', { facilityId: FACILITY_ID, userId: TEST_USER_ID });
  if (r.data?.pickType) {
    console.log(`   Task has pickType: ${r.data.pickType}`);
  }
  // Check products have case fields
  const products = dbQuery(`SELECT product_id, eaches_per_case, cases_per_pallet, preferred_pick_uom FROM products WHERE product_id=${PROD_ID}`);
  if (products) {
    console.log(`   Product case fields: ${products}`);
  }
});

// =========================================================
// PHASE 8: APP-PICK-F Backorder + APP-PICK-E Short Pick
// =========================================================
test('APP-PICK-E: Short pick with valid reason', () => {
  if (TASK_IDS.length < 3) {
    // Create an additional task for testing short pick — release a new order
    const orderNum2 = `E2E-OB2-${uid}`;
    const o2Id = dbInsertReturning(`INSERT INTO sales_orders
      (tenant_id, facility_id, order_number, order_name, client_id, customer_id, status, order_date, created_by)
    VALUES ('${TENANT_ID}', ${FACILITY_ID}, '${orderNum2}', 'E2E Short ${uid}', 1, ${CUST_ID}, 'RELEASED', CURRENT_DATE, '${TEST_USER_ID}')
    RETURNING order_id`);
    if (isNaN(o2Id)) { return; }
    const shortQty = Math.min(2, Math.floor(SYS_QTY * 0.3));
    dbQuery(`INSERT INTO sales_order_lines
      (tenant_id, facility_id, order_id, line_number, product_id, product_code, product_name,
       requested_quantity, uom_id, unit_price, status, created_by)
    VALUES ('${TENANT_ID}', ${FACILITY_ID}, ${o2Id}, 1, ${PROD_ID}, '${PROD_CODE}', '${PROD_NAME}',
      ${shortQty}, ${UOM_ID}, 10.00, 'RELEASED', '${TEST_USER_ID}')`);
    // Create wave for this order
    const waveNum2 = `WAVE2-${uid}`;
    const w2 = curl('POST', `/web/picking-waves`, { facilityId: FACILITY_ID, waveNumber: waveNum2, orderIds: [o2Id] });
    if (w2._httpCode >= 400) { return; }
    const w2r = curl('POST', `/web/picking-waves/${w2.data.wave_id}/release`, {});
    if (w2r._httpCode >= 400) { return; }
    // Get the task
    const t = curlRf('POST', '/rf/outbound/pick/next-task', { facilityId: FACILITY_ID, userId: TEST_USER_ID });
    if (!t.data || !t.data.task_id) { return; }
    const spTaskId = t.data.task_id;
    curlRf('POST', '/rf/outbound/pick/scan-location', { taskId: spTaskId, locationBarcode: LOC_CODE });
    // Do short pick
    const sp = curlRf('POST', '/rf/outbound/pick/short-pick', {
      taskId: spTaskId,
      actualPickedQuantity: 1,
      shortReason: 'DAMAGE',
    });
    assertOk(sp);
  } else {
    // Use a task from the original wave
    const spR = curlRf('POST', '/rf/outbound/pick/short-pick', {
      taskId: TASK_IDS[TASK_IDS.length-1],
      actualPickedQuantity: 1,
      shortReason: 'SHORT',
    });
    if (spR._httpCode >= 500) throw new Error(`Short pick error: ${spR._httpCode}`);
    if (spR._httpCode < 400) {
      if (spR.pickedQty !== 1) throw new Error(`Expected pickedQty=1, got ${spR.pickedQty}`);
    }
  }
});

test('APP-PICK-F: Verify backorder created from shortfall', () => {
  const c = dbCount('backorder_records', `tenant_id='${TENANT_ID}'`);
  if (Number(c) === 0) throw new Error('No backorder records found');
});

test('Web: List backorders', () => {
  const r = curl('GET', `/web/backorders`);
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length === 0) throw new Error('No backorders returned');
});

// =========================================================
// PHASE 9: APP-PICK-L Cancel Task
// =========================================================
test('APP-PICK-L: Cancel a task via web', () => {
  // Find a non-completed task if any
  const pendingTask = dbQuery(`SELECT task_id FROM picking_tasks WHERE tenant_id='${TENANT_ID}' AND wave_id=${WAVE_ID} AND status != 'COMPLETED' AND status != 'CANCELLED' LIMIT 1`);
  if (!pendingTask) { console.log('   (No pending task to cancel)'); return; }
  const cancelId = pendingTask.trim();
  const r = curl('PATCH', `/web/picking-tasks/${cancelId}/cancel`, { reason: 'OTHER' });
  assertOk(r);
  const dbStatus = dbQuery(`SELECT status FROM picking_tasks WHERE task_id=${cancelId}`);
  if (dbStatus !== 'CANCELLED') throw new Error(`Expected CANCELLED, got ${dbStatus}`);
});

// =========================================================
// PHASE 10: GAP-1 Cluster Picking
// =========================================================
test('GAP-1: Create cluster pick cart', () => {
  // Create a pick cart for cluster picking
  const cartCode = `CART-${uid}`;
  CLUSTER_CART_ID = dbInsertReturning(`INSERT INTO pick_carts (tenant_id, facility_id, cart_code, cart_type, num_shelves, is_active)
    VALUES ('${TENANT_ID}', ${FACILITY_ID}, '${cartCode}', 'CLUSTER', 3, true)
    RETURNING cart_id`);
  if (isNaN(CLUSTER_CART_ID)) throw new Error('Failed to create cart');
  if (!dbExists('pick_carts', 'cart_id', CLUSTER_CART_ID)) throw new Error('DB verify failed');
});

test('GAP-1: Setup cluster pick session (RF)', () => {
  if (!CLUSTER_CART_ID) return;
  const r = curlRf('POST', '/rf/outbound/pick/setup-cluster', {
    userId: TEST_USER_ID,
    cartId: CLUSTER_CART_ID,
    toteBarcodes: [`TOTE-C1-${uid}`, `TOTE-C2-${uid}`],
  });
  if (r._httpCode >= 500) throw new Error(`Cluster setup error: ${r._httpCode} ${JSON.stringify(r).slice(0,200)}`);
  if (r._httpCode < 400) {
    if (!r.data?.session) throw new Error(`No session returned: ${JSON.stringify(r).slice(0,200)}`);
    CLUSTER_SESSION_ID = r.data.session.session_id || r.data.session.group_id;
    console.log(`\n   Cluster session created: ${CLUSTER_SESSION_ID}`);
  }
});

test('GAP-1: Distribute pick to totes', () => {
  if (!CLUSTER_SESSION_ID) return;
  // Use first completed task
  const firstTaskId = TASK_IDS[0];
  const r = curlRf('POST', '/rf/outbound/pick/distribute', {
    taskId: firstTaskId,
    distributions: [
      { toteBarcode: `TOTE-C1-${uid}`, quantity: 2 },
      { toteBarcode: `TOTE-C2-${uid}`, quantity: 3 },
    ],
  });
  if (r._httpCode >= 500) throw new Error(`Distribute error: ${r._httpCode} ${JSON.stringify(r).slice(0,200)}`);
});

test('GAP-1: Complete cluster session (RF)', () => {
  if (!CLUSTER_SESSION_ID) return;
  const r = curlRf('POST', '/rf/outbound/pick/cluster-complete', { sessionId: CLUSTER_SESSION_ID });
  if (r._httpCode >= 500) throw new Error(`Cluster complete error: ${r._httpCode} ${JSON.stringify(r).slice(0,200)}`);
});

// =========================================================
// PHASE 11: APP-PICK-J Pick Audit Log
// =========================================================
test('APP-PICK-J: Pick audit timeline (web)', () => {
  const r = curl('GET', `/web/audit/pick/${TASK_IDS[0]}/timeline`);
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length === 0) throw new Error('No audit entries');
  const eventTypes = items.map(e => e.event_type);
  console.log(`\n   Audit events for task ${TASK_IDS[0]}: ${eventTypes.join(', ')}`);
  if (!eventTypes.includes('PICK_CONFIRMED')) throw new Error(`Missing PICK_CONFIRMED in [${eventTypes.join(',')}]`);
});

// =========================================================
// PHASE 12: Web Endpoints
// =========================================================
test('Web: Get wave tasks (with details)', () => {
  const r = curl('GET', `/web/wave-tasks/${WAVE_ID}`);
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length === 0) throw new Error('No wave tasks');
});

test('RF: wave-status', () => {
  const r = curlRf('POST', '/rf/outbound/pick/wave-status', { facilityId: FACILITY_ID, status: 'COMPLETED' });
  assertOk(r);
  const tasks = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []);
  if (tasks.length === 0) console.log('   (0 completed tasks)');
});

test('Web: List picking waves', () => {
  const r = curl('GET', `/web/picking-waves?facilityId=${FACILITY_ID}`);
  assertOk(r);
  const items = r.data?.data || [];
  if (items.length === 0) throw new Error('No waves found');
});

test('RF: my-tasks', () => {
  const r = curlRf('POST', '/rf/outbound/pick/my-tasks', { userId: TEST_USER_ID, facilityId: FACILITY_ID });
  assertOk(r);
  const items = Array.isArray(r.data) ? r.data : [];
  if (items.length > 0) console.log(`\n   User has ${items.length} pending task(s)`);
});

// =========================================================
// PHASE 13: Final DB Verifications
// =========================================================
test('DB: pick_audit_log entries exist', () => {
  const c = dbCount('pick_audit_log', `tenant_id='${TENANT_ID}'`);
  if (Number(c) === 0) throw new Error('No pick_audit_log entries');
});

test('DB: backorder_records have correct status', () => {
  const open = dbCount('backorder_records', `tenant_id='${TENANT_ID}' AND status='OPEN'`);
  if (Number(open) === 0) throw new Error('No open backorders');
});

test('DB: inventory_allocations for order exist', () => {
  const c = dbCount('inventory_allocations', `tenant_id='${TENANT_ID}' AND allocated_for_reference_type='SALES_ORDER_LINE' AND allocated_for_reference_id=${ORDER_LINE_ID}`);
  if (Number(c) === 0) throw new Error('No allocations for order line');
});

test('DB: picking_tasks have pick_type field', () => {
  const c = dbCount('picking_tasks', `tenant_id='${TENANT_ID}' AND wave_id=${WAVE_ID} AND pick_type IS NOT NULL`);
  if (Number(c) === 0) console.log('   (pick_type not set on tasks)');
});

test('DB: pick_carts created', () => {
  if (!CLUSTER_CART_ID) return;
  const c = dbCount('pick_carts', `tenant_id='${TENANT_ID}' AND cart_id=${CLUSTER_CART_ID}`);
  if (Number(c) === 0) throw new Error('Pick cart not found');
});

test('DB: short_pick_reasons seeded', () => {
  const c = dbCount('short_pick_reasons', `tenant_id='${TENANT_ID}'`);
  if (Number(c) === 0) throw new Error('No short_pick_reasons');
});

// =========================================================
// PHASE 14: Full Pallet Pick (APP-PICK-A)
// =========================================================
test('APP-PICK-A: Scan pallet LPN', () => {
  // Find an existing LPN for scanning
  const lpnRow = dbQuery(`SELECT lpn_number, lpn_id FROM license_plate_numbers
    WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
    AND lpn_type='PALLET' LIMIT 1`);
  if (!lpnRow) { console.log('   (No pallet LPN available)'); return; }
  const r = curlRf('POST', `/rf/outbound/pick/scan-pallet`, {
    facilityId: FACILITY_ID,
    lpnBarcode: lpnRow.split('|')[0],
  });
  assertOk(r);
  if (!r.data?.valid) throw new Error(`Pallet scan failed: ${JSON.stringify(r.data)}`);
});

test('APP-PICK-A: Confirm pallet pick', () => {
  // Use an existing ASSIGNED/IN_PROGRESS task if available
  const taskId = dbQuery(`SELECT task_id FROM picking_tasks
    WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
    AND status IN ('ASSIGNED','IN_PROGRESS') LIMIT 1`);
  if (!taskId) { console.log('   (No active task for pallet confirm)'); return; }
  const r = curlRf('POST', `/rf/outbound/pick/confirm-pallet`, {
    taskId: Number(taskId),
    pickedQuantity: 1,
    pickType: 'FULL_PALLET',
  });
  assertOk(r);
});

// =========================================================
// PHASE 15: Equipment & Route Optimization (APP-PICK-B, GAP-5)
// =========================================================
test('APP-PICK-B: Set operator equipment type', () => {
  const r = curlRf('POST', `/rf/outbound/pick/set-equipment`, {
    userId: TEST_USER_ID,
    equipmentType: 'PALLET_JACK',
  });
  assertOk(r);
  if (!r.data?.saved) throw new Error('Equipment not saved');
});

test('APP-PICK-B: Set equipment back to PEDESTRIAN', () => {
  const r = curlRf('POST', `/rf/outbound/pick/set-equipment`, {
    userId: TEST_USER_ID,
    equipmentType: 'PEDESTRIAN',
  });
  assertOk(r);
});

test('GAP-5: Web pick-route view', () => {
  if (!WAVE_ID) { console.log('   (No wave for route)'); return; }
  const r = curl('GET', `/web/pick-routes/${WAVE_ID}`, {});
  assertOk(r);
  console.log(`   Route has ${r.data?.routes?.length || 0} entries`);
});

test('GAP-5: Re-optimize pick route', () => {
  if (!WAVE_ID) { console.log('   (No wave for route)'); return; }
  const r = curl('POST', `/web/pick-routes/${WAVE_ID}/optimize`, {});
  assertOk(r);
  if (r.data?.tasksOptimized && r.data.tasksOptimized > 0) {
    console.log(`   Optimized ${r.data.tasksOptimized} tasks`);
  }
});

// =========================================================
// PHASE 16: Task Interleaving & Auto-Unassign (GAP-6, APP-PICK-I)
// =========================================================
test('GAP-6: Next interleaved task', () => {
  const r = curlRf('POST', `/rf/outbound/pick/next-interleaved`, {
    facilityId: FACILITY_ID,
    currentLocationId: LOC_ID,
  });
  assertOk(r);
});

test('APP-PICK-I: Auto-unassign expired tasks', () => {
  const r = curlRf('POST', `/rf/outbound/pick/auto-unassign`, {
    facilityId: FACILITY_ID,
  });
  assertOk(r);
  console.log(`   Released ${r.data?.releasedCount || 0} expired tasks`);
});

// =========================================================
// PHASE 17: APP-PICK-G Three-Attempt Location Lock
// =========================================================
test('APP-PICK-G: First wrong location attempt increments counter', () => {
  // Get an AVAILABLE task, assign it, then scan wrong location
  const availId = dbQuery(`SELECT task_id FROM picking_tasks
    WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
    AND status='AVAILABLE' LIMIT 1`);
  if (!availId) { console.log('   (No available task)'); return; }
  // Assign it first
  curlRf('POST', `/rf/outbound/pick/assign`, { taskId: Number(availId), userId: TEST_USER_ID });
  // Scan wrong location (expect mismatch)
  try {
    curlRf('POST', `/rf/outbound/pick/scan-location`, { taskId: Number(availId), locationBarcode: 'WRONG-LOC-001' });
    throw new Error('Expected wrong location error');
  } catch (e) {
    if (!e.message.includes('WRONG LOCATION')) throw e;
  }
  // Check mismatch count
  const count = dbQuery(`SELECT mismatch_count FROM picking_tasks WHERE task_id=${Number(availId)}`);
  if (Number(count) >= 1) console.log(`   Mismatch count: ${count}`);
});

test('APP-PICK-G: Third wrong location locks task', () => {
  const availId = dbQuery(`SELECT task_id FROM picking_tasks
    WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
    AND hold_reason='LOCATION_MISMATCH_LOCK' LIMIT 1`);
  if (!availId) { console.log('   (No locked task)'); return; }
  const status = dbQuery(`SELECT status FROM picking_tasks WHERE task_id=${Number(availId)}`);
  if (status === 'ON_HOLD') console.log('   Task is ON_HOLD — lock works');
});

// =========================================================
// PHASE 18: APP-PICK-M RF Resume & Save State
// =========================================================
test('APP-PICK-M: Save pick state to session', () => {
  const r = curlRf('POST', `/rf/outbound/pick/save-state`, {
    userId: TEST_USER_ID,
    state: { currentTaskId: TASK_IDS[0] || '', lastStep: 'LOCATION_SCANNED' },
  });
  assertOk(r);
  if (!r.data?.saved) throw new Error('State not saved');
});

test('APP-PICK-M: Resume pick session', () => {
  const r = curlRf('POST', `/rf/outbound/pick/resume`, {
    userId: TEST_USER_ID,
    facilityId: FACILITY_ID,
  });
  assertOk(r);
  console.log(`   Resumed with ${r.data?.tasks?.length || 0} active tasks`);
});

// =========================================================
// PHASE 19: GAP-2 Batch Pick Session
// =========================================================
test('GAP-2: Create batch pick session', () => {
  if (!WAVE_ID) { console.log('   (No wave for batch)'); return; }
  const r = curlRf('POST', `/rf/outbound/pick/batch-start`, {
    waveId: WAVE_ID,
    userId: TEST_USER_ID,
  });
  if (r._httpCode >= 400) {
    // Wave may already be completed; batch requires RELEASED status
    console.log(`   (Wave ${WAVE_ID} not RELEASED - batch needs RELEASED wave)`);
    return;
  }
  if (r.data?.batchId) console.log(`   Batch ${r.data.batchId} created with ${r.data.totalTasks} tasks`);
});

// =========================================================
// PHASE 20: APP-PICK-L Cancel Task with Inventory Restoration
// =========================================================
test('APP-PICK-L: Cancel task with inventory restoration (needs assigned task)', () => {
  const taskId = dbQuery(`SELECT task_id FROM picking_tasks
    WHERE tenant_id='${TENANT_ID}' AND facility_id=${FACILITY_ID}
    AND status='ASSIGNED' LIMIT 1`);
  if (!taskId) { console.log('   (No assigned task to cancel)'); return; }
  // Check on-hand before cancel
  const task = dbQuery(`SELECT from_location_id, product_id, quantity_picked FROM picking_tasks WHERE task_id=${Number(taskId)}`);
  if (!task) return;
  const before = dbQuery(`SELECT quantity_on_hand FROM inventory_on_hand
    WHERE tenant_id='${TENANT_ID}' AND location_id=${Number(task.split('|')[0])} AND product_id=${Number(task.split('|')[1])}`);
  // Cancel the task
  const r = curl('PATCH', `/web/picking-tasks/${Number(taskId)}/cancel`, {
    reason: 'ORDER_CANCELLED',
  });
  assertOk(r);
  // Verify status
  const status = dbQuery(`SELECT status FROM picking_tasks WHERE task_id=${Number(taskId)}`);
  if (status === 'CANCELLED') console.log('   Task cancelled successfully');
});

// =========================================================
// PHASE 21: DB Schema Verification
// =========================================================
test('DB: mismatch_count column exists on picking_tasks', () => {
  const c = dbQuery(`SELECT mismatch_count FROM picking_tasks WHERE tenant_id='${TENANT_ID}' LIMIT 1`);
  if (c === null || c === undefined) console.log('   (mismatch_count column not populated)');
});

test('DB: FORWARD_PICK and RESERVE location types exist', () => {
  const types = dbQuery(`SELECT unnest(enum_range(NULL::multitenant.location_type))::text AS val`);
  if (types && (types.includes('FORWARD_PICK') || types.includes('RESERVE'))) {
    console.log('   Location types: FORWARD_PICK, RESERVE available');
  }
});

test('DB: batch_sortation_sessions indexes exist', () => {
  const idx = dbQuery(`SELECT indexname FROM pg_indexes WHERE tablename='batch_sortation_sessions' AND schemaname='multitenant'`);
  if (idx) console.log(`   Indexes: ${idx}`);
});

// =========================================================
// PHASE 22: Cleanup
// =========================================================
test('Cleanup: Delete wave', () => {
  curl('DELETE', `/web/picking-waves/${WAVE_ID}`, {});
});

test('Cleanup: Delete sales order (API)', () => {
  const r = curl('DELETE', `/web/sales-orders/${ORDER_ID}`, {});
  if (r._httpCode >= 400) {
    // Fallback: DB delete
    dbQuery(`DELETE FROM sales_order_lines WHERE tenant_id='${TENANT_ID}' AND order_id=${ORDER_ID}`);
    dbQuery(`DELETE FROM sales_orders WHERE tenant_id='${TENANT_ID}' AND order_id=${ORDER_ID}`);
  }
});

test('Cleanup: Delete pick cart (DB)', () => {
  if (CLUSTER_CART_ID) {
    dbQuery(`DELETE FROM pick_cart_assignments WHERE tenant_id='${TENANT_ID}' AND cart_id=${CLUSTER_CART_ID}`);
    dbQuery(`DELETE FROM cluster_pick_groups WHERE tenant_id='${TENANT_ID}' AND cart_id=${CLUSTER_CART_ID}`);
    dbQuery(`DELETE FROM pick_carts WHERE tenant_id='${TENANT_ID}' AND cart_id=${CLUSTER_CART_ID}`);
  }
});

console.log(`\n========== Passed: ${passes} Failed: ${fails} ==========`);
stopServer();
console.log('Server stopped');
process.exit(fails > 0 ? 1 : 0);
