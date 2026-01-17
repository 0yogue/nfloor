# Commit Message

## Suggested Commit

```
feat(dashboard): implement RBAC-aware metrics with adapter pattern

- Add Lead model to Prisma schema with LeadStatus enum
- Implement adapter pattern for data source abstraction (mock/prisma)
- Create RBAC-aware resolvers for each access level:
  - Director: views superintendents → managers → sellers (fallback)
  - Superintendent: views managers in managed areas
  - Manager: views sellers in team
  - Seller: views own metrics only
- Add /api/dashboard/metrics endpoint with date filtering
- Create MetricsCards and SubordinatesTable components
- Refactor dashboard page to use dynamic API data
- Add database setup scripts (setup-db.sh, setup-db.sql)
- Add mock data generator for development/demo

BREAKING CHANGE: Dashboard now requires API call for metrics

Files added:
- src/lib/dashboard/* (adapter, resolvers, types, mock-data)
- src/components/dashboard/metrics-cards.tsx
- src/components/dashboard/subordinates-table.tsx
- src/app/api/dashboard/metrics/route.ts
- scripts/setup-db.sh, scripts/setup-db.sql
- CHANGELOG.md, PROJECT_STATUS.md

Files modified:
- prisma/schema.prisma (added Lead model)
- src/app/(dashboard)/dashboard/page.tsx
```

---

## Git Commands

```bash
# Stage all changes
git add .

# Commit with conventional commit message
git commit -m "feat(dashboard): implement RBAC-aware metrics with adapter pattern

- Add Lead model to Prisma schema with LeadStatus enum
- Implement adapter pattern for data source abstraction (mock/prisma)
- Create RBAC-aware resolvers for each access level
- Add /api/dashboard/metrics endpoint with date filtering
- Create MetricsCards and SubordinatesTable components
- Refactor dashboard page to use dynamic API data
- Add database setup scripts and mock data generator

BREAKING CHANGE: Dashboard now requires API call for metrics"

# Push to remote
git push origin main
```

---

## Alternative: Semantic Commits (Split)

If you prefer smaller, focused commits:

```bash
# 1. Database schema
git add prisma/schema.prisma scripts/
git commit -m "feat(db): add Lead model and setup scripts"

# 2. Dashboard adapter infrastructure
git add src/lib/dashboard/adapter.ts src/lib/dashboard/types.ts src/lib/dashboard/metrics.ts src/lib/dashboard/index.ts
git commit -m "feat(dashboard): add data source adapter interface"

# 3. Mock data implementation
git add src/lib/dashboard/adapter-mock.ts src/lib/dashboard/mock-data.ts
git commit -m "feat(dashboard): add mock data source for development"

# 4. Prisma data implementation
git add src/lib/dashboard/adapter-prisma.ts
git commit -m "feat(dashboard): add Prisma data source implementation"

# 5. Resolvers
git add src/lib/dashboard/resolvers/
git commit -m "feat(dashboard): add RBAC-aware metric resolvers"

# 6. API endpoint
git add src/app/api/dashboard/metrics/
git commit -m "feat(api): add /api/dashboard/metrics endpoint"

# 7. UI components
git add src/components/dashboard/metrics-cards.tsx src/components/dashboard/subordinates-table.tsx
git commit -m "feat(ui): add MetricsCards and SubordinatesTable components"

# 8. Dashboard page update
git add src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "refactor(dashboard): use dynamic API metrics"

# 9. Documentation
git add CHANGELOG.md PROJECT_STATUS.md COMMIT_MESSAGE.md
git commit -m "docs: add changelog and project status documentation"
```

---

## Tags

```bash
# Tag this release
git tag -a v0.2.0 -m "Dashboard RBAC metrics with adapter pattern"
git push origin v0.2.0
```
