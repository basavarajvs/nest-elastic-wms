import { execSync } from 'child_process';
import { Client } from 'pg';

const E2E_TEST_DB_URL = process.env.E2E_TEST_DB_URL || '';

export default async function globalSetup(): Promise<void> {
  if (!E2E_TEST_DB_URL) {
    if (process.env.CI) {
      throw new Error('E2E_TEST_DB_URL is required in CI');
    }
    console.log('[global-setup] No E2E_TEST_DB_URL set — skipping DB setup. Use a dedicated test schema/DB.');
    return;
  }

  console.log('[global-setup] Setting up E2E test database...');

  // Parse URL to extract schema
  const schemaMatch = E2E_TEST_DB_URL.match(/\?schema=([a-zA-Z0-9_]+)/);
  const testSchema = schemaMatch ? schemaMatch[1] : 'e2e_test';

  // ── Challenge 1: Connection pool isolation for E2E ──
  // Inject pool_timeout and connection_limit into E2E_TEST_DB_URL to prevent
  // SET LOCAL tenant context leaks between Jest test runners.
  // Each test runner gets its own connection, preventing cross-test contamination.
  const poolIsolatedUrl = E2E_TEST_DB_URL.includes('?')
    ? E2E_TEST_DB_URL + '&pool_timeout=1000&connection_limit=1'
    : E2E_TEST_DB_URL + '?pool_timeout=1000&connection_limit=1';

  // Override DATABASE_URL for all subsequent Prisma connections
  process.env.DATABASE_URL = poolIsolatedUrl;
  process.env.E2E_TEST_DB_URL = poolIsolatedUrl;

  // Create schema if not exists
  const client = new Client({ connectionString: poolIsolatedUrl });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${testSchema}"`);
  await client.end();

  // Run Prisma migrations on the test schema
  const env = { ...process.env, DATABASE_URL: poolIsolatedUrl };
  execSync('pnpx prisma migrate deploy', { env, cwd: process.cwd(), stdio: 'inherit' });

  console.log('[global-setup] E2E test database ready.');
  console.log(`[global-setup] Connection pool isolation: pool_timeout=1000&connection_limit=1`);
}
