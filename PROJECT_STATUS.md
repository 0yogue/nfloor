# NFloor - Project Status & Context

> Last Updated: 2026-01-17
> Version: 0.2.0

## 📋 Project Overview

**NFloor** is a real estate management ecosystem with CRM, public website, and AI capabilities. The MVP focuses on **WhatsApp Analytics** for automating conversation analysis and providing actionable insights.

### Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM 7.x
- **Auth**: JWT with session persistence
- **UI**: shadcn/ui + Tailwind CSS
- **State**: React Context API

---

## 🏗️ Architecture

### RBAC Hierarchy
```
SUPER_ADMIN (full system access)
    └── DIRECTOR (company-wide access)
        └── SUPERINTENDENT (multi-area access)
            └── MANAGER (team access)
                └── SELLER (own data only)
```

### License Types
| License | Features |
|---------|----------|
| BASIC | Dashboard, basic filters |
| PROFESSIONAL | Custom filters, reports, multi-area |
| ENTERPRISE | API access, white-label, custom integrations |

### Data Visibility Matrix
- **SUPER_ADMIN**: All companies
- **DIRECTOR**: Own company, all areas
- **SUPERINTENDENT**: Managed areas only
- **MANAGER**: Own area + managed areas
- **SELLER**: Own data only

---

## 📁 Key Files & Directories

### Authentication (`src/lib/auth/`)
| File | Purpose |
|------|---------|
| `jwt.ts` | Token generation and verification |
| `session.ts` | Session management with cookies |
| `service.ts` | Login/logout logic |
| `password.ts` | Password hashing with bcrypt |

### RBAC (`src/lib/rbac/`)
| File | Purpose |
|------|---------|
| `permissions.ts` | Access level checks |
| `data-scope.ts` | Query filtering by role |
| `features.ts` | License-based feature gating (server) |
| `features.client.ts` | Feature gating (client-safe) |

### Dashboard (`src/lib/dashboard/`)
| File | Purpose |
|------|---------|
| `adapter.ts` | Data source interface |
| `adapter-mock.ts` | Mock JSON implementation |
| `adapter-prisma.ts` | Database implementation |
| `resolvers/` | Metrics resolvers per access level |
| `mock-data.ts` | Simulated data for development |

### Types (`src/types/`)
| File | Purpose |
|------|---------|
| `rbac.ts` | Client-safe enums (mirror Prisma enums) |

---

## 🗄️ Database Schema

### Models
```prisma
Company     → Root entity, has license_type
Area        → Organizational unit, belongs to Company
User        → RBAC user, belongs to Company and Area
AreaManager → Many-to-many for multi-area management
Session     → JWT session tracking
Lead        → Sales pipeline tracking (NEW in 0.2.0)
```

### Enums
```prisma
LicenseType: BASIC, PROFESSIONAL, ENTERPRISE
AccessLevel: SUPER_ADMIN, DIRECTOR, SUPERINTENDENT, MANAGER, SELLER
UserStatus:  ACTIVE, INACTIVE, SUSPENDED
LeadStatus:  NEW, QUALIFIED, CALLBACK, PROPOSAL, SOLD, LOST
```

---

## ⚙️ Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/nfloor"

# Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Dashboard (optional)
DASHBOARD_DATA_SOURCE="mock"  # or "prisma"
```

---

## 🚀 Current Features

### ✅ Completed (v0.2.0)
- [x] JWT Authentication with sessions
- [x] RBAC system with 5 access levels
- [x] License-based feature gating
- [x] Dashboard with dynamic metrics
- [x] Adapter pattern for mock/real data
- [x] RBAC-aware resolvers (Director, Superintendent, Manager, Seller)
- [x] Lead model and status tracking
- [x] Metrics cards and subordinates table
- [x] Date filters (today, 7d, 30d, custom)

### 🔄 In Progress
- [ ] Seed script for Lead data
- [ ] WhatsApp Analytics integration

### 📋 Planned Features
- [ ] Lead CRUD API
- [ ] Lead list page with filters
- [ ] Lead detail page
- [ ] WhatsApp message ingestion
- [ ] AI-powered lead scoring
- [ ] Daily priority feed
- [ ] Cold lead alerts
- [ ] Seller performance ranking
- [ ] Export reports (PDF/Excel)
- [ ] Real-time notifications

---

## 🧪 Test Credentials

| Role | Email | Password | What they see |
|------|-------|----------|---------------|
| Super Admin | admin@nfloor.com | 123456 | All companies |
| Director | diretor@demo.com | 123456 | All subordinates |
| Manager | gerente@demo.com | 123456 | Team sellers |
| Seller | vendedor1@demo.com | 123456 | Own metrics |

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Database commands
npm run db:generate    # Generate Prisma Client
npm run db:push        # Push schema to database
npm run db:migrate     # Create migration
npm run db:seed        # Run seed script
npm run db:studio      # Open Prisma Studio
npm run db:reset       # Reset database

# Build
npm run build
```

---

## 📝 Technical Notes

### Prisma 7.x Adapter Requirement
Prisma 7 requires an explicit adapter for database connections:
```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

### Client-Safe Enums
Prisma enums can't be imported on the client. We mirror them in `src/types/rbac.ts`:
```typescript
// Client-safe (use in components)
export enum AccessLevel {
  SUPER_ADMIN = "SUPER_ADMIN",
  // ...
}

// Cast from Prisma to client-safe
user.access_level as AccessLevel
```

### Dashboard Resolver Pattern
Each access level has its own resolver with fallback logic:
- Director checks: superintendents → managers → sellers → areas
- If intermediate levels don't exist, it falls back to the next level

---

## 🔧 Known Issues & Workarounds

1. **Middleware deprecation warning**: Next.js 16 deprecated `middleware.ts` in favor of `proxy`. Currently using middleware but should migrate.

2. **Prisma enum casting**: Required explicit casting between Prisma and client enums.

3. **Mock data regeneration**: Mock leads are generated on module load. Restart server to regenerate.

---

## 📊 Metrics Structure

```typescript
interface LeadMetrics {
  new_count: number;
  qualified_count: number;
  callback_count: number;
  proposal_count: number;
  sold_count: number;
}

interface DashboardData {
  user_metrics: LeadMetrics;      // User's own metrics
  subordinates: SubordinateMetrics[]; // Team breakdown
  total_metrics: LeadMetrics;     // Aggregated totals
  period: { start, end, label };  // Date range
}
```

---

## 🎯 Next Steps for New Chat

1. **If implementing Lead CRUD**:
   - Create `/api/leads` routes (GET, POST, PUT, DELETE)
   - Create `/dashboard/leads` page with data table
   - Implement RBAC filtering in queries

2. **If implementing WhatsApp Analytics**:
   - Design message ingestion schema
   - Create webhook endpoint
   - Implement AI processing pipeline

3. **If fixing bugs**:
   - Check `CHANGELOG.md` for known issues
   - Verify database connection
   - Check browser console for errors

---

## 📞 Support

For questions about this codebase:
1. Review this document first
2. Check `CHANGELOG.md` for recent changes
3. Run `npm run db:studio` to inspect database
4. Check server logs for errors
