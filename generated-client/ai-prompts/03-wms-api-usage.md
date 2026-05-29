# wms-api API Usage

## Generated Files
- **API Client**: `./generated-client/lib/api/wms-api`
- **Types**: `./generated-client/lib/types/wms-api/`

## Available Hooks
Check the generated file at `./generated-client/lib/api/wms-api` for all available hooks.

### Typical Pattern
```typescript
import { useGetAllTenants, useCreateTenant } from './generated-client/lib/api/wms-api';

const { data, isLoading, error } = useGetAllTenants();
const createMutation = useCreateTenant();

createMutation.mutate(newData, {
  onSuccess: () => { toast({ title: 'Success!' }); },
  onError: (error) => { toast({ title: 'Error', variant: 'destructive' }); },
});
```
