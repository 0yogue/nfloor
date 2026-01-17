# Changelog

All notable changes to the NFloor project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-17 - MVP1 WhatsApp Analytics

### Added

#### Leads Management System
- **Leads Page** (`/leads`) with split layout 25%/75%:
  - Left panel: Lead list with temperature indicators, search, and filters
  - Right panel: Full lead details with property information
  
- **Lead Types** (`src/types/leads.ts`):
  - `LeadTemperature`: HOT, WARM, COOLING, COLD
  - `LeadSource`: ZAP_IMOVEIS, OLX, VIVA_REAL, IMOVEL_WEB, QUINTO_ANDAR, etc.
  - `PropertyType`: APARTMENT, HOUSE, LAND, COMMERCIAL, PENTHOUSE, STUDIO
  - `OperationType`: SALE, RENT, BOTH
  - `LeadFull` interface with property interest and conversation tracking

- **Lead Components** (`src/components/leads/`):
  - `LeadList`: Sortable, filterable list with temperature badges
  - `LeadListItem`: Compact lead card with last message preview
  - `LeadDetails`: Full lead view with property info, contact buttons, history

- **Email Parser** (`src/lib/leads/email-parser.ts`):
  - Auto-detection of portal source (ZAP, OLX, VivaReal, ImovelWeb, etc.)
  - Extraction of lead name, phone, email, message
  - Property code and address parsing
  - Operation type detection (venda/aluguel)

- **APIs**:
  - `GET /api/leads`: List leads by access level
  - `POST /api/leads/import`: Import leads from .eml or .csv files

- **Import Dialog**: Upload interface for email and file imports

#### Team Metrics & Ranking
- **Team Metrics Cards** (`TeamMetricsCards` component):
  - Sellers online/offline count
  - New conversations today
  - Average response time
  - Average playbook score
  - Leads without response

- **Seller Ranking Table** (`SellerRankingTable` component):
  - Performance ranking with composite score
  - Online status indicator
  - Response time and playbook metrics
  - Conversion rate tracking

- **Database Models** (Prisma schema):
  - `Conversation`: WhatsApp chat tracking with status
  - `Message`: Individual messages with response time
  - `PlaybookScore`: Seller performance evaluation
  - `Playbook`: Configurable evaluation criteria
  - Updated `Session` model with `is_online` and `last_heartbeat`

- **Mock Data**:
  - 8 sample leads with property interests
  - Conversation and message generators
  - Team metrics simulation

### Changed
- **Dashboard** updated with TeamMetricsCards and SellerRankingTable
- **Sidebar** navigation now includes Leads link
- **Resolvers** extended to return `team_metrics` and `seller_ranking`

---

## [0.2.0] - 2026-01-17

### Added

#### Database & Schema
- **Lead model** added to Prisma schema with `LeadStatus` enum (NEW, QUALIFIED, CALLBACK, PROPOSAL, SOLD, LOST)
- **Database setup scripts**: `scripts/setup-db.sh` and `scripts/setup-db.sql` for PostgreSQL initialization
- **Prisma adapter** for PostgreSQL (required by Prisma 7.x)

#### Dashboard Metrics System
- **Adapter Pattern** for data source abstraction:
  - `DashboardDataSource` interface in `src/lib/dashboard/adapter.ts`
  - `MockDataSource` implementation with simulated data
  - `PrismaDataSource` implementation for real database queries
  - Environment variable `DASHBOARD_DATA_SOURCE` to switch between `mock` and `prisma`

- **RBAC-aware Resolvers** (Plan B implementation):
  - `resolver-director.ts`: Views superintendents → managers → sellers with automatic fallback
  - `resolver-superintendent.ts`: Views managers in managed areas
  - `resolver-manager.ts`: Views sellers in the team
  - `resolver-seller.ts`: Views only own metrics

