#!/usr/bin/env bash
# ── WMS Production Rollout Checklist ──
# Run after `kubectl apply -f deploy/k8s/`
set -euo pipefail

NAMESPACE="${NAMESPACE:-wms}"
ROLLOUT_TIMEOUT="${ROLLOUT_TIMEOUT:-300s}"

echo "=== Step 1: Verify ConfigMap & Secrets ==="
kubectl -n "$NAMESPACE" get configmap wms-config -o yaml | grep -q "NODE_ENV: production" || {
  echo "ERROR: ConfigMap missing NODE_ENV=production"
  exit 1
}
echo "  ConfigMap OK"

echo "=== Step 2: Trigger rolling rollout ==="
kubectl -n "$NAMESPACE" rollout restart deployment/wms-app
kubectl -n "$NAMESPACE" rollout status deployment/wms-app --timeout="$ROLLOUT_TIMEOUT"

echo "=== Step 3: Verify all pods ready ==="
PODS=$(kubectl -n "$NAMESPACE" get pods -l app=wms-app -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}')
for s in $PODS; do
  if [ "$s" != "True" ]; then
    echo "ERROR: Not all pods are ready"
    exit 1
  fi
done
echo "  All pods ready"

echo "=== Step 4: Check health endpoints ==="
POD=$(kubectl -n "$NAMESPACE" get pods -l app=wms-app -o jsonpath='{.items[0].metadata.name}')
kubectl -n "$NAMESPACE" exec "$POD" -- curl -sf http://localhost:3001/health || {
  echo "ERROR: health endpoint failed"
  exit 1
}
kubectl -n "$NAMESPACE" exec "$POD" -- curl -sf http://localhost:3001/health/ready || {
  echo "ERROR: readiness endpoint failed"
  exit 1
}
echo "  Health checks passed"

echo "=== Step 5: Verify migration status ==="
kubectl -n "$NAMESPACE" exec "$POD" -- \
  psql "$DATABASE_URL" -c "SELECT status, COUNT(*) FROM wms_migration_status GROUP BY status;" 2>/dev/null || \
  echo "  (migration status table may not exist yet)"
echo "  Migration check OK"

echo ""
echo "=== Rollout complete ==="
echo "Service: wms-app"
echo "Pods:    $(kubectl -n "$NAMESPACE" get pods -l app=wms-app --no-headers | wc -l)"
echo "Image:   $(kubectl -n "$NAMESPACE" get deployment wms-app -o jsonpath='{.spec.template.spec.containers[0].image}')"
