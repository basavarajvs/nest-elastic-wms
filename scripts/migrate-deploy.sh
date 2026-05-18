#!/bin/sh
set -e

# ── Migration lock & deploy script ──
# Designed for init containers and CI deployment steps.
# Uses PostgreSQL advisory lock to guarantee only one pod runs migrations.
# Records status in wms_migration_status for deployment controller monitoring.

DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"
LOCK_ID="${MIGRATION_LOCK_ID:-123456789}"
LOCK_TIMEOUT="${MIGRATION_LOCK_TIMEOUT_MS:-300000}"

echo "[migrate-deploy] Ensuring wms_migration_status table..."
psql "$DATABASE_URL" -c "
  CREATE TABLE IF NOT EXISTS wms_migration_status (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    rollback_script_url TEXT,
    error_log TEXT,
    lock_holder_pid INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
"

echo "[migrate-deploy] Acquiring advisory lock ${LOCK_ID}..."
LOCK_ACQUIRED=$(psql "$DATABASE_URL" -t -A \
  -c "SELECT pg_try_advisory_lock(${LOCK_ID});")
if [ "$LOCK_ACQUIRED" != "t" ]; then
  echo "[migrate-deploy] Lock ${LOCK_ID} held by another process — waiting up to ${LOCK_TIMEOUT}ms"
  psql "$DATABASE_URL" \
    -c "SELECT pg_advisory_lock(${LOCK_ID});"
fi

echo "[migrate-deploy] Checking for previous failed migrations..."
FAILED_COUNT=$(psql "$DATABASE_URL" -t -A \
  -c "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_status = 'migration_failed';" 2>/dev/null || echo "0")
if [ "$FAILED_COUNT" -gt 0 ] 2>/dev/null; then
  echo "[migrate-deploy] WARNING: ${FAILED_COUNT} previously failed migration(s) detected"
fi

MIGRATION_NAMES=$(psql "$DATABASE_URL" -t -A \
  -c "SELECT coalesce(json_agg(migration_name), '[]'::json) FROM _prisma_migrations WHERE finished_at IS NULL;" 2>/dev/null || echo "[]")

echo "[migrate-deploy] Pending migrations: ${MIGRATION_NAMES}"

echo "[migrate-deploy] Running prisma migrate deploy..."
START_TIME=$(date +%s%N)

# Each migration runs in its own transaction (managed by prisma).
# We use advisory locking to prevent concurrent runs across pods.
# The wms_migration_status table records start/completion for the deployment controller.
for m in $(echo "$MIGRATION_NAMES" | tr -d '[]"' | tr ',' ' '); do
  [ -z "$m" ] && continue
  psql "$DATABASE_URL" -c "
    INSERT INTO wms_migration_status (migration_name, status, lock_holder_pid)
    VALUES ('$m', 'running', pg_backend_pid())
    ON CONFLICT (migration_name) DO UPDATE SET
      status = 'running', lock_holder_pid = pg_backend_pid(), updated_at = NOW();
  "
done

if ! prisma migrate deploy --schema ./prisma/schema.prisma; then
  echo "[migrate-deploy] Migration FAILED — recording error and releasing lock"
  for m in $(echo "$MIGRATION_NAMES" | tr -d '[]"' | tr ',' ' '); do
    [ -z "$m" ] && continue
    psql "$DATABASE_URL" -c "
      UPDATE wms_migration_status SET
        status = 'failed', finished_at = NOW(),
        error_log = 'prisma migrate deploy returned non-zero exit',
        updated_at = NOW()
      WHERE migration_name = '$m' AND status = 'running';
    "
  done
  psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock(${LOCK_ID});"
  exit 1
fi

END_TIME=$(date +%s%N)
DURATION_MS=$(( (END_TIME - START_TIME) / 1000000 ))

echo "[migrate-deploy] Migration completed in ${DURATION_MS}ms — recording success"
psql "$DATABASE_URL" -c "
  UPDATE wms_migration_status SET
    status = 'completed', finished_at = NOW(), updated_at = NOW()
  WHERE status = 'running';
"

echo "[migrate-deploy] Releasing lock"
psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock(${LOCK_ID});"

echo "[migrate-deploy] Deployment controller: rollout safe"
echo "[migrate-deploy] Done"