- **API Endpoint** `/api/dashboard/metrics`:
  - Accepts `filter` parameter (today, 7days, 30days, custom)
  - Accepts `start` and `end` for custom date ranges
  - Returns metrics scoped by user's access level

- **Dashboard UI Components**:
  - `MetricsCards` component with 5 metric cards (New, Qualified, Callback, Proposal, Sold)
  - `SubordinatesTable` component showing team metrics by hierarchy level
  - Refresh button with loading state
  - Data source indicator card

#### Mock Data
- `mock-data.ts` with realistic simulated data:
  - 4 areas (Zona Norte, Sul, Leste, Oeste)
  - 9 users across all access levels
  - ~300 leads generated over 30 days with realistic distribution

### Changed
- **Dashboard page** refactored to use new metrics API instead of hardcoded mock values
- **Date filters** now trigger API calls with proper date ranges

### Fixed
- Prisma Client initialization with PostgreSQL adapter (Prisma 7 requirement)
- Enum type mismatches between Prisma and client-safe types
- Zod validation error property (`issues` instead of `errors`)
- JWT `expiresIn` typing

---

## [0.1.0] - 2026-01-16

### Added

#### Project Setup
- Next.js 16 with App Router and TypeScript
- Tailwind CSS with shadcn/ui components
- Prisma ORM v7 with PostgreSQL

#### Authentication System
- JWT-based authentication with session persistence
- Login/logout API routes
- Session management with token hashing
- Password hashing with bcrypt

#### RBAC System
- **Access Levels**: SUPER_ADMIN, DIRECTOR, SUPERINTENDENT, MANAGER, SELLER
- **License Types**: BASIC, PROFESSIONAL, ENTERPRISE
- **User Status**: ACTIVE, INACTIVE, SUSPENDED
- Feature gating based on license type
- Data scope filtering based on access level and company/area

#### Database Models
- `Company` - Multi-tenant root entity with license management
- `Area` - Organizational units within companies
- `User` - Core user entity with RBAC
- `AreaManager` - Many-to-many for users managing multiple areas
- `Session` - JWT session tracking

#### UI Components
- Login page with email/password form
- Dashboard layout with sidebar navigation
- App sidebar with role-based menu items
- Theme system with dark mode support

#### Configuration
- Environment variables setup (`.env.example`)
- Database scripts in `package.json`
- Prisma configuration with TypeScript config file

### Security
- Password hashing with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- Session tokens stored as hashes
- HttpOnly cookies for session management

---

## File Structure Created

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   └── dashboard/
│   │       └── metrics/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── dashboard/
│       ├── app-sidebar.tsx
│       ├── metrics-cards.tsx
│       └── subordinates-table.tsx
├── contexts/
│   └── auth-context.tsx
├── lib/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── service.ts
│   │   └── session.ts
│   ├── dashboard/
│   │   ├── adapter.ts
│   │   ├── adapter-mock.ts
│   │   ├── adapter-prisma.ts
│   │   ├── index.ts
│   │   ├── metrics.ts
│   │   ├── mock-data.ts
│   │   ├── types.ts
│   │   └── resolvers/
│   │       ├── index.ts
│   │       ├── resolver-director.ts
│   │       ├── resolver-manager.ts
│   │       ├── resolver-seller.ts
│   │       └── resolver-superintendent.ts
│   ├── prisma/
│   │   └── client.ts
│   ├── rbac/
│   │   ├── data-scope.ts
│   │   ├── features.client.ts
│   │   ├── features.ts
│   │   ├── index.ts
│   │   └── permissions.ts
│   └── utils.ts
├── middleware.ts
└── types/
    └── rbac.ts

prisma/
├── schema.prisma
└── seed.ts

scripts/
├── setup-db.sh
└── setup-db.sql
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@nfloor.com | 123456 |
| Director | diretor@demo.com | 123456 |
| Manager | gerente@demo.com | 123456 |
| Seller | vendedor1@demo.com | 123456 |
