#!/bin/bash

# ============================================================================
# WMS API  — OpenAPI Client Generator (adapted for new-wmsbackend)
# Generates TypeScript client code from the NestJS Swagger/OpenAPI spec
# Port: 3002 | Swagger: /api/docs-json | API prefix: /api/v1/wms
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   WMS API  — OpenAPI Client Generator (new-wmsbackend)       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Service config
SERVICE_NAME="wms-api"
SERVICE_PORT=3002
HEALTH_ENDPOINT="http://localhost:$SERVICE_PORT/api/v1/wms/health"
SWAGGER_JSON_URL="http://localhost:$SERVICE_PORT/api/docs-json"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
cd "$PROJECT_DIR"

GENERATED_DIR="./generated-client"
SPEC_OUTPUT_DIR="$GENERATED_DIR/openapi-specs"
API_DIR="$GENERATED_DIR/lib/api"
TYPES_DIR="$GENERATED_DIR/lib/types"
HTTP_DIR="$GENERATED_DIR/lib/http"
HOOKS_DIR="$GENERATED_DIR/hooks"
AI_PROMPTS_DIR="$GENERATED_DIR/ai-prompts"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error()   { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info()    { echo -e "${CYAN}ℹ $1${NC}"; }
print_step()    { echo -e "\n${BLUE}▶ $1${NC}"; }

# ── Prerequisites ──
check_node() {
    if ! command -v node &>/dev/null; then print_error "Node.js not installed"; exit 1; fi
    print_success "Node.js $(node -v) detected"
}

check_pnpm() {
    if command -v pnpm &>/dev/null; then
        PKG_CMD="pnpm"; PKG_INSTALL="pnpm add"
        print_success "pnpm $(pnpm -v) detected"
    elif command -v npm &>/dev/null; then
        PKG_CMD="npm"; PKG_INSTALL="npm install"
        print_warning "npm detected (project uses pnpm)"
    else
        print_error "No package manager found"; exit 1
    fi
}

# ── Server Management ──
start_server() {
    print_step "Starting API Server"
    echo -n "  Checking server on port $SERVICE_PORT... "

    if curl -sf --connect-timeout 2 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
        print_success "Already running"
        return 0
    fi

    print_info "Starting NestJS server..."
    if [ ! -f "dist/main.js" ]; then
        print_info "Building project first..."
        npx nest build
    fi

    node dist/main.js &
    SERVER_PID=$!

    echo -n "  Waiting for server (port $SERVICE_PORT)"
    for i in $(seq 1 30); do
        sleep 2
        if curl -sf --connect-timeout 2 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
            print_success "Started (PID $SERVER_PID)"
            return 0
        fi
        echo -n "."
    done
    print_error "Server did not start within 60s"
    exit 1
}

stop_server() {
    if [ -n "$SERVER_PID" ]; then
        echo ""
        print_info "Stopping server (PID $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
        print_success "Server stopped"
    fi
}

# ── Fetch OpenAPI Spec ──
fetch_openapi_spec() {
    print_step "Fetching OpenAPI Specification"
    mkdir -p "$SPEC_OUTPUT_DIR"

    local output_file="$SPEC_OUTPUT_DIR/${SERVICE_NAME}.json"
    echo -n "  Fetching from $SWAGGER_JSON_URL... "

    if curl -sf "$SWAGGER_JSON_URL" -o "$output_file" 2>/dev/null && [[ -s "$output_file" ]]; then
        local paths=$(python3 -c "import json;d=json.load(open('$output_file'));print(len(d.get('paths',{})))")
        print_success "Downloaded ($paths paths)"
    else
        print_error "Failed to fetch OpenAPI spec"
        return 1
    fi
}

# ── Deduplicate Operation IDs ──
deduplicate_operation_ids() {
    print_step "Deduplicating Operation IDs"

    local spec_file="$SPEC_OUTPUT_DIR/${SERVICE_NAME}.json"
    node -e "
const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('$spec_file', 'utf8'));
const opIdCount = {};
for (const [p, methods] of Object.entries(spec.paths)) {
  for (const [method, details] of Object.entries(methods)) {
    const opId = details.operationId;
    if (!opId) continue;
    if (!opIdCount[opId]) opIdCount[opId] = [];
    opIdCount[opId].push({path: p, method});
  }
}
let dupCount = 0;
for (const [opId, endpoints] of Object.entries(opIdCount)) {
  if (endpoints.length > 1) {
    dupCount++;
    endpoints.slice(1).forEach((ep, i) => {
      spec.paths[ep.path][ep.method].operationId = opId + '_v' + (i + 2);
    });
  }
}
fs.writeFileSync('$spec_file', JSON.stringify(spec, null, 2));
console.log('  Duplicates resolved: ' + dupCount);
" && print_success "Deduplicated operation IDs"
}

