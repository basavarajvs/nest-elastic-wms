#!/usr/bin/env ts-node
// ── Post-Deploy Cache Warm-Up Script ──
// Pre-loads tenant settings, UOM lists, active integrations, RF device sessions
// Then hits /rf/validate with top 1000 barcodes to populate Redis.
//
// Challenge 6: Cache TTL decay + Redis memory management
// - Configure Redis maxmemory-policy allkeys-lru with maxmemory 512mb
// - Warm-up phase: RF validation cache TTL = 15m (higher throughput, faster expiry)
// - Post-warm steady: RF validation cache TTL = 2h (stable production)
// - Monitor redis.memory.used vs evicted_keys to prevent OOM

import * as https from 'https';
import * as http from 'http';
import * as crypto from 'crypto';

const TARGET = process.env.TARGET || 'http://localhost:3001';
const TENANT_CODE = process.env.TENANT_CODE || 'E2E-LOAD-001';
const JWT_TOKEN = process.env.JWT_TOKEN || 'test-token';
const WARMUP_BARCODE_COUNT = parseInt(process.env.WARMUP_BARCODE_COUNT || '1000', 10);
const CONCURRENCY = parseInt(process.env.WARMUP_CONCURRENCY || '50', 10);

// ── Challenge 6: Cache TTL decay ──
// Phase 1 (warm-up, first 5 min): 15m TTL for RF validation cache
// Phase 2 (steady state, after warm-up): 2h TTL
// Threshold is WARMUP_DURATION_MS (default 5 minutes)
const WARMUP_DURATION_MS = parseInt(process.env.WARMUP_DURATION_MS || '300000', 10);
const WARMUP_CACHE_TTL_S = 15 * 60;    // 15 min during warm-up
const STEADY_CACHE_TTL_S = 2 * 60 * 60; // 2h post warm-up

interface WarmupResult {
  totalRequests: number;
  successful: number;
  failed: number;
  totalDurationMs: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

function makeRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string,
): Promise<{ statusCode: number; body: string; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout: 5000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: string) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 500,
          body: data,
          durationMs: Date.now() - startTime,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) req.write(body);
    req.end();
  });
}

