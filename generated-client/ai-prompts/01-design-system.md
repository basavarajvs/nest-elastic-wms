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
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-gray-50">
      <TableCell>Data</TableCell>
    </TableRow>
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
