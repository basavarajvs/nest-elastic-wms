import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const importTriggerRate = new Rate('import_trigger_success');
const reportTriggerRate = new Rate('report_trigger_success');
const queueDepth = new Trend('bullmq_active_jobs');

const TARGET = __ENV.TARGET || 'http://localhost:3001';
const EXCEL_COUNT = 500;
const REPORT_COUNT = 200;

export let options = {
  stages: [
    { duration: '10s', target: 100 },  // Rapid ramp
    { duration: '20s', target: 500 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],  // Async accept, not processing time
    http_req_failed: ['rate<0.05'],
    bullmq_active_jobs: ['p(95)<20'],   // Active jobs should cap at concurrency*2
  },
};

// Pre-generate 500 Excel import payloads
const EXCEL_IMPORTS = Array.from({ length: EXCEL_COUNT }, (_, i) => ({
  fileName: `import_${i}.csv`,
  importType: 'products',
  rows: [
    { productCode: `LOAD-PROD-${i}`, name: `Load Test Product ${i}`, categoryCode: 'E2E-CAT' },
  ],
}));

const REPORTS = Array.from({ length: REPORT_COUNT }, (_, i) => ({
  reportType: 'inventory_summary',
  format: 'csv',
  filters: { facilityCode: 'E2E-LOAD-FAC' },
}));

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Code': 'E2E-LOAD-001',
    Authorization: `Bearer ${__ENV.JWT_TOKEN || 'test-token'}`,
  };

  // Alternate between Excel imports and report generation
  if (__ITER % 2 === 0 && __ITER < EXCEL_COUNT) {
    const importData = EXCEL_IMPORTS[__ITER % EXCEL_IMPORTS.length];
    const res = http.post(
      `${TARGET}/api/v1/wms/products/import`,
      JSON.stringify(importData),
      { headers },
    );
    importTriggerRate.add(res.status === 202);
  } else {
    const reportData = REPORTS[__ITER % REPORTS.length];
    const res = http.post(
      `${TARGET}/api/v1/wms/reports/generate`,
      JSON.stringify(reportData),
      { headers },
    );
    reportTriggerRate.add(res.status === 202);
  }

  sleep(0.02);
}
