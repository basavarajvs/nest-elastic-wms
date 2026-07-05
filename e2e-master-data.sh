#!/usr/bin/env bash
set -euo pipefail

# This script is designed to be called as a single bash invocation.
# It starts the WMS server, runs E2E tests, then stops the server.

WMS_PORT=3002
TENANT_CODE="DE0001"
USER_EMAIL="warehouse.manager@somemail.com"
USER_PASSWORD="Super@Admin"
WMS_DIR="/home/raju/Project/Nest/SaasCore/new-wmsbackend"

echo "=== Starting WMS Server ==="
cd "$WMS_DIR"
rm -f /tmp/wms-server2.log

# Start server in background and track PID
node dist/main.js > /tmp/wms-server2.log 2>&1 &
WMS_PID=$!
echo "Server PID=$WMS_PID"

# Wait for server ready (up to 30s)
for i in $(seq 1 30); do
  sleep 1
  if grep -q "successfully started" /tmp/wms-server2.log 2>/dev/null; then
    echo "Server ready in ${i}s"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: Server failed to start"
    tail -20 /tmp/wms-server2.log
    kill "$WMS_PID" 2>/dev/null || true
    exit 1
  fi
done

AUTH_URL="http://localhost:3000"
WMS_URL="http://localhost:${WMS_PORT}/api/v1/wms"

# ─── Login ────────────────────────────────────────────────────────────
echo ""
echo "--- Step 1: Login ---"
LOGIN_RESP=$(curl -s --max-time 10 -X POST "${AUTH_URL}/api/v1/auth/login" \
  -H "accept: */*" -H "X-Tenant-Code: ${TENANT_CODE}" -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_EMAIL}\",\"password\":\"${USER_PASSWORD}\"}")
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.accessToken // empty')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "FAIL: No token"
  echo "$LOGIN_RESP" | jq .
  kill "$WMS_PID" 2>/dev/null || true
  exit 1
fi
echo "PASS: Token length=${#TOKEN}"

AUTH="Authorization: Bearer ${TOKEN}"

# Helper
do_post() {
  local url="$1" data="$2" label="$3"
  local resp code body
  resp=$(curl -s --max-time 15 -w "\n%{http_code}" -X POST "$url" \
    -H "accept: */*" -H "${AUTH}" -H "X-Tenant-Code: ${TENANT_CODE}" -H "Content-Type: application/json" -d "$data")
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')
  if [ "$code" != "200" ] && [ "$code" != "201" ]; then
    echo "FAIL: $label (HTTP $code)"
    echo "BODY: $(echo "$body" | head -c 300)"
    kill "$WMS_PID" 2>/dev/null || true
    exit 1
  fi
  echo "$body"
}

do_get() {
  local url="$1" label="$2"
  local resp code body
  resp=$(curl -s --max-time 15 -w "\n%{http_code}" -X GET "$url" \
    -H "accept: */*" -H "${AUTH}" -H "X-Tenant-Code: ${TENANT_CODE}")
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')
  if [ "$code" != "200" ]; then
    echo "FAIL: $label (HTTP $code)"
    echo "BODY: $(echo "$body" | head -c 300)"
    kill "$WMS_PID" 2>/dev/null || true
    exit 1
  fi
  echo "$body"
}

extract() { echo "$1" | jq -r "$2 // .data.$2 // .id // empty" 2>/dev/null; }

# ─── Step 2: Facility ─────────────────────────────────────────────────
echo "--- Step 2: Create Facility ---"
BODY=$(do_post "${WMS_URL}/web/facilities" '{"facility_name":"E2E WH","facility_code":"E2E-WH-01","facility_type":"WAREHOUSE"}' "Facility")
FACILITY_ID=$(extract "$BODY" '.facility_id')
echo "PASS: Facility ID=$FACILITY_ID"

# ─── Step 3: UOM ──────────────────────────────────────────────────────
echo "--- Step 3: Create UOM ---"
BODY=$(do_post "${WMS_URL}/web/units-of-measure" '{"uom_name":"Each","uom_code":"EA"}' "UOM")
UOM_ID=$(extract "$BODY" '.uom_id')
echo "PASS: UOM ID=$UOM_ID"

# ─── Step 4: Category ─────────────────────────────────────────────────
echo "--- Step 4: Create Category ---"
BODY=$(do_post "${WMS_URL}/web/product-categories" '{"category_name":"E2E Cat","category_code":"E2E-CAT-01"}' "Category")
CATEGORY_ID=$(extract "$BODY" '.category_id')
echo "PASS: Category ID=$CATEGORY_ID"

# ─── Step 5: Client ───────────────────────────────────────────────────
echo "--- Step 5: Create Client ---"
BODY=$(do_post "${WMS_URL}/web/clients" '{"client_code":"E2E-CLIENT-01","client_name":"E2E Test Client"}' "Client")
CLIENT_ID=$(extract "$BODY" '.client_id')
echo "PASS: Client ID=$CLIENT_ID"

