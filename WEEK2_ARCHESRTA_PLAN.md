# Week 2 – Archestra Plan for Chain-Guard

## Goal

Use Archestra as the **agent + orchestration + security backend** for Chain-Guard, building on top of the Tambo-based UI from Week 1. The focus is on:

- Practical logistics/audit agents
- Multi-source orchestration
- Deterministic, policy-driven “safe actions”
- Clear auditability of both shipments and agent behavior

---

## Core Agent: Logistics Audit Agent

### Purpose

One Archestra agent that can answer:

> “Is this shipment OK? If not, what’s wrong, how risky is it, and what should we do?”

### Responsibilities

- Pull data from:
  - Mock tracking data (or TrackingMore / carrier APIs later)
  - A simple SLA configuration (JSON/YAML), e.g.:
    - Max transit days per route/vendor
    - Allowed delays by severity
    - Special rules for temperature-sensitive shipments

- Compute:
  - **SLA status**: `on_track | warning | failed`
  - **Anomaly score** (0–100) based on:
    - Delay duration
    - Route deviations
    - Temperature/customs issues
  - **Risk level**: `low | medium | high`

- Return a structured result:
  - Verdict: `OK | Warning | Failed`
  - List of detected anomalies (type, severity, description, timestamp)
  - Human-readable explanation
  - Suggested next actions (notify customer, notify vendor, open ticket, just monitor)

This becomes the **“hero agent”** for Week 2.

---

## Safe Actions & Deterministic Security

### Actions to Support

Implement 2–3 concrete actions that the agent can *request*, but only execute under policy:

- `create_ticket` – create an incident/ticket (can be a mock endpoint or log entry)
- `notify_customer` – simulate sending an email or message to the customer
- `notify_vendor` – simulate notifying the carrier or vendor

### Example Policies

- **Ticket creation**
  - Only allowed when:
    - `risk_level = high`, **or**
    - SLA breach > X hours (e.g. 48h) **and** anomaly type is `delay` or `temperature`
  - Otherwise, the agent may *recommend* a ticket but not execute it.

- **Customer notification**
  - Allowed when SLA is breached beyond a “customer-visible” threshold (e.g. > 24h delay).
  - Not allowed for low-risk anomalies (e.g. minor route deviation with no delay).

- **Vendor notification**
  - Allowed for:
    - `route_deviation`
    - `temperature` issues
    - Repeated delays from the same vendor in a given time window

### Demo Storyline

- Ask the agent: **“Handle shipment FX9876543210 end-to-end.”**
  - Agent audits shipment, detects route deviation, and calculates risk.
  - Agent proposes actions.
  - Policies decide:
    - Whether `create_ticket` is executed or only suggested.
    - Whether to notify customer or vendor.
  - Logs clearly show which policy allowed or blocked each action.

This showcases **Archestra’s deterministic security**: agents cannot silently “go rogue”; they operate strictly within predefined rules.

---

## Multi-Shipment & Vendor Health Summary

### Feature: Vendor Reliability Analysis

Build a capability for the agent to answer:

> “How is vendor/courier X doing over the last N shipments?”

### Inputs

- Vendor or courier identifier (e.g. `UPS`, `DHL`, `Vendor_X`)
- Optional time range or number of recent shipments

### Outputs

- % of shipments delivered within SLA
- Average delay (hours/days)
- Count of anomalies by type:
  - `delay`
  - `route_deviation`
  - `temperature`
  - `customs_delay`
- Overall **risk rating per vendor**:
  - `Green` (low risk)
  - `Yellow` (medium risk)
  - `Red` (high risk)

This provides a **higher-level audit/reporting view**, not just single shipment checks.

---

## “What-If” / Simulation Mode

### Goal

Let operators explore hypothetical SLA changes and see the impact:

- Example questions:
  - “If I tighten the SLA for DHL to 2 days, how many shipments would fail?”
  - “If I ignore route deviations but only care about delays, what does vendor health look like?”

### Approach

- Accept hypothetical SLA parameters as input.
- Re-run the audit logic across the (mock) shipment dataset.
- Return:
  - Number of shipments now failing vs. passing.
  - Distribution of severity levels.
  - Vendor-specific impact (e.g. DHL goes from Green → Yellow).

This demonstrates **planning and scenario analysis**, making the agent more than a simple query interface.

---

## Audit Log for Agent Decisions

### Purpose

Chain-Guard is about auditing shipments; Archestra can also audit **what the agents do**.

### Logged Per Invocation

- Input:
  - Shipment(s) and parameters
  - SLA configuration used
- Detected anomalies (type, severity, timestamp)
- Actions:
  - Requested actions
  - Actions actually executed
  - Actions denied + reasons
- Policy checks:
  - Which policy rules were evaluated
  - Why a given rule passed/failed

### Presentation

- Stored as structured logs (JSON) Archestra can expose.
- Optionally:
  - A simple “last 10 decisions” endpoint.
  - Can be visualized later in the Tambo UI as an “Agent Activity” view.

Pitch:  
> “Chain-Guard doesn’t just audit logistics; it also audits the behavior of the AI agents acting on your logistics data.”

---

## Opinionated Playbooks (Named Intents)

Define a small set of **high-level playbooks** exposed as Archestra agent endpoints:

- `audit_shipment(tracking_id)`
- `handle_incident(tracking_id)`  
  → audit + recommend/execute actions under policy
- `summarize_vendor_health(vendor_id)`
- `simulate_sla_change(vendor_id, new_sla_params)`

These playbooks give you clean integration points for:

- The Tambo UI (Week 1)
- Other tools (e.g. Accomplish, VisionAgents in later weeks)

---

## 4-Day Execution Plan

### Day 1 – Core Audit Agent

- Implement the **Logistics Audit Agent**:
  - Connect to mock shipment data.
  - Load simple SLA config (can be static JSON).
  - Compute SLA status, anomaly score, and risk level.
  - Return structured, well-typed results.

### Day 2 – Safe Actions & Policies

- Add actions:
  - `create_ticket`, `notify_customer`, `notify_vendor`.
- Implement deterministic policies that gate these actions.
- Add a minimal **decision log** that records:
  - actions requested vs. executed
  - policy rules involved

### Day 3 – Vendor Health & Simulation

- Implement:
  - `summarize_vendor_health(vendor_id)` using mock data.
  - `simulate_sla_change(...)` over the same dataset.
- Ensure outputs are:
  - JSON-friendly
  - Easy to feed into charts/cards later in Tambo.

### Day 4 – Polish & Storytelling

- Tighten policy messages and explanations.
- Prepare 2–3 **demo flows**:
  - “Audit this shipment.”
  - “Handle this incident automatically.”
  - “Summarize DHL vs UPS performance.”
  - “Simulate stricter SLA for DHL.”
- Write a short README section clearly explaining:
  - What the agent does.
  - How Archestra’s security/policies are used.
  - How this plugs into Chain-Guard + Tambo.

---

## Hackathon Narrative (to reuse later)

- Week 1 (Tambo):  
  Built the **Chain-Guard UI layer** – timelines, anomaly visualization, and ticketing via generative components.

- Week 2 (Archestra):  
  Added a **Logistics Audit Agent** behind Chain-Guard that:
  - Aggregates tracking data.
  - Checks against SLAs.
  - Scores anomalies and risk.
  - Executes only **policy-approved actions** like ticket creation and notifications.
  - Logs every decision for full auditability.

This shows a clear evolution: from AI-driven UI (Tambo) to a **governed, production-minded agent backend** (Archestra) for the same Chain-Guard SaaS vision.