# ── Orval Config + Generation ──
generate_orval_config() {
    local spec_file="$SPEC_OUTPUT_DIR/${SERVICE_NAME}.json"
    local config_file="./orval.${SERVICE_NAME}.config.cjs"

    cat > "$config_file" << 'CONFIGEOF'
module.exports = {
  'SERVICE_NAME': {
    input: {
      target: 'SPEC_FILE',
    },
    output: {
      mode: 'tags-split',
      target: 'API_DIR/SERVICE_NAME',
      schemas: 'TYPES_DIR/SERVICE_NAME',
      client: 'react-query',
      clean: true,
      prettier: true,
      propertySortOrder: 'Alphabetical',
      override: {
        header: () => ['/**', ' * Generated by orval v8.12.3 🍺', ' * Do not edit manually.', ' * WMS API', ' * Warehouse Management System API', ' * OpenAPI spec version: 1.0.0', ' */', ''].join('\n'),
        operationName: (operation, route, verb) => {
          const opId = operation.operationId;
          if (opId) return opId;
          const pathParts = route.split('/').filter(Boolean);
          const relevantParts = pathParts.filter(p => p !== 'api' && !/^v\d+$/.test(p) && !p.includes('{'));
          if (relevantParts.length === 0) return opId || 'unknownOperation';
          const hasIdParam = route.includes('{id}');
          const method = verb.toLowerCase();
          const resourcePascal = relevantParts.flatMap(p => p.split('-')).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
          if (method === 'get' && hasIdParam) return 'get' + resourcePascal + 'ById';
          if (method === 'get') return 'getAll' + resourcePascal;
          if (method === 'post' && route.endsWith('search')) return 'search' + resourcePascal;
          if (method === 'post') return 'create' + resourcePascal;
          if (method === 'put' || method === 'patch') return 'update' + resourcePascal;
          if (method === 'delete') return 'delete' + resourcePascal;
          return method + resourcePascal;
        },
        mutator: { path: 'HTTP_DIR/httpClient.ts', name: 'customInstance' },
        query: { useQuery: true, useMutation: true, signal: true },
      },
    },
  },
};
CONFIGEOF

    sed -i "s|SERVICE_NAME|${SERVICE_NAME}|g" "$config_file"
    sed -i "s|SPEC_FILE|${spec_file}|g" "$config_file"
    sed -i "s|API_DIR|${API_DIR}|g" "$config_file"
    sed -i "s|TYPES_DIR|${TYPES_DIR}|g" "$config_file"
    sed -i "s|HTTP_DIR|${HTTP_DIR}|g" "$config_file"

    echo "$config_file"
}

generate_api_client() {
    print_step "Generating TypeScript API Client"

    local config_file
    config_file=$(generate_orval_config)
    local log_file="/tmp/orval_${SERVICE_NAME}.log"

    if npx --yes orval --config "$config_file" > "$log_file" 2>&1; then
        print_success "API client generated"
        rm -f "$config_file" "$log_file"
    else
        print_error "Generation failed"
        print_warning "Orval output:"
        cat "$log_file"
        rm -f "$config_file"
        return 1
    fi
}

