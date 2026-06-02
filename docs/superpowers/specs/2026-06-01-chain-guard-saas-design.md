# Chain-Guard SaaS — Product Design Spec

_Date: June 1, 2026_

---

## What We're Building

Chain-Guard is an AI-native logistics audit SaaS for SMBs (5–50 person teams shipping 50–2,500 packages/month). It solves four problems simultaneously:

1. **Visibility** — Unified real-time tracking across 1,100+ carriers
2. **Accountability** — Immutable SLA audit trails with AI-scored anomalies
3. **Cost recovery** — Carrier invoice audit that finds overbilling automatically
4. **Vendor intelligence** — Reliability scoring to support renegotiations

The unique technical moat: a **policy-governed AI audit agent** that both audits shipments AND logs its own decisions — making it the only logistics tool that is itself auditable.

---

## Target User

Primary ICP: Founder or ops lead at a small e-commerce, import/export, or 3PL business.
- 5–50 employees
- 50–1,000 shipments/month
- Currently tracking via carrier websites + spreadsheets
- Feels the pain of missed SLAs discovered too late and invoices they don't audit

---

## Pricing Model

Freemium → $29 → $79 → $199/month, tiered by shipment volume and feature access.
Annual billing available at ~17% discount.

---

## Architecture

Three-layer:
1. **Frontend** — Next.js 15 + React 19 + Tambo AI (generative UI, natural language interface)
2. **Agent layer** — Archestra (Logistics Audit Agent, Policy Engine, Decision Log)
3. **Data layer** — TrackingMore API (1,100+ carriers), database (Neon Postgres, Phase 1), Stripe (Phase 2)

---

## Phase 1 Features (Launch-Critical)

| Feature | Why |
|---|---|
| Multi-tenant accounts + roles | Can't sell to teams without it |
| Automated alerts (email + Slack) | Product must push value, not wait for login |
| Carrier invoice audit | Immediate, measurable ROI |
| Interactive route map | High-impact demo/conversion feature |
| Analytics dashboard | At-a-glance health of all shipments |

---

## Phase 2 Features (Growth)

Vendor scorecards, predictive ETA, batch import, API access, PDF audit reports.

---

## Phase 3 Features (Enterprise)

SSO, ERP integrations, custom SLA policy builder, FSMA/DSCSA compliance, contract rate validation.

---

## Deployment

Vercel + Neon Postgres + Clerk auth + Resend email + Stripe billing.
Docker/self-hosted for Enterprise tier.

---

## Success Criteria

- 140 paid users by month 12
- < 3% monthly churn
- NPS > 40
- Average user recovers > cost of plan in audited savings
