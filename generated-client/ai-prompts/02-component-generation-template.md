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

1. Uses the useGetAllTenants hook from @/lib/api/wms-saas-core-api
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
