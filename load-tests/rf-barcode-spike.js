import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('rf_errors');
const scanDuration = new Trend('rf_scan_duration');
const redisHitRatio = new Rate('redis_cache_hit');

// ── Challenge 2: local-load-agent patterns ──
// Run with: k6 run load-tests/rf-barcode-spike.js --out json=load-results.json
// For warehouse Wi-Fi simulation:
//   docker compose -f load-tests/docker-compose.load.yaml run --rm k6
// Uses network_mode: host to bypass Docker NAT overhead.
// Traffic control (tc) adds 20-100ms jitter to simulate warehouse Wi-Fi.

const TARGET = __ENV.TARGET || 'http://localhost:3001';
const DEVICE_COUNT = 200;
const DURATION = __ENV.DURATION || '5m';
const WARMUP_DURATION = '30s';

// Pre-generated barcode pool
const BARCODE_POOL = Array.from({ length: 500 }, (_, i) => `E2E-BC-${String(i).padStart(6, '0')}`);

function generateHeaders(deviceIndex) {
  const deviceId = `RF-DEVICE-${String(deviceIndex).padStart(4, '0')}`;
  const sessionId = `SES-${deviceId}-${Date.now()}`;
  return {
    'Content-Type': 'application/json',
    'X-Tenant-Code': 'E2E-LOAD-001',
    'X-Device-Id': deviceId,
    'X-Session-Id': sessionId,
    Authorization: `Bearer ${__ENV.JWT_TOKEN || 'test-token'}`,
  };
}

export let options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up
    { duration: '3m', target: 200 },  // Peak
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<50', 'p(99)<100'],  // Sub-50ms p95, sub-100ms p99
    http_req_failed: ['rate<0.01'],                   // <1% error rate
    rf_errors: ['rate<0.01'],
    http_req_waiting: ['p(95)<45'],                   // Network wait (excludes DNS/TCP)
  },
  // Parse http_req_duration vs http_req_blocked to isolate app bottlenecks
  // http_req_blocked > 5ms = network/cloud throttling, not app bottleneck
};

export default function () {
  const deviceIndex = Math.floor(Math.random() * DEVICE_COUNT);
  const headers = generateHeaders(deviceIndex);
  const barcode = BARCODE_POOL[Math.floor(Math.random() * BARCODE_POOL.length)];

  // Warm-up phase: measure cache hit ratio
  const startTime = Date.now();

  const res = http.post(
    `${TARGET}/rf/validate`,
    JSON.stringify({ barcode, deviceId: headers['X-Device-Id'] }),
    { headers },
  );

  const duration = Date.now() - startTime;
  scanDuration.add(duration);

  // Parse response to determine cache hit
  let body = {};
  try { body = JSON.parse(res.body); } catch {}

  // Redis cache hit = response time < 10ms (no DB query needed)
  if (duration < 10) {
    redisHitRatio.add(1);
  }

  // Track errors
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response body has result': (r) => r.body.includes('valid') || r.body.includes('result'),
    'response time < 50ms': (r) => duration < 50,
  });

  errorRate.add(!success);

  // Stagger requests to avoid thundering herd
  sleep(Math.random() * 0.1);
}

export function handleSummary(data) {
  return {
    'load-results.json': JSON.stringify(data, null, 2),
    'load-results.csv': convertToCSV(data),
  };
}

function convertToCSV(data) {
  const lines = ['metric,value'];
  for (const [metric, values] of Object.entries(data.metrics)) {
    if (values.values) {
      lines.push(`${metric},${JSON.stringify(values.values)}`);
    }
  }
  return lines.join('\n');
}
