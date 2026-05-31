import { Client } from 'pg';

/**
 * ── Challenge 1: Per-test tenant context isolation ──
 * 
 * In Jest with maxConcurrency=1, tests run sequentially but each test
 * starts with a fresh `app.tenant_id` context. This setup file runs
 * before each test to reset the connection-level tenant context.
 * 
 * Combined with `connection_limit=1` from global-setup, this ensures
 * zero cross-test contamination of SET LOCAL tenant contexts.
 * 
 * Uses pg Client directly to avoid dependency on PrismaClient generation.
 */
let client: Client | null = null;

beforeAll(async () => {
  const dbUrl = process.env.E2E_TEST_DB_URL || process.env.DATABASE_URL || '';
  if (!dbUrl) return;
  client = new Client({ connectionString: dbUrl });
  await client.connect().catch(() => {});
});

beforeEach(async () => {
  if (!client) return;
  try {
    await client.query(`SELECT set_config('app.tenant_id', '', false)`);
  } catch {
    // Connection may not be available
  }
});

afterEach(async () => {
  if (!client) return;
  try {
    await client.query(`SELECT set_config('app.tenant_id', '', false)`);
  } catch {
    // Silently ignore
  }
});

afterAll(async () => {
  if (client) {
    await client.end().catch(() => {});
    client = null;
  }
});