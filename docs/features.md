# Chain-Guard — Feature Roadmap

_Date: June 2026_

---

## Feature Philosophy

Every feature must answer one of these:
1. **Saves money** — Finds cost leakage (overcharges, delays, SLA breaches)
2. **Saves time** — Replaces manual tracking, reporting, or reconciliation
3. **Reduces risk** — Catches anomalies before they become customer complaints or regulatory issues

Features that don't serve one of these don't belong in the product.

---

## Current Features (Built — MVP)

### Core Tracking
- [x] Multi-carrier shipment tracking via TrackingMore API (1,100+ carriers)
- [x] Create, view, and search shipments via natural language
- [x] Immutable timeline visualization per shipment
- [x] ShipmentCard component with status, route, and courier
- [x] TypeScript + Zod validated data models

### AI Audit Agent (Archestra)
- [x] SLA status computation (on_track / warning / failed)
- [x] Anomaly scoring (0–100) — delay, route deviation, temperature, customs
- [x] Risk level classification (low / medium / high)
- [x] Policy-governed safe actions: create_ticket, notify_customer, notify_vendor
- [x] Decision audit log — every agent action logged with policy reason
- [x] Vendor health summary — % on-time, avg delay, anomaly counts by type
- [x] What-if SLA simulation — see impact of tighter SLAs before applying

### AI Interface (Tambo)
- [x] Conversational query interface (natural language → structured data)
- [x] Dynamic UI generation (AI picks the right visualization)
- [x] Voice input (DictationButton)
- [x] Anomaly alerts component
- [x] Incident handled card

---

## Phase 1 — SMB Launch Essentials (Next 4–6 weeks)

These are the features required to launch as a paid SaaS product.

### 1.1 Multi-Tenant Accounts & Team Roles
**Why:** Businesses, not individuals, buy SaaS. Without team support, you can't sell to a company.
- User accounts with email/password + Google OAuth
- Organizations: one account, multiple users
- Roles: Admin, Operator, Viewer
- Per-organization shipment isolation
- Invite by email
- **Priority: P0 (blocker for paid launch)**

### 1.2 Automated Alerts & Notifications
**Why:** The product needs to push value to users — not wait for them to log in.
- Email alerts for: SLA breach, high-risk anomaly, delivery exception
- Slack integration (webhook-based)
- In-app notification center
- Alert preferences per user (choose what you care about)
- Daily digest option
- **Priority: P0**

### 1.3 Carrier Invoice Audit (Cost Recovery)
**Why:** Direct, measurable ROI. Users who recover money don't churn.
- Upload carrier invoice (CSV, PDF parsing)
- Match line items against actual shipment data
- Flag: overcharges, duplicate charges, wrong rate, wrong weight, wrong zone
- Recovery report: "You have $X in recoverable charges"
- Export evidence package (for dispute filing)
- **Priority: P0**

### 1.4 Interactive Route Map
**Why:** Visual impact. The most shareable/demoable feature. Converts free users.
- Shipment route on interactive map (Mapbox or Leaflet)
- Current location marker
- Historical route replay (animate the journey)
- Multi-shipment overlay (compare routes)
- Exception markers on map (where did it go wrong?)
- **Priority: P1**

### 1.5 Dashboard & Analytics Home
**Why:** Users need a landing page that shows value at a glance.
- Active shipment count + statuses (on-track / warning / failed)
- SLA compliance rate (this week / this month)
- Top anomaly types
- Carrier/vendor performance leaderboard
- Cost recovery total (month to date)
- **Priority: P1**

---

## Phase 2 — Growth Features (Months 2–4)

### 2.1 Vendor Scorecards (Public-Facing)
- Sharable vendor performance reports (link or PDF)
- Use case: "Here is DHL's scorecard from our last 90 days" for renegotiations
- Trend graphs: on-time rate over time, avg delay by month

### 2.2 Predictive Delivery ETA
- ML-based ETA recalculation based on: historical carrier performance, current route conditions, similar past shipments
- Confidence interval displayed: "Expected in 2.1 days ± 0.5"
- Alert when prediction diverges from carrier's stated ETA by >X hours

### 2.3 Batch Shipment Import
- CSV/XLSX upload to create tracking for 100s of shipments at once
- Map columns to tracking fields
- Progress tracker for batch jobs

### 2.4 API Access (Developer Tier)
- REST API for: create shipment, get tracking, get audit report, get vendor scores
- Webhook support: push events to your own systems
- API key management in dashboard
- Rate limits by plan tier

### 2.5 Customs & Compliance Delay Tracking
- Flag shipments held at customs
- Show estimated customs release window
- Integrate with customs broker APIs where available

### 2.6 Temperature & Condition Monitoring
- For cold-chain shipments: temperature log per event
- Alert when temp breaches threshold
- Compliance report for food/pharma shipments

---

## Phase 3 — Enterprise Expansion (Months 5–12)

### 3.1 SSO / SAML Integration
- For companies requiring centralized authentication

### 3.2 Multi-Carrier Contract Management
- Store carrier contracts with rate tables
- Automatically validate invoices against contracted rates (not just published rates)
- Flag rate discrepancies vs. your negotiated terms

### 3.3 AI-Generated Audit Reports (PDF/Word)
- "Generate a compliance report for Q1 2026"
- Executive summary + detailed timeline + anomaly list + cost recovery
- Branded with your company logo
- Scheduled reports (weekly/monthly auto-email)

### 3.4 ERP & TMS Integration
- Shopify order sync (auto-create trackings from orders)
- NetSuite, SAP Logistics data push
- Zapier/Make.com connector

### 3.5 Regulatory Compliance Mode
- FDA traceability for food/pharma shipments
- FSMA 204 compliance reports
- DSCSA serialized tracking for pharma
- Cold-chain certification exports

### 3.6 Custom SLA Policies UI
- No-code SLA builder: drag-and-drop rules
- "If carrier = DHL AND route = US-to-UK AND days > 5, alert Slack AND create ticket"
- SLA templates by industry (eCommerce, pharma, automotive)

---

## Feature Priority Matrix

| Feature | Impact | Effort | Phase |
|---|---|---|---|
| Multi-tenant accounts | Critical | Medium | 1 |
| Automated alerts | Critical | Low | 1 |
| Invoice audit | High (ROI) | High | 1 |
| Route map | High (demo) | Medium | 1 |
| Dashboard | High | Medium | 1 |
| Vendor scorecards | Medium | Low | 2 |
| Predictive ETA | High | High | 2 |
| Batch import | Medium | Low | 2 |
| API access | Medium | Medium | 2 |
| PDF reports | Medium | Medium | 3 |
| ERP integration | High (enterprise) | High | 3 |
| SSO | Medium (enterprise) | Medium | 3 |

---

## What NOT to Build (Now)

- Mobile app — web-responsive is enough for Phase 1
- Own carrier integrations — TrackingMore covers 1,100+ carriers
- Real-time IoT sensor integration — cold chain is Phase 3 at earliest
- Freight booking / rate shopping — that's a different product (Flexport)
- Route optimization — that's a different product (Route4Me)