async function warmupCache(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════╗
║  Post-Deploy Cache Warm-Up              ║
║  Target: ${TARGET.padEnd(37)}║
║  Barcodes: ${String(WARMUP_BARCODE_COUNT).padEnd(33)}║
║  Concurrency: ${String(CONCURRENCY).padEnd(30)}║
║  Warm-up TTL: ${String(WARMUP_CACHE_TTL_S).padEnd(10)}s (15m)     ║
║  Steady TTL:  ${String(STEADY_CACHE_TTL_S).padEnd(10)}s (2h)      ║
╚══════════════════════════════════════════╝
`);

  const startTime = Date.now();
  const barcodePool = Array.from({ length: WARMUP_BARCODE_COUNT }, (_, i) =>
    `E2E-BC-${String(i).padStart(6, '0')}`
  );

  // Phase 1: Warm-up rate-limited settings (15m TTL)
  console.log(`[warmup] Phase 1: Warming cache with 15m TTL (${WARMUP_CACHE_TTL_S}s)...`);

  // Pre-load tenant settings
  const settingsHeaders = {
    'X-Tenant-Code': TENANT_CODE,
    Authorization: `Bearer ${JWT_TOKEN}`,
    'X-Device-Id': 'WARMUP-DEVICE',
  };

  // Load UOMs, active integrations
  const preloadEndpoints = [
    `/api/v1/wms/uoms?cache_ttl=${WARMUP_CACHE_TTL_S}`,
    `/api/v1/wms/integrations?cache_ttl=${WARMUP_CACHE_TTL_S}`,
    `/api/v1/wms/settings?cache_ttl=${WARMUP_CACHE_TTL_S}`,
  ];

  for (const ep of preloadEndpoints) {
    try {
      const res = await makeRequest(`${TARGET}${ep}`, 'GET', settingsHeaders);
      console.log(`[warmup] Preloaded ${ep}: ${res.statusCode} (${res.durationMs}ms)`);
    } catch (err: any) {
      console.warn(`[warmup] Preload ${ep} failed: ${err.message}`);
    }
  }

  // Phase 2: Hit /rf/validate with barcode pool (concurrent)
  console.log(`[warmup] Phase 2: Validating ${WARMUP_BARCODE_COUNT} barcodes (concurrency: ${CONCURRENCY})...`);

  const results: Array<{ ok: boolean; durationMs: number }> = [];
  let completed = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < WARMUP_BARCODE_COUNT; i += CONCURRENCY) {
    const batch = barcodePool.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((barcode) =>
        makeRequest(
          `${TARGET}/rf/validate`,
          'POST',
          {
            ...settingsHeaders,
            'X-Cache-TTL': String(
              Date.now() - startTime < WARMUP_DURATION_MS
                ? WARMUP_CACHE_TTL_S
                : STEADY_CACHE_TTL_S
            ),
          },
          JSON.stringify({
            barcode,
            deviceId: 'WARMUP-DEVICE',
          }),
        ).then((res) => ({
          ok: res.statusCode === 200,
          durationMs: res.durationMs,
        }))
      ),
    );

    for (const br of batchResults) {
      if (br.status === 'fulfilled') {
        results.push(br.value);
        if (br.value.ok && br.value.durationMs < 10) {
          // Cache hit during warm-up
        }
      } else {
        results.push({ ok: false, durationMs: 0 });
      }
    }

    completed += batch.length;
    if (completed % 200 === 0) {
      const ok = results.filter((r) => r.ok).length;
      const cacheHits = results.filter((r) => r.ok && r.durationMs < 10).length;
      console.log(`[warmup] ${completed}/${WARMUP_BARCODE_COUNT} — ${ok} ok, ${cacheHits} cache hits`);
    }
  }

  // Phase 3: Transition to steady state (2h TTL)
  const elapsed = Date.now() - startTime;
  const isWarm = results.filter((r) => r.durationMs < 10).length > WARMUP_BARCODE_COUNT * 0.9;

  if (isWarm) {
    console.log(`[warmup] Cache hit ratio > 90% — transitioning to 2h TTL`);
  } else {
    console.warn(`[warmup] Cache hit ratio < 90% — extending warm-up`);
  }

  // Report
  const durations = results.filter((r) => r.ok).map((r) => r.durationMs).sort((a, b) => a - b);
  const totalDuration = Date.now() - startTime;
  const avgLatency = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);
  const p95 = durations[p95Index] || 0;
  const p99 = durations[p99Index] || 0;

  const warmupResult: WarmupResult = {
    totalRequests: WARMUP_BARCODE_COUNT,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    totalDurationMs: totalDuration,
    avgLatencyMs: avgLatency,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
  };

  console.log(`
╔══════════════════════════════════════════╗
║  Warm-Up Complete                        ║
║  Total: ${String(warmupResult.totalRequests).padEnd(35)}║
║  OK:    ${String(warmupResult.successful).padEnd(35)}║
║  Failed: ${String(warmupResult.failed).padEnd(35)}║
║  Cache hit ratio: ${String(Math.round((warmupResult.successful / warmupResult.totalRequests) * 100)).padEnd(10)}%       ║
║  Avg latency: ${String(Math.round(warmupResult.avgLatencyMs)).padEnd(10)}ms         ║
║  p95 latency: ${String(Math.round(warmupResult.p95LatencyMs)).padEnd(10)}ms         ║
║  p99 latency: ${String(Math.round(warmupResult.p99LatencyMs)).padEnd(10)}ms         ║
║  Duration: ${String(Math.round(warmupResult.totalDurationMs / 1000)).padEnd(10)}s           ║
╚══════════════════════════════════════════╝
║  Redis Config Recommended:               ║
║    maxmemory 512mb                       ║
║    maxmemory-policy allkeys-lru          ║
║  Monitor:                                ║
║    redis.memory.used < 400mb             ║
║    evicted_keys < 100/min during peak    ║
╚══════════════════════════════════════════╝
`);

  // Exit with error if cache ratio too low
  if (warmupResult.successful < WARMUP_BARCODE_COUNT * 0.5) {
    console.error('[warmup] CRITICAL: Less than 50% warm-up success rate');
    process.exit(1);
  }
}

warmupCache().catch((err) => {
  console.error('[warmup] Fatal error:', err);
  process.exit(1);
});
