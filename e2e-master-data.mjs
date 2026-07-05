/**
 * E2E Master Data API Test
 * Run: node e2e-master-data.mjs
 * Tests against running WMS server (port 3002) with auth via Core API (port 3000)
 */

const AUTH_URL = 'http://localhost:3000/api/v1/auth/login';
const WMS_URL = 'http://localhost:3002/api/v1/wms';
const TENANT_CODE = 'DE0001';
const USER_EMAIL = 'warehouse.manager@somemail.com';
const USER_PASSWORD = 'Super@Admin';

async function jsonFetch(url, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const resp = await fetch(url, {
    method,
    headers: {
      'accept': '*/*',
      'X-Tenant-Code': TENANT_CODE,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const status = resp.status;
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status, data };
}

async function main() {
  let passed = 0, failed = 0, step = 0;
  const fail = (msg) => { console.error(`  FAIL: ${msg}`); failed++; process.exit(1); };
  const pass = (msg) => { console.log(`  PASS: ${msg}`); passed++; };

  // ─── Login ──────────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Login ---`);
  const loginResp = await jsonFetch(AUTH_URL, {
    method: 'POST',
    body: { email: USER_EMAIL, password: USER_PASSWORD },
  });
  if (loginResp.status !== 200 && loginResp.status !== 201) fail(`Login failed: ${loginResp.status}`);
  const token = loginResp.data?.data?.accessToken;
  if (!token) fail('No token in login response');
  pass(`Token obtained (${token.length} chars)`);
  const auth = { 'Authorization': `Bearer ${token}` };

  // ─── Create Facility ────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Facility ---`);
  // NOTE: Service expects camelCase field names
  const facilityResp = await jsonFetch(`${WMS_URL}/web/facilities`, {
    method: 'POST',
    headers: auth,
    body: { facilityName: 'E2E Test Warehouse', facilityCode: 'E2E-WH-01', facilityType: 'WAREHOUSE' },
  });
  console.log(`  HTTP ${facilityResp.status}`);
  if (facilityResp.status !== 200 && facilityResp.status !== 201) {
    console.error(`  BODY:`, JSON.stringify(facilityResp.data).slice(0, 300));
    fail('Create Facility');
  }
  const facilityId = facilityResp.data?.facility_id || facilityResp.data?.data?.facility_id || facilityResp.data?.id;
  pass(`Facility created, ID=${facilityId}`);

  // ─── Create UOM ─────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create UOM ---`);
  const uomResp = await jsonFetch(`${WMS_URL}/web/units-of-measure`, {
    method: 'POST',
    headers: auth,
    body: { uomName: 'Each', uomCode: 'EA' },
  });
  if (uomResp.status !== 200 && uomResp.status !== 201) fail(`Create UOM: ${uomResp.status}`);
  const uomId = uomResp.data?.uom_id || uomResp.data?.data?.uom_id || uomResp.data?.id;
  pass(`UOM created, ID=${uomId}`);

  // ─── Create Category ────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Category ---`);
  const catResp = await jsonFetch(`${WMS_URL}/web/product-categories`, {
    method: 'POST',
    headers: auth,
    body: { categoryName: 'E2E Cat', categoryCode: 'E2E-CAT-01' },
  });
  if (catResp.status !== 200 && catResp.status !== 201) fail(`Create Category: ${catResp.status}`);
  const catId = catResp.data?.category_id || catResp.data?.data?.category_id || catResp.data?.id;
  pass(`Category created, ID=${catId}`);

  // ─── Create Client ──────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Client ---`);
  const clientResp = await jsonFetch(`${WMS_URL}/web/clients`, {
    method: 'POST',
    headers: auth,
    body: { clientCode: 'E2E-CLIENT-01', clientName: 'E2E Test Client' },
  });
  if (clientResp.status !== 200 && clientResp.status !== 201) fail(`Create Client: ${clientResp.status}`);
  const clientId = clientResp.data?.client_id || clientResp.data?.data?.client_id || clientResp.data?.id;
  pass(`Client created, ID=${clientId}`);

  // ─── Create Product ─────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Product ---`);
  const prodResp = await jsonFetch(`${WMS_URL}/web/products`, {
    method: 'POST',
    headers: auth,
    body: { productCode: 'E2E-PROD-01', productName: 'E2E Test Widget', categoryId: Number(catId), primaryUomId: Number(uomId) },
  });
  if (prodResp.status !== 200 && prodResp.status !== 201) fail(`Create Product: ${prodResp.status}`);
  const productId = prodResp.data?.product_id || prodResp.data?.data?.product_id || prodResp.data?.id;
  pass(`Product created, ID=${productId}`);

  // ─── Fetch Product ──────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Fetch Product ---`);
  const getProdResp = await jsonFetch(`${WMS_URL}/web/products/${productId}`, { headers: auth });
  if (getProdResp.status !== 200) fail(`Fetch Product: ${getProdResp.status}`);
  const prodName = getProdResp.data?.product_name || getProdResp.data?.data?.product_name;
  pass(`Product fetched, name="${prodName}"`);

  // ─── Fetch Client ───────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Fetch Client ---`);
  const getClientResp = await jsonFetch(`${WMS_URL}/web/clients/${clientId}`, { headers: auth });
  if (getClientResp.status !== 200) fail(`Fetch Client: ${getClientResp.status}`);
  const clientName = getClientResp.data?.client_name || getClientResp.data?.data?.client_name;
  pass(`Client fetched, name="${clientName}"`);

  // ─── Create Brand ───────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Brand ---`);
  const brandResp = await jsonFetch(`${WMS_URL}/web/product-brands`, {
    method: 'POST',
    headers: auth,
    body: { brandName: 'E2E Brand', brandCode: 'E2E-BR-01' },
  });
  if (brandResp.status !== 200 && brandResp.status !== 201) fail(`Create Brand: ${brandResp.status}`);
  const brandId = brandResp.data?.brand_id || brandResp.data?.data?.brand_id || brandResp.data?.id;
  pass(`Brand created, ID=${brandId}`);

  // ─── Create Zone ────────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Zone ---`);
  const zoneResp = await jsonFetch(`${WMS_URL}/web/zones`, {
    method: 'POST',
    headers: auth,
    body: { facilityId: Number(facilityId), zoneName: 'E2E Rack', zoneCode: 'E2E-ZN-RK', zoneType: 'RACK' },
  });
  if (zoneResp.status !== 200 && zoneResp.status !== 201) fail(`Create Zone: ${zoneResp.status}`);
  const zoneId = zoneResp.data?.zone_id || zoneResp.data?.data?.zone_id || zoneResp.data?.id;
  pass(`Zone created, ID=${zoneId}`);

  // ─── Create Location ────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Location ---`);
  const locResp = await jsonFetch(`${WMS_URL}/web/locations`, {
    method: 'POST',
    headers: auth,
    body: { facilityId: Number(facilityId), locationName: 'E2E-A-01', locationCode: 'E2E-A-01', locationType: 'EACH', zoneId: Number(zoneId) },
  });
  if (locResp.status !== 200 && locResp.status !== 201) fail(`Create Location: ${locResp.status}`);
  const locId = locResp.data?.location_id || locResp.data?.data?.location_id || locResp.data?.id;
  pass(`Location created, ID=${locId}`);

  // ─── Fetch Location ─────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Fetch Location ---`);
  const getLocResp = await jsonFetch(`${WMS_URL}/web/locations/${locId}`, { headers: auth });
  if (getLocResp.status !== 200) fail(`Fetch Location: ${getLocResp.status}`);
  const locName = getLocResp.data?.location_name || getLocResp.data?.data?.location_name;
  pass(`Location fetched, name="${locName}"`);

  // ─── Create Customer ────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Customer ---`);
  const custResp = await jsonFetch(`${WMS_URL}/web/customers`, {
    method: 'POST',
    headers: auth,
    body: { customerCode: 'E2E-CUST-01', customerName: 'E2E Customer' },
  });
  if (custResp.status !== 200 && custResp.status !== 201) fail(`Create Customer: ${custResp.status}`);
  const custId = custResp.data?.customer_id || custResp.data?.data?.customer_id || custResp.data?.id;
  pass(`Customer created, ID=${custId}`);

  // ─── Create Vendor ──────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Vendor ---`);
  const vendResp = await jsonFetch(`${WMS_URL}/web/vendors`, {
    method: 'POST',
    headers: auth,
    body: { vendorCode: 'E2E-VEND-01', vendorName: 'E2E Vendor' },
  });
  if (vendResp.status !== 200 && vendResp.status !== 201) fail(`Create Vendor: ${vendResp.status}`);
  const vendId = vendResp.data?.vendor_id || vendResp.data?.data?.vendor_id || vendResp.data?.id;
  pass(`Vendor created, ID=${vendId}`);

  // ─── Create Carrier ─────────────────────────────────────────
  step++;
  console.log(`--- Step ${step}: Create Carrier ---`);
  const carrResp = await jsonFetch(`${WMS_URL}/web/carriers`, {
    method: 'POST',
    headers: auth,
    body: { carrierCode: 'E2E-CARR-01', carrierName: 'E2E Carrier' },
  });
  if (carrResp.status !== 200 && carrResp.status !== 201) fail(`Create Carrier: ${carrResp.status}`);
  const carrId = carrResp.data?.carrier_id || carrResp.data?.data?.carrier_id || carrResp.data?.id;
  pass(`Carrier created, ID=${carrId}`);

  // ─── Product-Client Assignment ──────────────────────────────
  step++;
  console.log(`--- Step ${step}: Product-Client Assignment ---`);
  const pcaResp = await jsonFetch(`${WMS_URL}/web/product-client-assignments`, {
    method: 'POST',
    headers: auth,
    body: { productId: Number(productId), clientId: Number(clientId), facilityId: Number(facilityId) },
  });
  if (pcaResp.status !== 200 && pcaResp.status !== 201) fail(`Create Assignment: ${pcaResp.status}`);
  const pcaId = pcaResp.data?.id || pcaResp.data?.data?.id;
  pass(`Assignment created, ID=${pcaId}`);

  console.log(`\n========== ALL ${step} TESTS PASSED ==========`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
