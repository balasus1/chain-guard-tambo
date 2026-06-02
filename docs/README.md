# Chain-Guard Documentation Index

_Last updated: June 2026_

All product, technical, and business documentation for Chain-Guard.

---

## Documents

| File | What's In It |
|---|---|
| [analysis.md](./analysis.md) | Market analysis, competitive landscape, demand validation, differentiation |
| [features.md](./features.md) | Full feature roadmap — current, Phase 1, Phase 2, Phase 3, what NOT to build |
| [pricing.md](./pricing.md) | Tier structure, competitive comparison, revenue projections, pricing page copy |
| [marketing.md](./marketing.md) | Go-to-market strategy, ICP, messaging, channels, launch sequence, KPIs |
| [tech-docs.md](./tech-docs.md) | Architecture, data models, API routes, component registration, env variables |
| [deployment.md](./deployment.md) | Vercel deploy, Docker, CI/CD, billing integration, monitoring, scaling |

---

## Quick Summary

**What:** AI-native logistics audit SaaS for SMBs
**Who:** 5–50 person teams shipping 50–2,500 packages/month
**How:** Track → Audit → Alert → Recover → Score vendors
**Price:** Free → $29 → $79 → $199/month
**Moat:** Policy-governed AI agent that audits both shipments AND its own decisions
**Stack:** Next.js 15 + React 19 + Tambo AI + Archestra + TrackingMore API
**Deploy:** Vercel (current) → Vercel + Neon + Clerk + Stripe (Phase 1)

---

## Build Order (Recommended)

1. **Multi-tenant accounts** (Clerk auth + Neon DB) — blocker for paid launch
2. **Automated alerts** (Resend + Slack webhooks)
3. **Analytics dashboard** (shipment health at a glance)
4. **Carrier invoice audit** (highest ROI feature, drives conversion)
5. **Route map** (visual impact, drives demos)
6. **Stripe billing** (monetize the above)
7. **Shopify app** (growth channel)

See [features.md](./features.md) for detailed breakdown and [deployment.md](./deployment.md) for technical setup.
