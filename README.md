# NFloor - WhatsApp Analytics

Sistema de gestão imobiliária com WhatsApp Analytics, RBAC e multi-tenancy.

## Stack Tecnológica

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT com sessões persistentes
- **UI**: shadcn/ui + Tailwind CSS
- **RBAC**: Sistema de permissões por nível de acesso

## Arquitetura RBAC

### Níveis de Acesso (AccessLevel)
| Nível | Visibilidade |
|-------|-------------|
| SUPER_ADMIN | Todas as empresas |
| DIRECTOR | Toda a empresa |
| SUPERINTENDENT | Áreas gerenciadas |
| MANAGER | Áreas gerenciadas |
| SELLER | Apenas próprios dados |

### Tipos de Licença (LicenseType)
| Licença | Features |
|---------|----------|
| BASIC | Dashboard básico, filtros simples |
| PROFESSIONAL | + Filtros custom, analytics, export |
| ENTERPRISE | + IA, API, white-label |

## Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar ambiente
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 3. Configurar banco de dados
```bash
npm run db:generate   # Gera o Prisma Client
npm run db:push       # Aplica schema no banco
npm run db:seed       # Popula dados de teste
```

### 4. Iniciar servidor
```bash
npm run dev
```

## Credenciais de Teste

| Usuário | Email | Senha |
|---------|-------|-------|
| Super Admin | admin@nfloor.com | 123456 |
| Diretor | diretor@demo.com | 123456 |
| Superintendente | superintendente@demo.com | 123456 |
| Gerente | gerente@demo.com | 123456 |
| Vendedor 1 | vendedor1@demo.com | 123456 |
| Vendedor 2 | vendedor2@demo.com | 123456 |

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting
npm run db:generate  # Gera Prisma Client
npm run db:push      # Aplica schema
npm run db:migrate   # Cria migration
npm run db:seed      # Popula banco
npm run db:studio    # Prisma Studio
npm run db:reset     # Reset completo do banco
```

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/          # Rotas de autenticação
│   ├── (dashboard)/     # Rotas protegidas
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   └── dashboard/       # Componentes do dashboard
├── contexts/            # React contexts
├── lib/
│   ├── auth/            # Lógica de autenticação
│   ├── prisma/          # Prisma client
│   └── rbac/            # Lógica de permissões
└── types/               # TypeScript types
```
