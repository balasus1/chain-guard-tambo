# Chain-Guard — Technical Documentation

_Date: June 2026_

---

## Architecture Overview

Chain-Guard is a Next.js 15 application with a three-layer architecture:

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Tambo UI)             │
│  Next.js 15 · React 19 · Tailwind CSS v4        │
│  AI-driven generative components via Tambo SDK  │
└──────────────────────┬──────────────────────────┘
                       │ HTTP / AI Context
┌──────────────────────▼──────────────────────────┐
│              Agent Layer (Archestra)             │
│  Logistics Audit Agent · Policy Engine           │
│  SLA Checker · Anomaly Scorer · Decision Log     │
└──────────────────────┬──────────────────────────┘
                       │ API calls
┌──────────────────────▼──────────────────────────┐
│              Data & Integration Layer            │
│  TrackingMore API · Mock Data · SLA Config       │
│  (Future: ERP, TMS, Carrier APIs)               │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.4.1 |
| UI | React | 19.1.0 |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | v4 |
| AI UI Layer | Tambo AI React SDK | 0.74.1+ |
| Schema Validation | Zod | 3.x |
| Charts | Recharts | 2.x |
| Agent Backend | Archestra | latest |
| Tracking API | TrackingMore | v4 |
| Package Manager | npm | 10.x |

---

## Directory Structure

```
chain-guard-tambo/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── chain-guard/page.tsx      # Main Chain-Guard UI
│   │   ├── audit-test/page.tsx       # Audit agent test page
│   │   ├── sla-test/page.tsx         # SLA config test page
│   │   ├── policy-test/page.tsx      # Policy engine test page
│   │   └── api/                      # API routes
│   │       ├── audit-shipment/       # POST: run audit on shipment
│   │       ├── audit-report/         # GET: get audit report
│   │       ├── handle-incident/      # POST: trigger incident handler
│   │       ├── sla-config/           # GET/PUT: manage SLA config
│   │       └── agent-decisions/      # GET: audit log of agent decisions
│   │
│   ├── components/
│   │   ├── tambo/                    # AI-renderable components
│   │   │   ├── timeline.tsx          # Immutable shipment timeline
│   │   │   ├── shipment-card.tsx     # Shipment summary card
│   │   │   ├── anomaly-alert.tsx     # Anomaly notification
│   │   │   └── incident-handled-card.tsx
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── tambo.ts                  # CENTRAL: component + tool registration
│   │   ├── tracking-schemas.ts       # Zod schemas for all tracking types
│   │   ├── tracking-utils.ts         # Data transformation helpers
│   │   └── archestra/                # Agent + policy logic
│   │       ├── audit-agent.ts        # Core audit agent
│   │       ├── policy-engine.ts      # Policy evaluation
│   │       ├── sla-config.ts         # SLA configuration loader
│   │       ├── safe-actions.ts       # Policy-gated action executors
│   │       ├── decision-log.ts       # Audit log for agent decisions
│   │       └── types.ts              # Shared types
│   │
│   ├── services/
│   │   ├── trackingmore.ts           # TrackingMore API wrapper
│   │   ├── tracking-tools.ts         # Tambo tool wrappers
│   │   ├── archestra-tools.ts        # Archestra tool wrappers
│   │   ├── audit-report.ts           # Report generation service
│   │   └── mock-tracking-data.ts     # Mock data for dev/testing
│   │
│   └── data/
│       └── sla-config.json           # Default SLA rules
│
├── docs/                             # Product & technical documentation
│   ├── analysis.md
│   ├── features.md
│   ├── pricing.md
│   ├── marketing.md
│   ├── tech-docs.md
│   └── deployment.md
└── ...
```

---

## Core Data Models

### Shipment (Zod Schema)
```typescript
// src/lib/tracking-schemas.ts
const TrackingEvent = z.object({
  timestamp: z.string(),
  location: z.string(),
  description: z.string(),
  status: z.enum(['delivered', 'in_transit', 'exception', 'out_for_delivery', 'pending']),
});

const Shipment = z.object({
  trackingNumber: z.string(),
  courier: z.string(),
  status: TrackingEvent.shape.status,
  origin: z.string().optional(),
  destination: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  events: z.array(TrackingEvent),
  lastUpdate: z.string(),
});
```

### Audit Result
```typescript
// src/lib/archestra/types.ts
const AuditResult = z.object({
  trackingId: z.string(),
  slaStatus: z.enum(['on_track', 'warning', 'failed']),
  anomalyScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high']),
  verdict: z.enum(['OK', 'Warning', 'Failed']),
  anomalies: z.array(z.object({
    type: z.enum(['delay', 'route_deviation', 'temperature', 'customs_delay']),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    timestamp: z.string(),
  })),
  explanation: z.string(),
  suggestedActions: z.array(z.enum(['notify_customer', 'notify_vendor', 'create_ticket', 'monitor'])),
});
```

