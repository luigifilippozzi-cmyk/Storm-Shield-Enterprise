# Storm Shield Enterprise (SSE)

ERP SaaS completo para empresas de auto repair (PDR / body shops) nos Estados Unidos.

## Stack

- **Frontend:** Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL 16+ (multi-tenant, schema per tenant)
- **Cache/Queues:** Redis 7+ (BullMQ)
- **Infra:** AWS (Terraform) + Docker

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev services
docker compose up -d

# Run all apps in dev mode
pnpm dev
```

## Project Structure

```
storm-shield-enterprise/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js frontend
│   └── mobile/       # React Native (future)
├── packages/
│   ├── shared-types/ # TypeScript interfaces
│   └── shared-utils/ # Utility functions
├── infra/            # Terraform + Dockerfiles
├── docs/             # Architecture docs, ADRs
└── n8n/              # Automation workflows
```

## License

Proprietary - All rights reserved.
