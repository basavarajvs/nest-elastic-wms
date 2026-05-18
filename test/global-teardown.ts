import { Client } from 'pg';

const E2E_TEST_DB_URL = process.env.E2E_TEST_DB_URL || '';

export default async function globalTeardown(): Promise<void> {
  if (!E2E_TEST_DB_URL) {
    console.log('[global-teardown] No E2E_TEST_DB_URL set — skipping cleanup.');
    return;
  }

  const schemaMatch = E2E_TEST_DB_URL.match(/\?schema=([a-zA-Z0-9_]+)/);
  if (!schemaMatch) {
    console.log('[global-teardown] No schema parameter found — skipping cleanup.');
    return;
  }
  const testSchema = schemaMatch[1];

  const client = new Client({ connectionString: E2E_TEST_DB_URL });
  await client.connect();

  // Drop test schema with cascade to clean all tables
  await client.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`);
  await client.end();

  console.log(`[global-teardown] Dropped test schema "${testSchema}".`);
}