# ── HTTP Client Setup (frontend reference) ──
create_http_client() {
    print_step "Creating HTTP Client Configuration"

    mkdir -p "$HTTP_DIR"

    cat > "$HTTP_DIR/httpClient.ts" << 'EOF'
import Axios, { AxiosRequestConfig, AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: `${BASE_URL}/api/v1/wms`,
  headers: { 'Content-Type': 'application/json' },
});

AXIOS_INSTANCE.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const tenantCode = localStorage.getItem('tenant_code');
    if (tenantCode) config.headers['X-Tenant-Code'] = tenantCode;
    return config;
  },
  (error) => Promise.reject(error),
);

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const promise = AXIOS_INSTANCE({ ...config, ...options }).then(({ data }) => data);
  return promise;
};

export default customInstance;
EOF

    print_success "Created httpClient.ts"

    cat > "$GENERATED_DIR/lib/queryClient.ts" << 'EOF'
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});
EOF

    print_success "Created queryClient.ts"
}

# ── AI Prompts ──
generate_ai_prompts() {
    print_step "Generating AI Prompt Templates"

    mkdir -p "$AI_PROMPTS_DIR"

    cat > "$AI_PROMPTS_DIR/00-master-context.md" << EOF
# WMS API — API Client Context

## Project Structure
\`\`\`
generated-client/
├── lib/
│   ├── api/              # Generated API clients with React Query hooks
│   ├── types/            # Generated TypeScript types from OpenAPI
│   ├── http/             # HTTP client configuration
│   └── queryClient.ts    # React Query configuration
├── hooks/                # Custom React hooks
└── ai-prompts/           # AI prompt templates
\`\`\`

## API Details
- **Base URL**: \`http://localhost:3002/api/v1/wms\`
- **Auth**: JWT Bearer token or API Key
- **Tenant**: \`X-Tenant-Code\` header required for most endpoints

## Generated Files
- **API Client**: \`${API_DIR}/${SERVICE_NAME}\`
- **Types**: \`${TYPES_DIR}/${SERVICE_NAME}/*.ts\`
- **Hooks**: Auto-generated React Query hooks

## Usage
1. Import types: \`import { TypeName } from '@/lib/types/${SERVICE_NAME}'\`
2. Use hooks: \`import { useGetResource } from '@/lib/api/${SERVICE_NAME}'\`
3. HTTP client auto-includes auth token & tenant code
EOF

    print_success "Created 00-master-context.md"

    cat > "$AI_PROMPTS_DIR/01-design-system.md" << 'EOF'
# Design System for shadcn/ui Components

## Colors
- Primary: `blue-600` (#2563eb)
- Success: `green-600` (#16a34a)
- Warning: `amber-500` (#f59e0b)
- Danger: `red-600` (#dc2626)
- Background: `gray-50` (#f9fafb)
- Text Primary: `gray-900`
- Text Secondary: `gray-600`

## Component Patterns

### Cards
```tsx
<Card className="bg-white rounded-lg shadow-sm border border-gray-200">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg font-semibold">Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">{/* Content */}</CardContent>
</Card>
```

### Tables
```tsx
<Table>
  <TableHeader className="bg-gray-50">
    <TableRow><TableHead>Column</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-gray-50"><TableCell>Data</TableCell></TableRow>
  </TableBody>
</Table>
```

### Status Badges
```tsx
<Badge className="bg-green-100 text-green-800">Active</Badge>
<Badge className="bg-amber-100 text-amber-800">Pending</Badge>
<Badge className="bg-red-100 text-red-800">Inactive</Badge>
```

## Spacing
- Page padding: `p-6`
- Card padding: `p-6`
- Section gaps: `space-y-4` or `gap-4`

## Typography
- Page title: `text-2xl font-bold text-gray-900`
- Section title: `text-xl font-semibold text-gray-900`
- Card title: `text-lg font-semibold text-gray-900`
- Body text: `text-sm text-gray-600`
EOF

    print_success "Created 01-design-system.md"

    cat > "$AI_PROMPTS_DIR/02-component-generation-template.md" << 'EOF'
# Component Generation Template

## Template
```
Create a [FEATURE_NAME] component that:
1. Uses the [HOOK_NAME] hook from @/lib/api/[SERVICE_NAME]
2. Displays data in a [TABLE/CARD/LIST] format
3. Includes [SEARCH/FILTER/PAGINATION] functionality
4. Shows loading states with skeleton components
5. Handles errors with toast notifications
6. Follows the design system in ai-prompts/01-design-system.md

Requirements:
- Mobile responsive (use Tailwind breakpoints)
- Accessible (proper ARIA labels)
- TypeScript strict mode
- Includes proper error boundaries

File: src/components/features/[feature-name]/[ComponentName].tsx
```

## Example
```
Create a TenantList component that:
1. Uses the useGetAllTenants hook from @/lib/api/wms-api
2. Displays tenants in a table: Name, Code, Status, Created
3. Includes search by name and filter by status
4. Shows loading skeleton during fetch
5. Handles errors with toast

Requirements:
- Status badges: active (green), suspended (red), pending (amber)
- Click row to view tenant details
- Mobile: show cards instead of table

File: src/components/features/tenants/TenantList.tsx
```
EOF

    print_success "Created 02-component-generation-template.md"

    cat > "$AI_PROMPTS_DIR/03-wms-api-usage.md" << EOF
# ${SERVICE_NAME} API Usage

## Generated Files
- **API Client**: \`${API_DIR}/${SERVICE_NAME}\`
- **Types**: \`${TYPES_DIR}/${SERVICE_NAME}/\`

## Available Hooks
Check the generated file at \`${API_DIR}/${SERVICE_NAME}\` for all available hooks.

### Typical Pattern
\`\`\`typescript
import { useGetAllTenants, useCreateTenant } from '${API_DIR}/${SERVICE_NAME}';

const { data, isLoading, error } = useGetAllTenants();
const createMutation = useCreateTenant();

createMutation.mutate(newData, {
  onSuccess: () => { toast({ title: 'Success!' }); },
  onError: (error) => { toast({ title: 'Error', variant: 'destructive' }); },
});
\`\`\`
EOF

    print_success "Created 03-wms-api-usage.md"
}

# ── .env.example ──
create_env_example() {
    print_step "Creating .env.example"
    cat > "$GENERATED_DIR/.env.example" << 'EOF'
# WMS API Client Configuration
VITE_API_BASE_URL=http://localhost:3002
VITE_TENANT_CODE=your-tenant-code
EOF
    print_success "Created .env.example"
}

# ── Main ──
main() {
    print_step "Checking Prerequisites"
    check_node
    check_pnpm
    echo ""

    print_step "Setting Up Directory Structure"
    mkdir -p "$SPEC_OUTPUT_DIR" "$API_DIR" "$TYPES_DIR" "$HTTP_DIR" "$HOOKS_DIR" "$AI_PROMPTS_DIR"
    print_success "Directories created under $GENERATED_DIR"
    echo ""

    start_server
    echo ""
    fetch_openapi_spec
    echo ""
    deduplicate_operation_ids
    echo ""
    create_http_client
    echo ""
    generate_api_client
    echo ""
    generate_ai_prompts
    echo ""
    create_env_example
    echo ""
    stop_server

    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              ✓ Generation Complete!                           ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    print_success "OpenAPI specs: $SPEC_OUTPUT_DIR/${SERVICE_NAME}.json"
    print_success "Generated API clients: $API_DIR/$SERVICE_NAME"
    print_success "TypeScript types: $TYPES_DIR/$SERVICE_NAME"
    print_success "AI prompts: $AI_PROMPTS_DIR"
    echo ""
    print_info "Frontend consumption:"
    echo "  cp -r $GENERATED_DIR/* /path/to/frontend/src/"
    echo ""
    print_info "Install deps in frontend:"
    echo "  npm install axios @tanstack/react-query"
    echo ""
}

main "$@"
