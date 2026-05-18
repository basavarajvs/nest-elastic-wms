import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const successRate = new Rate('pick_success');
const conflictRate = new Rate('pick_conflict');

const TARGET = __ENV.TARGET || 'http://localhost:3001';
const TOTAL_PICKS = 100;
const AVAILABLE_QTY = 50;  // Only 50 units available

// Fixed lot for concurrency testing
const LOT_PRODUCT_ID = 'E2E-CONCURRENT-LOT-001';
const LOT_LOCATION_ID = 'E2E-CONCURRENT-LOC-001';

export let options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    pick_success: ['value==50'],     // Exactly 50 must succeed (availableQty)
    pick_conflict: ['value==50'],    // 50 must get 409 (InsufficientStock)
  },
};

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Code': 'E2E-LOAD-001',
    'X-Device-Id': 'CONCURRENT-DEVICE',
    'X-Session-Id': `CONCURRENT-SES-${__VU}`,
    Authorization: `Bearer ${__ENV.JWT_TOKEN || 'test-token'}`,
  };

  const res = http.post(
    `${TARGET}/rf/outbound/pick/confirm`,
    JSON.stringify({
      productId: LOT_PRODUCT_ID,
      locationId: LOT_LOCATION_ID,
      quantity: 1,
      lotNumber: 'LOT-CONCURRENT-001',
    }),
    { headers },
  );

  if (res.status === 200) {
    successRate.add(1);
  } else if (res.status === 409) {
    conflictRate.add(1);
  }

  // Parse response to verify quantityAfter >= 0
  try {
    const body = JSON.parse(res.body);
    if (body.quantityAfter !== undefined) {
      check(res, {
        'quantity never drops below 0': () => body.quantityAfter >= 0,
      });
    }
  } catch {}

  sleep(0.05); // Stagger
}
