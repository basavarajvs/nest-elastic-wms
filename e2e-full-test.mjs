#!/usr/bin/env node
/**
 * E2E Master Data Test Suite
 * Starts WMS server, runs tests, stops server - all in one process.
 * Run: node e2e-full-test.mjs
 */
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WMS_PORT = 3002;
const AUTH_URL = 'http://localhost:3000/api/v1/auth/login';
const WMS_URL = `http://localhost:${WMS_PORT}/api/v1/wms`;
const TENANT_CODE = 'DE0001';
const USER_EMAIL = 'tenant.admin@gmail.com';
const USER_PASSWORD = 'Super@Admin';

const ts = Date.now().toString(36).slice(-6); // short unique suffix

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function jsonFetch(url, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const resp = await fetch(url, {
      method,
      headers: {
        'accept': '*/*',
        'X-Tenant-Code': TENANT_CODE,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const status = resp.status;
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  let passed = 0, failed = 0, step = 0;
  const fail = (msg) => { console.error(`  FAIL: ${msg}`); failed++; process.exit(1); };
  const pass = (msg) => { console.log(`  PASS: ${msg}`); passed++; };

  // ─── Start WMS Server ──────────────────────────────────────────────
  console.log('--- Starting WMS Server ---');
  const serverPath = resolve(__dirname, 'dist/main.js');
  const server = spawn('node', [serverPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  server.stdout.on('data', d => process.stdout.write(d));
  server.stderr.on('data', d => process.stderr.write(d));

  // Wait for ready
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const resp = await fetch(`http://localhost:${WMS_PORT}/api/v1/wms/health`, { signal: AbortSignal.timeout(2000) });
      if (resp.status === 200) { ready = true; console.log(`Server ready in ${i+1}s`); break; }
    } catch {}
  }
  if (!ready) { console.error('Server failed to start'); server.kill('SIGTERM'); process.exit(1); }

  // ─── Login ──────────────────────────────────────────────────────
  step++;
  console.log(`\n--- Step ${step}: Login ---`);
  const loginResp = await jsonFetch(AUTH_URL, {
    method: 'POST',
    body: { email: USER_EMAIL, password: USER_PASSWORD },
  });
  if (loginResp.status !== 200 && loginResp.status !== 201) fail(`Login: ${loginResp.status}`);
  const token = loginResp.data?.data?.accessToken;
  if (!token) fail('No token');
  pass(`Token (${token.length} chars)`);
  const auth = { 'Authorization': `Bearer ${token}` };

  // ─── Facility ──────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Facility ---`);
  const fr = await jsonFetch(`${WMS_URL}/web/facilities`, {
    method: 'POST', headers: auth,
    body: { facilityName: 'E2E WH ' + ts, facilityCode: 'E2E-WH-' + ts, facilityType: 'WAREHOUSE' },
  });
  if (fr.status !== 200 && fr.status !== 201) fail(`Facility: ${fr.status} ${JSON.stringify(fr.data).slice(0,200)}`);
  const facilityId = fr.data?.facility_id || fr.data?.data?.facility_id || fr.data?.id;
  pass(`Facility ID=${facilityId}`);

  // ─── UOM ──────────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create UOM ---`);
  const ur = await jsonFetch(`${WMS_URL}/web/units-of-measure`, {
    method: 'POST', headers: auth,
    body: { uomName: 'Each ' + ts, uomCode: 'EA-' + ts },
  });
  if (ur.status !== 200 && ur.status !== 201) fail(`UOM: ${ur.status}`);
  const uomId = ur.data?.uom_id || ur.data?.data?.uom_id || ur.data?.id;
  pass(`UOM ID=${uomId}`);

  // ─── Category ─────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Category ---`);
  const cr = await jsonFetch(`${WMS_URL}/web/product-categories`, {
    method: 'POST', headers: auth,
    body: { categoryName: 'E2E Cat ' + ts, categoryCode: 'E2E-CAT-' + ts },
  });
  if (cr.status !== 200 && cr.status !== 201) fail(`Category: ${cr.status}`);
  const catId = cr.data?.category_id || cr.data?.data?.category_id || cr.data?.id;
  pass(`Category ID=${catId}`);

  // ─── Client ──────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Client ---`);
  const clr = await jsonFetch(`${WMS_URL}/web/clients`, {
    method: 'POST', headers: auth,
    body: { clientCode: 'E2E-CLIENT-' + ts, clientName: 'E2E Test Client ' + ts },
  });
  if (clr.status !== 200 && clr.status !== 201) fail(`Client: ${clr.status}`);
  const clientId = clr.data?.client_id || clr.data?.data?.client_id || clr.data?.id;
  pass(`Client ID=${clientId}`);

  // ─── Product ─────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Product ---`);
  const pr = await jsonFetch(`${WMS_URL}/web/products`, {
    method: 'POST', headers: auth,
    body: { productCode: 'E2E-PROD-' + ts, productName: 'E2E Test Widget ' + ts, categoryId: Number(catId), primaryUomId: Number(uomId) },
  });
  if (pr.status !== 200 && pr.status !== 201) fail(`Product: ${pr.status} ${JSON.stringify(pr.data).slice(0,200)}`);
  const productId = pr.data?.product_id || pr.data?.data?.product_id || pr.data?.id;
  pass(`Product ID=${productId}`);

  // ─── Fetch Product ───────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Fetch Product ---`);
  const gpr = await jsonFetch(`${WMS_URL}/web/products/${productId}`, { headers: auth });
  if (gpr.status !== 200) fail(`Fetch Product: ${gpr.status}`);
  const prodName = gpr.data?.product_name || gpr.data?.data?.product_name;
  pass(`Product="${prodName}"`);

  // ─── Fetch Client ────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Fetch Client ---`);
  const gcr = await jsonFetch(`${WMS_URL}/web/clients/${clientId}`, { headers: auth });
  if (gcr.status !== 200) fail(`Fetch Client: ${gcr.status}`);
  const clientName = gcr.data?.client_name || gcr.data?.data?.client_name;
  pass(`Client="${clientName}"`);

  // ─── Brand ──────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Brand ---`);
  const br = await jsonFetch(`${WMS_URL}/web/product-brands`, {
    method: 'POST', headers: auth,
    body: { brandName: 'E2E Brand ' + ts, brandCode: 'E2E-BR-' + ts },
  });
  if (br.status !== 200 && br.status !== 201) fail(`Brand: ${br.status}`);
  const brandId = br.data?.brand_id || br.data?.data?.brand_id || br.data?.id;
  pass(`Brand ID=${brandId}`);

  // ─── Zone ────────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Zone ---`);
  const zr = await jsonFetch(`${WMS_URL}/web/zones`, {
    method: 'POST', headers: auth,
    body: { facilityId: Number(facilityId), zoneName: 'E2E Rack ' + ts, zoneCode: 'E2E-ZN-RK-' + ts, zoneType: 'RACK' },
  });
  if (zr.status !== 200 && zr.status !== 201) fail(`Zone: ${zr.status} ${JSON.stringify(zr.data).slice(0,200)}`);
  const zoneId = zr.data?.zone_id || zr.data?.data?.zone_id || zr.data?.id;
  pass(`Zone ID=${zoneId}`);

  // ─── Location ────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Location ---`);
  const lr = await jsonFetch(`${WMS_URL}/web/locations`, {
    method: 'POST', headers: auth,
    body: { facilityId: Number(facilityId), locationName: 'E2E-A-' + ts, locationCode: 'E2E-A-' + ts, locationType: 'EACH', zoneId: Number(zoneId) },
  });
  if (lr.status !== 200 && lr.status !== 201) fail(`Location: ${lr.status} ${JSON.stringify(lr.data).slice(0,200)}`);
  const locId = lr.data?.location_id || lr.data?.data?.location_id || lr.data?.id;
  pass(`Location ID=${locId}`);

  // ─── Fetch Location ──────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Fetch Location ---`);
  const glr = await jsonFetch(`${WMS_URL}/web/locations/${locId}`, { headers: auth });
  if (glr.status !== 200) fail(`Fetch Location: ${glr.status}`);
  const locName = glr.data?.location_name || glr.data?.data?.location_name;
  pass(`Location="${locName}"`);

  // ─── Customer ────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Customer ---`);
  const cur = await jsonFetch(`${WMS_URL}/web/customers`, {
    method: 'POST', headers: auth,
    body: { customerCode: 'E2E-CUST-' + ts, customerName: 'E2E Customer ' + ts },
  });
  if (cur.status !== 200 && cur.status !== 201) fail(`Customer: ${cur.status}`);
  const custId = cur.data?.customer_id || cur.data?.data?.customer_id || cur.data?.id;
  pass(`Customer ID=${custId}`);

  // ─── Vendor ──────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Vendor ---`);
  const vr = await jsonFetch(`${WMS_URL}/web/vendors`, {
    method: 'POST', headers: auth,
    body: { vendorCode: 'E2E-VEND-' + ts, vendorName: 'E2E Vendor ' + ts },
  });
  if (vr.status !== 200 && vr.status !== 201) fail(`Vendor: ${vr.status}`);
  const vendId = vr.data?.vendor_id || vr.data?.data?.vendor_id || vr.data?.id;
  pass(`Vendor ID=${vendId}`);

  // ─── Carrier ─────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Carrier ---`);
  const carr = await jsonFetch(`${WMS_URL}/web/carriers`, {
    method: 'POST', headers: auth,
    body: { carrierCode: 'E2E-CARR-' + ts, carrierName: 'E2E Carrier ' + ts },
  });
  if (carr.status !== 200 && carr.status !== 201) fail(`Carrier: ${carr.status}`);
  const carrId = carr.data?.carrier_id || carr.data?.data?.carrier_id || carr.data?.id;
  pass(`Carrier ID=${carrId}`);

  // ─── Product-Client Assignment ───────────────────────────────
  step++;
  console.log(`--- Step ${step}: Product-Client Assignment ---`);
  const pcar = await jsonFetch(`${WMS_URL}/web/product-client-assignments`, {
    method: 'POST', headers: auth,
    body: { productId: Number(productId), clientId: Number(clientId), facilityId: Number(facilityId) },
  });
  if (pcar.status !== 200 && pcar.status !== 201) fail(`Assignment: ${pcar.status} ${JSON.stringify(pcar.data).slice(0,200)}`);
  const pcaId = pcar.data?.id || pcar.data?.data?.id;
  pass(`Assignment ID=${pcaId}`);

  // ─── Done ──────────────────────────────────────────────────────
  console.log(`\n========== ALL ${step} TESTS PASSED ==========`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);

  // Stop server
  server.kill('SIGTERM');
  // Wait for graceful shutdown
  await sleep(2000);
  server.kill('SIGKILL');
}

main().catch(err => {
  console.error('Unhandled:', err);
  process.exit(1);
});
