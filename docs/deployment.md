# Chain-Guard — Deployment Guide

_Date: June 2026_

---

## Deployment Philosophy

- **Vercel-first** — Next.js on Vercel is the lowest-friction path. Zero-config deployments, edge functions, automatic HTTPS.
- **Self-hostable** — Docker image for teams that need on-premise (Enterprise tier feature).
- **Stateless by default** — All state currently lives in Tambo + TrackingMore. Adding a database is Phase 1 for multi-tenant.

---

## Quick Deploy (Vercel)

### Step 1 — Fork & Clone
```bash
git clone https://github.com/your-org/chain-guard-tambo
cd chain-guard-tambo
npm install
```

### Step 2 — Environment Variables
Copy and fill in your keys:
```bash
cp example.env.local .env.local
```

Required values:
```
NEXT_PUBLIC_TAMBO_API_KEY=       # Get at tambo.co/dashboard
NEXT_PUBLIC_TRACKINGMORE_API_KEY= # Get at trackingmore.com
```

### Step 3 — Deploy to Vercel
```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel dashboard for automatic deploys on push.

### Step 4 — Set Environment Variables in Vercel
Go to: Project Settings → Environment Variables → Add all `.env.local` values.

---

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel (not just local)
- [ ] TrackingMore API key has production quota (check their dashboard)
- [ ] Tambo API key is production (not sandbox)
- [ ] Custom domain configured (vercel → your domain → HTTPS auto)
- [ ] Error monitoring set up (Sentry or Vercel Error Tracking)
- [ ] Analytics set up (Vercel Analytics or Plausible)

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev
# → http://localhost:3000

# Type check
npx tsc --noEmit

# Lint
npm run lint
npm run lint:fix

# Build production bundle (verify before deploy)
npm run build
npm run start
```

---

## Infrastructure for SaaS (Phase 1 Requirements)

When adding multi-tenant accounts, you need:

### Database — Neon (Recommended) or PlanetScale
Neon is a serverless Postgres that works natively with Vercel:
```bash
# Add to dependencies
npm install @neondatabase/serverless drizzle-orm

# Schema migrations
npx drizzle-kit push
```

Tables needed for multi-tenant:
- `users` — id, email, name, password_hash, created_at
- `organizations` — id, name, plan, shipment_quota_used, billing_email
- `org_members` — user_id, org_id, role (admin/operator/viewer)
- `shipments` — id, org_id, tracking_number, courier, created_at, data (JSON)
- `audit_logs` — id, org_id, shipment_id, result (JSON), timestamp
- `agent_decisions` — id, org_id, action, executed, reason, timestamp
- `alerts` — id, org_id, type, channel, config (JSON)

### Authentication — Clerk (Recommended) or Auth.js
Clerk is the fastest path to production auth with Next.js:
```bash
npm install @clerk/nextjs
```

Features covered out of the box:
- Email/password + Google/GitHub OAuth
- Organization management (teams)
- Role-based access
- Magic link login

### Email — Resend
```bash
npm install resend
```

Use for: transactional alerts (SLA breach, anomaly detection), welcome emails, weekly digest.

---

## Environment Variables (Full Production)

```bash
# Core
NEXT_PUBLIC_TAMBO_API_KEY=
NEXT_PUBLIC_TRACKINGMORE_API_KEY=

# Database (Phase 1)
DATABASE_URL=postgresql://...

# Authentication (Phase 1)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Email Alerts (Phase 1)
RESEND_API_KEY=

# Notifications (Phase 1)
SLACK_WEBHOOK_URL=

# Payments (Phase 2)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Monitoring
SENTRY_DSN=
```

---

## Billing Integration (Phase 2 — Stripe)

```bash
npm install stripe @stripe/stripe-js
```

Stripe products to create:
- `chain-guard-starter` — $29/month
- `chain-guard-growth` — $79/month
- `chain-guard-business` — $199/month

Key webhooks to handle:
- `customer.subscription.created` — activate plan
- `customer.subscription.updated` — upgrade/downgrade
- `customer.subscription.deleted` — downgrade to free
- `invoice.payment_failed` — email user + grace period

Usage-based billing (shipment overages):
```typescript
// Report usage to Stripe at end of billing period
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  { quantity: shipmentsOverQuota, timestamp: 'now' }
);
```

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  deploy:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Docker (Self-Hosted / Enterprise)

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml (with Postgres)
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/chainguard
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: chainguard
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Monitoring & Observability

### Error Tracking — Sentry
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Performance — Vercel Analytics
Enable in Vercel project dashboard → Analytics tab.

### Uptime — Better Uptime or UptimeRobot
Monitor `/api/health` endpoint (add this):
```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Logs — Vercel Log Drains → Datadog/Logtail
For production log aggregation and alerting.

---

## Scaling Notes

- **Vercel Edge Functions** — All API routes work as edge functions by default. Under 10ms cold start globally.
- **Rate limiting** — Add `@upstash/ratelimit` on API routes to prevent abuse. Free tier on Upstash.
- **Caching** — TrackingMore responses can be cached for 5 minutes to reduce API calls. Use Vercel KV or Upstash Redis.
- **Queue** — For invoice parsing and batch shipment imports, use Vercel Queue (serverless workers) or trigger.dev.

---

## Domain & SSL

1. Buy domain (Namecheap, Cloudflare Registrar)
2. Add to Vercel: Project → Settings → Domains → Add
3. Update DNS at your registrar to point to Vercel nameservers
4. SSL auto-provisioned by Vercel (Let's Encrypt)
5. Redirect `www` → apex domain

Suggested domain: `chainguard.app` or `chainguard.co`