# ─── Step 6: Product ──────────────────────────────────────────────────
echo "--- Step 6: Create Product ---"
BODY=$(do_post "${WMS_URL}/web/products" '{"product_code":"E2E-PROD-01","product_name":"E2E Test Widget","category_id":'$CATEGORY_ID',"primary_uom_id":'$UOM_ID'}' "Product")
PRODUCT_ID=$(extract "$BODY" '.product_id')
echo "PASS: Product ID=$PRODUCT_ID"

# ─── Step 7: Fetch Product ────────────────────────────────────────────
echo "--- Step 7: Fetch Product ---"
BODY=$(do_get "${WMS_URL}/web/products/${PRODUCT_ID}" "Fetch Product")
NAME=$(extract "$BODY" '.product_name')
echo "PASS: Product name=$NAME"

# ─── Step 8: Fetch Client ─────────────────────────────────────────────
echo "--- Step 8: Fetch Client ---"
BODY=$(do_get "${WMS_URL}/web/clients/${CLIENT_ID}" "Fetch Client")
NAME=$(extract "$BODY" '.client_name')
echo "PASS: Client name=$NAME"

# ─── Step 9: Brand ────────────────────────────────────────────────────
echo "--- Step 9: Create Brand ---"
BODY=$(do_post "${WMS_URL}/web/product-brands" '{"brand_name":"E2E Brand","brand_code":"E2E-BR-01"}' "Brand")
BRAND_ID=$(extract "$BODY" '.brand_id')
echo "PASS: Brand ID=$BRAND_ID"

# ─── Step 10: Zone ───────────────────────────────────────────────────
echo "--- Step 10: Create Zone ---"
BODY=$(do_post "${WMS_URL}/web/zones" '{"facility_id":'$FACILITY_ID',"zone_name":"E2E Rack","zone_code":"E2E-ZN-RK","zone_type":"RACK"}' "Zone")
ZONE_ID=$(extract "$BODY" '.zone_id')
echo "PASS: Zone ID=$ZONE_ID"

# ─── Step 11: Location ────────────────────────────────────────────────
echo "--- Step 11: Create Location ---"
BODY=$(do_post "${WMS_URL}/web/locations" '{"facility_id":'$FACILITY_ID',"location_name":"E2E-A-01","location_code":"E2E-A-01","location_type":"EACH","zone_id":'$ZONE_ID'}' "Location")
LOCATION_ID=$(extract "$BODY" '.location_id')
echo "PASS: Location ID=$LOCATION_ID"

# ─── Step 12: Fetch Location ─────────────────────────────────────────
echo "--- Step 12: Fetch Location ---"
BODY=$(do_get "${WMS_URL}/web/locations/${LOCATION_ID}" "Fetch Location")
NAME=$(extract "$BODY" '.location_name')
echo "PASS: Location name=$NAME"

# ─── Step 13: Customer ────────────────────────────────────────────────
echo "--- Step 13: Create Customer ---"
BODY=$(do_post "${WMS_URL}/web/customers" '{"customer_code":"E2E-CUST-01","customer_name":"E2E Customer"}' "Customer")
CUSTOMER_ID=$(extract "$BODY" '.customer_id')
echo "PASS: Customer ID=$CUSTOMER_ID"

# ─── Step 14: Vendor ──────────────────────────────────────────────────
echo "--- Step 14: Create Vendor ---"
BODY=$(do_post "${WMS_URL}/web/vendors" '{"vendor_code":"E2E-VEND-01","vendor_name":"E2E Vendor"}' "Vendor")
VENDOR_ID=$(extract "$BODY" '.vendor_id')
echo "PASS: Vendor ID=$VENDOR_ID"

# ─── Step 15: Carrier ─────────────────────────────────────────────────
echo "--- Step 15: Create Carrier ---"
BODY=$(do_post "${WMS_URL}/web/carriers" '{"carrier_code":"E2E-CARR-01","carrier_name":"E2E Carrier"}' "Carrier")
CARRIER_ID=$(extract "$BODY" '.carrier_id')
echo "PASS: Carrier ID=$CARRIER_ID"

# ─── Step 16: Product-Client Assignment ───────────────────────────────
echo "--- Step 16: Product-Client Assignment ---"
BODY=$(do_post "${WMS_URL}/web/product-client-assignments" '{"product_id":'$PRODUCT_ID',"client_id":'$CLIENT_ID',"facility_id":'$FACILITY_ID'}' "Assignment")
PCA_ID=$(echo "$BODY" | jq -r '.id // .data.id // empty')
echo "PASS: Assignment ID=$PCA_ID"

# ─── Done ─────────────────────────────────────────────────────────────
echo ""
echo "========== ALL TESTS PASSED =========="
echo "Steps: 16  Failed: 0"

kill "$WMS_PID" 2>/dev/null || true
echo "Server stopped"