### Policy Decision Log
```typescript
const PolicyDecision = z.object({
  timestamp: z.string(),
  shipmentId: z.string(),
  actionRequested: z.string(),
  actionExecuted: z.boolean(),
  policyRuleEvaluated: z.string(),
  reason: z.string(),
});
```

---

## API Routes Reference

### `POST /api/audit-shipment`
Runs the Logistics Audit Agent on a shipment.

**Request:**
```json
{
  "trackingId": "FX9876543210",
  "carrier": "fedex"
}
```

**Response:** `AuditResult` schema (see above)

---

### `GET /api/audit-report?trackingId=FX9876543210`
Returns the full audit report for a shipment.

**Response:**
```json
{
  "shipment": { ... },
  "auditResult": { ... },
  "timeline": [ ... ],
  "decisions": [ ... ]
}
```

---

### `POST /api/handle-incident`
Triggers the incident handler — audits + applies policy-gated actions.

**Request:**
```json
{
  "trackingId": "FX9876543210",
  "mode": "automatic" | "suggest-only"
}
```

---

### `GET /api/sla-config`
Returns the current SLA configuration.

### `PUT /api/sla-config`
Updates SLA rules. Body: `SLAConfig` object.

---

### `GET /api/agent-decisions?limit=10`
Returns the audit log of the last N agent decisions.

---

## SLA Configuration Format

```json
// src/data/sla-config.json
{
  "defaultMaxTransitDays": 5,
  "carriers": {
    "fedex": { "maxTransitDays": 3, "warningThresholdHours": 48 },
    "dhl": { "maxTransitDays": 5, "warningThresholdHours": 72 },
    "ups": { "maxTransitDays": 4, "warningThresholdHours": 60 }
  },
  "routes": {
    "US-to-UK": { "maxTransitDays": 7 },
    "US-to-EU": { "maxTransitDays": 6 }
  },
  "specialRules": [
    {
      "condition": "shipment_type === 'temperature_sensitive'",
      "maxTransitDays": 2,
      "alertOnRouteDeviation": true
    }
  ]
}
```

---

## Policy Engine Logic

The policy engine (`src/lib/archestra/policy-engine.ts`) evaluates whether an agent-requested action is permitted:

```
create_ticket allowed when:
  riskLevel === 'high'
  OR (slaBreachHours > 48 AND anomalyType IN ['delay', 'temperature'])

notify_customer allowed when:
  slaBreachHours > 24
  AND riskLevel !== 'low'

notify_vendor allowed when:
  anomalyType IN ['route_deviation', 'temperature']
  OR repeatedDelaysByVendor > 3 IN last 30 days
```

---

## Tambo Component Registration

All AI-renderable components must be registered in `src/lib/tambo.ts`:

```typescript
export const components: TamboComponent[] = [
  {
    name: "Timeline",
    description: "Immutable chronological timeline of shipment events with status indicators",
    component: Timeline,
    propsSchema: timelineSchema,
  },
  {
    name: "ShipmentCard",
    description: "Shipment summary card with tracking number, courier, status and route",
    component: ShipmentCard,
    propsSchema: shipmentCardSchema,
  },
  {
    name: "AnomalyAlert",
    description: "Alert card for detected shipment anomalies with severity and recommended actions",
    component: AnomalyAlert,
    propsSchema: anomalyAlertSchema,
  },
];
```

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_key     # Tambo AI SDK key
NEXT_PUBLIC_TRACKINGMORE_API_KEY=your_key    # TrackingMore v4 API key

# Optional (future)
DATABASE_URL=postgresql://...                # For multi-tenant persistence
RESEND_API_KEY=your_key                      # For email alerts
SLACK_WEBHOOK_URL=your_webhook               # For Slack alerts
```

---

## Adding New AI-Renderable Components

1. Create the component in `src/components/tambo/your-component.tsx`
2. Define a Zod schema for its props
3. Type props using `z.infer<typeof yourSchema>`
4. Register in `src/lib/tambo.ts` components array with a clear description
5. The AI will now be able to render it in responses

---

## Adding New Agent Tools

1. Implement the tool function in `src/services/`
2. Define input/output Zod schemas
3. Register in `src/lib/tambo.ts` tools array
4. The AI will call it automatically when relevant

---

## Development Notes

- TypeScript strict mode is enabled — no `any` types
- All components must use `z.infer<typeof schema>` for prop typing
- Tambo requires a client component boundary for all AI-driven components
- The `TamboProvider` in `src/app/layout.tsx` must wrap the entire app
- Mock data lives in `src/services/mock-tracking-data.ts` for dev/testing
