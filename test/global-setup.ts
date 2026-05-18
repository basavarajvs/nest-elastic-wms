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

  // Create schema if not exists
  const client = new Client({ connectionString: E2E_TEST_DB_URL });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${testSchema}"`);
  await client.end();

  // Run Prisma migrations on the test schema
  const env = { ...process.env, DATABASE_URL: E2E_TEST_DB_URL };
  execSync('pnpx prisma migrate deploy', { env, cwd: process.cwd(), stdio: 'inherit' });

  console.log('[global-setup] E2E test database ready.');
}
