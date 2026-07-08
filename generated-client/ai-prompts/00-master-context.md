# WMS API — API Client Context

## Project Structure
```
generated-client/
├── lib/
│   ├── api/              # Generated API clients with React Query hooks
│   ├── types/            # Generated TypeScript types from OpenAPI
│   ├── http/             # HTTP client configuration
│   └── queryClient.ts    # React Query configuration
├── hooks/                # Custom React hooks
└── ai-prompts/           # AI prompt templates
```

## API Details
- **Base URL**: `http://localhost:3002/api/v1/wms`
- **Auth**: JWT Bearer token or API Key
- **Tenant**: `X-Tenant-Code` header required for most endpoints

## Generated Files
- **API Client**: `./generated-client/lib/api/wms-api`
- **Types**: `./generated-client/lib/types/wms-api/*.ts`
- **Hooks**: Auto-generated React Query hooks

## Usage
1. Import types: `import { TypeName } from '@/lib/types/wms-api'`
2. Use hooks: `import { useGetResource } from '@/lib/api/wms-api'`
3. HTTP client auto-includes auth token & tenant code
