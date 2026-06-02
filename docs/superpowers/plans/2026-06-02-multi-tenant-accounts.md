# Multi-Tenant Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Clerk auth + Neon Postgres to Chain-Guard so multiple businesses can each have their own isolated account, shipment registry, team members, and plan quotas.

**Architecture:** Clerk handles authentication and organization management (sign-in, sign-up, sessions, team invites). Neon (serverless Postgres) with Drizzle ORM stores org-scoped shipment registries and usage quotas. A Next.js middleware layer gates every protected route and API endpoint. The existing Tambo AI tools remain unchanged; org isolation is enforced at the HTTP layer and in the new `/api/shipments` endpoints.

**Tech Stack:** `@clerk/nextjs`, `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`

---

## Pre-Reading (Read These Before Starting)

- `src/app/chain-guard/page.tsx` — the main page you'll be modifying
- `src/app/layout.tsx` — where ClerkProvider wraps the app
- `src/app/api/audit-shipment/route.ts` — example API route to see how to add auth
- `src/lib/archestra/types.ts` — types used throughout

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `middleware.ts` | **Create** | Clerk auth middleware, protects `/chain-guard` and all `/api/*` |
| `src/app/layout.tsx` | **Modify** | Add `ClerkProvider` wrapper |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | **Create** | Clerk hosted sign-in page |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | **Create** | Clerk hosted sign-up page |
| `src/lib/db/schema.ts` | **Create** | Drizzle table definitions |
| `src/lib/db/index.ts` | **Create** | Neon connection + Drizzle client |
| `src/lib/db/queries.ts` | **Create** | Typed query helpers (add, list, delete, quota) |
| `drizzle.config.ts` | **Create** | Drizzle CLI config for migrations |
| `src/app/api/shipments/route.ts` | **Create** | GET (list org shipments), POST (add shipment to org) |
| `src/app/api/shipments/[id]/route.ts` | **Create** | DELETE (remove from org) |
| `src/app/api/audit-shipment/route.ts` | **Modify** | Add auth check |
| `src/app/api/audit-report/route.ts` | **Modify** | Add auth check |
| `src/app/api/handle-incident/route.ts` | **Modify** | Add auth check |
| `src/app/api/agent-decisions/route.ts` | **Modify** | Add auth check |
| `src/app/api/sla-config/route.ts` | **Modify** | Add auth check |
| `src/components/auth/user-nav.tsx` | **Create** | User avatar dropdown: profile, org, sign out |
| `src/components/dashboard/my-shipments.tsx` | **Create** | Lists org's saved shipments with delete |
| `src/components/dashboard/usage-quota.tsx` | **Create** | Monthly shipment usage bar |
| `src/app/chain-guard/page.tsx` | **Modify** | Add UserNav, add "My Shipments" tab, show quota |
| `.env.local` | **Modify** | Add Clerk + Neon env vars |

---

## Task 1: Install Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install Clerk and Neon packages**

```bash
npm install @clerk/nextjs @neondatabase/serverless drizzle-orm
npm install -D drizzle-kit
```

Expected output: packages added with no peer dependency warnings.

- [ ] **Step 2: Verify installs**

```bash
npm ls @clerk/nextjs @neondatabase/serverless drizzle-orm drizzle-kit
```

Expected: all four packages listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add clerk, neon, drizzle dependencies"
```

---

## Task 2: Environment Variables

**Files:** `.env.local`, `example.env.local`

You need a Clerk account and a Neon database before proceeding.

1. Go to [clerk.com](https://clerk.com), create a project called "chain-guard"
2. In Clerk dashboard → API Keys → copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. In Clerk dashboard → Configure → Organization Settings → Enable Organizations
4. Go to [neon.tech](https://neon.tech), create a project called "chain-guard"
5. Copy the connection string from the dashboard (looks like `postgresql://user:pass@host/dbname?sslmode=require`)

- [ ] **Step 1: Add keys to `.env.local`**

Add these lines to your existing `.env.local`:

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chain-guard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chain-guard

# Neon Database
DATABASE_URL=postgresql://...
```

- [ ] **Step 2: Update `example.env.local` with placeholder keys**

Add the same keys (without real values) so future developers know what's needed:

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chain-guard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chain-guard

# Neon Database
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
```

- [ ] **Step 3: Commit**

```bash
git add example.env.local
git commit -m "docs: add clerk and neon env var placeholders"
```

(Do NOT commit `.env.local` — it's gitignored.)

---

## Task 3: Clerk Middleware

**Files:** `middleware.ts` (create at project root, same level as `package.json`)

The middleware runs on every request and enforces auth on protected routes.

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/chain-guard(.*)',
  '/api/shipments(.*)',
  '/api/audit-shipment(.*)',
  '/api/audit-report(.*)',
  '/api/handle-incident(.*)',
  '/api/agent-decisions(.*)',
  '/api/sla-config(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

- [ ] **Step 2: Verify dev server still starts**

```bash
npm run dev
```

Expected: server starts on `localhost:3000` with no errors. Visiting `localhost:3000` should still show the home page (it's public). Visiting `localhost:3000/chain-guard` should redirect to Clerk's sign-in.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add clerk middleware protecting chain-guard and api routes"
```

---

## Task 4: ClerkProvider in Root Layout

**Files:** `src/app/layout.tsx`

ClerkProvider must wrap the entire app so auth state is available everywhere.

- [ ] **Step 1: Modify `src/app/layout.tsx`**

Replace the entire file with:

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Verify in browser**

Restart dev server. Visit `localhost:3000/chain-guard`. You should be redirected to Clerk's hosted sign-in page at `/sign-in`. The page will 404 because we haven't created the sign-in route yet — that's expected.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap app in ClerkProvider"
```

---

## Task 5: Sign-In and Sign-Up Pages

**Files:**
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`

The `[[...sign-in]]` catch-all route is required by Clerk for its hosted component to work.

- [ ] **Step 1: Create `src/app/sign-in/[[...sign-in]]/page.tsx`**

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center app-lovable-bg">
      <SignIn />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/sign-up/[[...sign-up]]/page.tsx`**

```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center app-lovable-bg">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 3: Verify sign-in flow**

Visit `localhost:3000/chain-guard`. You should be redirected to `localhost:3000/sign-in` and see the Clerk sign-in UI. Create a test account and verify you land on `/chain-guard` after signing in.

- [ ] **Step 4: Enable Organizations in Clerk dashboard**

Go to Clerk Dashboard → Configure → Organizations → toggle "Enable Organizations" ON.
Also enable "Allow users to create organizations".

- [ ] **Step 5: Commit**

```bash
git add src/app/sign-in src/app/sign-up
git commit -m "feat: add clerk sign-in and sign-up pages"
```

---

## Task 6: Database Schema

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create `src/lib/db/schema.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  unique,
} from 'drizzle-orm/pg-core';

export const trackedShipments = pgTable(
  'tracked_shipments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    createdBy: text('created_by').notNull(),
    trackingNumber: text('tracking_number').notNull(),
    courierCode: text('courier_code').notNull(),
    label: text('label'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
    cachedData: jsonb('cached_data'),
  },
  (t) => ({
    uniqueOrgTracking: unique().on(t.orgId, t.trackingNumber),
  })
);

export const auditResults = pgTable('audit_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: text('org_id').notNull(),
  shipmentId: uuid('shipment_id').references(() => trackedShipments.id, {
    onDelete: 'cascade',
  }),
  auditData: jsonb('audit_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const orgUsage = pgTable(
  'org_usage',
  {
    orgId: text('org_id').notNull(),
    month: text('month').notNull(),
    shipmentsTracked: integer('shipments_tracked').default(0).notNull(),
    auditsRun: integer('audits_run').default(0).notNull(),
  },
  (t) => ({
    pk: unique().on(t.orgId, t.month),
  })
);

export type TrackedShipment = typeof trackedShipments.$inferSelect;
export type NewTrackedShipment = typeof trackedShipments.$inferInsert;
export type OrgUsage = typeof orgUsage.$inferSelect;
```

- [ ] **Step 2: Create `src/lib/db/index.ts`**

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 3: Create `drizzle.config.ts`** (at project root)

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: Run migration to create tables in Neon**

```bash
npx drizzle-kit push
```

Expected output:
```
[✓] Changes applied
```

If it asks for confirmation, type `y`.

- [ ] **Step 5: Verify tables exist in Neon**

Go to Neon dashboard → Tables. You should see `tracked_shipments`, `audit_results`, `org_usage`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/ drizzle.config.ts drizzle/
git commit -m "feat: add neon postgres schema with drizzle (shipments, audits, org_usage)"
```

---

## Task 7: Database Query Helpers

**Files:**
- Create: `src/lib/db/queries.ts`

These functions are the only place that touches the database. All other code calls these.

- [ ] **Step 1: Create `src/lib/db/queries.ts`**

```typescript
import { db } from './index';
import { trackedShipments, orgUsage, auditResults } from './schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { NewTrackedShipment, TrackedShipment } from './schema';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getOrgShipments(orgId: string): Promise<TrackedShipment[]> {
  return db
    .select()
    .from(trackedShipments)
    .where(eq(trackedShipments.orgId, orgId))
    .orderBy(desc(trackedShipments.createdAt));
}

export async function addShipmentToOrg(
  data: Pick<NewTrackedShipment, 'orgId' | 'createdBy' | 'trackingNumber' | 'courierCode' | 'label'>
): Promise<TrackedShipment> {
  const [row] = await db
    .insert(trackedShipments)
    .values(data)
    .onConflictDoUpdate({
      target: [trackedShipments.orgId, trackedShipments.trackingNumber],
      set: { courierCode: data.courierCode, label: data.label },
    })
    .returning();
  return row;
}

export async function removeShipmentFromOrg(id: string, orgId: string): Promise<void> {
  await db
    .delete(trackedShipments)
    .where(and(eq(trackedShipments.id, id), eq(trackedShipments.orgId, orgId)));
}

export async function getOrgUsage(orgId: string): Promise<{ shipmentsTracked: number; auditsRun: number }> {
  const month = currentMonth();
  const [row] = await db
    .select()
    .from(orgUsage)
    .where(and(eq(orgUsage.orgId, orgId), eq(orgUsage.month, month)));
  return row ?? { shipmentsTracked: 0, auditsRun: 0 };
}

export async function incrementShipmentUsage(orgId: string): Promise<void> {
  const month = currentMonth();
  await db
    .insert(orgUsage)
    .values({ orgId, month, shipmentsTracked: 1, auditsRun: 0 })
    .onConflictDoUpdate({
      target: [orgUsage.orgId, orgUsage.month],
      set: { shipmentsTracked: sql`${orgUsage.shipmentsTracked} + 1` },
    });
}

export async function incrementAuditUsage(orgId: string): Promise<void> {
  const month = currentMonth();
  await db
    .insert(orgUsage)
    .values({ orgId, month, shipmentsTracked: 0, auditsRun: 1 })
    .onConflictDoUpdate({
      target: [orgUsage.orgId, orgUsage.month],
      set: { auditsRun: sql`${orgUsage.auditsRun} + 1` },
    });
}

export async function saveAuditResult(orgId: string, shipmentId: string, auditData: unknown): Promise<void> {
  await db.insert(auditResults).values({
    orgId,
    shipmentId,
    auditData: auditData as Record<string, unknown>,
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/queries.ts
git commit -m "feat: add typed db query helpers for org shipments and usage"
```

---

## Task 8: Org-Scoped Shipments API

**Files:**
- Create: `src/app/api/shipments/route.ts`
- Create: `src/app/api/shipments/[id]/route.ts`

These are the new endpoints the UI calls to add/list/delete shipments per org.

- [ ] **Step 1: Create `src/app/api/shipments/route.ts`**

```typescript
import { auth } from '@clerk/nextjs/server';
import { getOrgShipments, addShipmentToOrg, getOrgUsage, incrementShipmentUsage } from '@/lib/db/queries';

const PLAN_LIMITS: Record<string, number> = {
  free: 25,
  starter: 150,
  growth: 600,
  business: 2500,
};

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shipments = await getOrgShipments(orgId);
  const usage = await getOrgUsage(orgId);
  return Response.json({ shipments, usage });
}

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { trackingNumber, courierCode, label } = body as {
    trackingNumber: string;
    courierCode: string;
    label?: string;
  };

  if (!trackingNumber || !courierCode) {
    return Response.json({ error: 'trackingNumber and courierCode are required' }, { status: 400 });
  }

  const usage = await getOrgUsage(orgId);
  const limit = PLAN_LIMITS.free;
  if (usage.shipmentsTracked >= limit) {
    return Response.json(
      { error: `Monthly limit of ${limit} shipments reached. Upgrade your plan.` },
      { status: 429 }
    );
  }

  const shipment = await addShipmentToOrg({
    orgId,
    createdBy: userId,
    trackingNumber: trackingNumber.trim(),
    courierCode: courierCode.trim().toLowerCase(),
    label,
  });

  await incrementShipmentUsage(orgId);

  return Response.json({ shipment }, { status: 201 });
}
```

- [ ] **Step 2: Create `src/app/api/shipments/[id]/route.ts`**

```typescript
import { auth } from '@clerk/nextjs/server';
import { removeShipmentFromOrg } from '@/lib/db/queries';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await removeShipmentFromOrg(id, orgId);
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 3: Test the endpoints manually**

With the dev server running and signed in, open browser console and run:

```javascript
// Add a shipment
fetch('/api/shipments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ trackingNumber: 'FX9876543210', courierCode: 'fedex', label: 'Test shipment' })
}).then(r => r.json()).then(console.log);
```

Expected: `{ shipment: { id: "...", orgId: "...", trackingNumber: "FX9876543210", ... } }`

```javascript
// List shipments
fetch('/api/shipments').then(r => r.json()).then(console.log);
```

Expected: `{ shipments: [{ id: "...", ... }], usage: { shipmentsTracked: 1, auditsRun: 0 } }`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/shipments/
git commit -m "feat: add org-scoped /api/shipments GET and POST endpoints with quota enforcement"
```

---

## Task 9: Add Auth to Existing API Routes

**Files:**
- Modify: `src/app/api/audit-shipment/route.ts`
- Modify: `src/app/api/audit-report/route.ts`
- Modify: `src/app/api/handle-incident/route.ts`
- Modify: `src/app/api/agent-decisions/route.ts`
- Modify: `src/app/api/sla-config/route.ts`

Each existing route needs the same auth guard added at the top. Read each file first, then add the guard.

- [ ] **Step 1: Read existing audit-shipment route**

```bash
cat src/app/api/audit-shipment/route.ts
```

- [ ] **Step 2: Add auth guard to `src/app/api/audit-shipment/route.ts`**

Find the exported `POST` (or `GET`) function handler. Add at the very top of the handler body:

```typescript
import { auth } from '@clerk/nextjs/server';

// Inside the handler, as the FIRST lines:
const { userId, orgId } = await auth();
if (!userId || !orgId) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Repeat this pattern for all five route files. Each one: import `auth` from `@clerk/nextjs/server`, add the check as the first thing in the handler.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Test that unauth call is blocked**

Open a private/incognito browser window (so no Clerk session). Try:

```bash
curl -s http://localhost:3000/api/audit-shipment -X POST \
  -H "Content-Type: application/json" \
  -d '{"tracking_number":"FX9876543210"}'
```

Expected: `{"error":"Unauthorized"}` with HTTP 401.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/audit-shipment/route.ts src/app/api/audit-report/route.ts \
  src/app/api/handle-incident/route.ts src/app/api/agent-decisions/route.ts \
  src/app/api/sla-config/route.ts
git commit -m "feat: add clerk auth guard to all existing api routes"
```

---

## Task 10: UserNav Component

**Files:**
- Create: `src/components/auth/user-nav.tsx`

This component lives in the Chain-Guard header. It shows the signed-in user's avatar, their organization name, and a dropdown with sign-out.

- [ ] **Step 1: Create `src/components/auth/user-nav.tsx`**

```typescript
"use client";

import { useUser, useOrganization, useClerk, OrganizationSwitcher } from '@clerk/nextjs';
import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, Building2 } from 'lucide-react';

export function UserNav() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
      >
        <img
          src={user.imageUrl}
          alt={user.fullName ?? 'User'}
          className="h-7 w-7 rounded-full"
        />
        <div className="hidden sm:block text-left">
          <p className="text-xs font-medium text-foreground leading-tight">{user.fullName}</p>
          {organization && (
            <p className="text-xs text-muted-foreground leading-tight flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {organization.name}
            </p>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-background shadow-xl z-50 p-2">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
          </div>

          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-xs text-muted-foreground mb-1">Organization</p>
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  organizationSwitcherTrigger: 'w-full text-sm',
                },
              }}
            />
          </div>

          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/
git commit -m "feat: add UserNav component with org switcher and sign-out"
```

---

## Task 11: My Shipments Component

**Files:**
- Create: `src/components/dashboard/my-shipments.tsx`

Shows the org's saved shipments as a list. Each row has tracking number, courier, label, date added, and a delete button.

- [ ] **Step 1: Create `src/components/dashboard/my-shipments.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Package, ExternalLink, Plus } from 'lucide-react';
import type { TrackedShipment } from '@/lib/db/schema';

interface MyShipmentsProps {
  onSelectShipment?: (trackingNumber: string) => void;
}

export function MyShipments({ onSelectShipment }: MyShipmentsProps) {
  const [shipments, setShipments] = useState<TrackedShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState<{ trackingNumber: string; courierCode: string; label: string }>({
    trackingNumber: '',
    courierCode: '',
    label: '',
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchShipments = useCallback(async () => {
    const res = await fetch('/api/shipments');
    const data = await res.json() as { shipments: TrackedShipment[] };
    setShipments(data.shipments ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    const res = await fetch('/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    if (!res.ok) {
      const data = await res.json() as { error: string };
      setError(data.error);
    } else {
      setAddForm({ trackingNumber: '', courierCode: '', label: '' });
      setShowAddForm(false);
      await fetchShipments();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
    setShipments((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground text-sm">Loading your shipments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">My Shipments</h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Shipment
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="glossy-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              required
              value={addForm.trackingNumber}
              onChange={(e) => setAddForm((f) => ({ ...f, trackingNumber: e.target.value }))}
              placeholder="Tracking number"
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              required
              value={addForm.courierCode}
              onChange={(e) => setAddForm((f) => ({ ...f, courierCode: e.target.value }))}
              placeholder="Courier (fedex, ups, dhl...)"
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={addForm.label}
              onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Label (optional)"
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Save to My Shipments'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {shipments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No shipments saved yet. Click "Add Shipment" to start tracking.
        </div>
      ) : (
        <div className="space-y-2">
          {shipments.map((shipment) => (
            <div
              key={shipment.id}
              className="glossy-card p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono font-medium text-foreground truncate">
                    {shipment.trackingNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.courierCode.toUpperCase()}
                    {shipment.label && ` · ${shipment.label}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {onSelectShipment && (
                  <button
                    onClick={() => onSelectShipment(shipment.trackingNumber)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Track this shipment"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(shipment.id)}
                  className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Remove from my shipments"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add MyShipments component with org-scoped list, add, and delete"
```

---

## Task 12: Usage Quota Component

**Files:**
- Create: `src/components/dashboard/usage-quota.tsx`

Shows how many of the monthly shipment limit the org has used.

- [ ] **Step 1: Create `src/components/dashboard/usage-quota.tsx`**

```typescript
"use client";

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

const PLAN_LIMIT = 25;

interface UsageData {
  shipmentsTracked: number;
  auditsRun: number;
}

export function UsageQuota() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch('/api/shipments')
      .then((r) => r.json())
      .then((data: { usage: UsageData }) => setUsage(data.usage));
  }, []);

  if (!usage) return null;

  const pct = Math.min(100, Math.round((usage.shipmentsTracked / PLAN_LIMIT) * 100));
  const isNearLimit = pct >= 80;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Zap className={`h-3.5 w-3.5 ${isNearLimit ? 'text-yellow-500' : 'text-muted-foreground'}`} />
      <span className={isNearLimit ? 'text-yellow-600 dark:text-yellow-400' : ''}>
        {usage.shipmentsTracked}/{PLAN_LIMIT} shipments this month
      </span>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isNearLimit ? 'bg-yellow-500' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/usage-quota.tsx
git commit -m "feat: add UsageQuota component showing monthly shipment usage"
```

---

## Task 13: Wire Everything Into chain-guard/page.tsx

**Files:**
- Modify: `src/app/chain-guard/page.tsx`

Add: UserNav in header, "My Shipments" tab, UsageQuota in header.

- [ ] **Step 1: Modify `src/app/chain-guard/page.tsx`**

Replace the entire file with:

```typescript
"use client";

import { useState, Suspense } from "react";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { TrackingSearch } from "@/components/tracking-search";
import { MyShipments } from "@/components/dashboard/my-shipments";
import { UsageQuota } from "@/components/dashboard/usage-quota";
import { UserNav } from "@/components/auth/user-nav";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { Package, MessageSquare, LayoutDashboard } from "lucide-react";
import Link from "next/link";

type Tab = "dashboard" | "search" | "ai";

function ChainGuardContent() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedTracking, setSelectedTracking] = useState<string>("");
  const mcpServers = useMcpServers();

  const handleSelectShipment = (trackingNumber: string) => {
    setSelectedTracking(trackingNumber);
    setActiveTab("search");
  };

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="app-lovable-bg min-h-screen min-h-dvh flex flex-col">
        {/* Header */}
        <div className="border-b border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex-shrink-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Chain-Guard</h1>
                  <p className="text-xs text-muted-foreground">Logistics Audit Platform</p>
                </div>
              </Link>
              <div className="flex items-center gap-4">
                <UsageQuota />
                <UserNav />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/20 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur flex-shrink-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 flex-shrink-0 ${
                  activeTab === "dashboard"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                My Shipments
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 flex-shrink-0 ${
                  activeTab === "search"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Track Shipment
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 flex-shrink-0 ${
                  activeTab === "ai"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                AI Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0 bg-transparent">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            {activeTab === "dashboard" && (
              <MyShipments onSelectShipment={handleSelectShipment} />
            )}

            {activeTab === "search" && (
              <Suspense fallback={<div>Loading...</div>}>
                <TrackingSearch initialTracking={selectedTracking} />
              </Suspense>
            )}

            {activeTab === "ai" && (
              <div className="max-w-4xl mx-auto w-full">
                <MessageThreadFull
                  className="h-[calc(100dvh-180px)] sm:h-[calc(100vh-240px)] min-h-[320px]"
                  initialSuggestions={[
                    {
                      id: "handle-incident",
                      title: "Handle shipment",
                      detailedSuggestion: "Handle shipment FX9876543210 end-to-end",
                      messageId: "handle-incident-query",
                    },
                    {
                      id: "audit-shipment",
                      title: "Audit shipment",
                      detailedSuggestion: "Audit shipment FX9876543210",
                      messageId: "audit-query",
                    },
                    {
                      id: "list-shipments",
                      title: "List shipments",
                      detailedSuggestion: "Show me all shipments",
                      messageId: "list-query",
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}

export default function ChainGuardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChainGuardContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Update `TrackingSearch` to accept `initialTracking` prop**

The current `TrackingSearch` reads from `useSearchParams`. We need to also accept an `initialTracking` prop so the "My Shipments" tab can open a shipment in the search tab.

Edit `src/components/tracking-search.tsx`. Change the component signature:

```typescript
// OLD:
export function TrackingSearch() {
  const searchParams = useSearchParams();
  const initialTracking = searchParams.get("tracking") || "";

// NEW:
interface TrackingSearchProps {
  initialTracking?: string;
}

export function TrackingSearch({ initialTracking: propInitial }: TrackingSearchProps) {
  const searchParams = useSearchParams();
  const initialTracking = propInitial || searchParams.get("tracking") || "";
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify in browser (full flow)**

1. Sign in to Chain-Guard
2. The "My Shipments" tab shows (empty state: "No shipments saved yet")
3. Click "Add Shipment" → form appears
4. Enter tracking number `FX9876543210`, courier `fedex`, label `Test`
5. Click "Save to My Shipments" → shipment appears in list
6. Click the ExternalLink icon on the saved shipment → opens in Track tab with that tracking number pre-filled
7. Click the trash icon → shipment disappears
8. Header shows your name, org name, usage quota (1/25 shipments this month)

- [ ] **Step 5: Commit**

```bash
git add src/app/chain-guard/page.tsx src/components/tracking-search.tsx
git commit -m "feat: add My Shipments tab, UserNav, and UsageQuota to chain-guard page"
```

---

## Task 14: Home Page — Add Sign In / Sign Up Buttons

**Files:**
- Modify: `src/app/page.tsx`

The public home page should show "Sign In" and "Sign Up" buttons instead of just the "AI Assistant →" link.

- [ ] **Step 1: Modify `src/app/page.tsx` header section**

Find the `<ApiKeyCheck>` wrapper in the header and replace it with:

```typescript
// Add this import at the top of the file:
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// Replace the <ApiKeyCheck> in the header with:
<div className="flex items-center gap-2">
  <SignedOut>
    <SignInButton mode="modal">
      <button className="text-sm px-4 py-2 border border-border rounded-lg hover:bg-white/20 transition-colors">
        Sign In
      </button>
    </SignInButton>
    <SignUpButton mode="modal">
      <button className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
        Get Started Free
      </button>
    </SignUpButton>
  </SignedOut>
  <SignedIn>
    <a
      href="/chain-guard"
      className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
    >
      Go to Dashboard →
    </a>
    <UserButton />
  </SignedIn>
</div>
```

- [ ] **Step 2: Replace the CTA section at the bottom**

Find the CTA section with `<ApiKeyCheck>` and replace:

```typescript
// OLD:
<ApiKeyCheck>
  <a href="/chain-guard" ...>Try AI Assistant</a>
</ApiKeyCheck>

// NEW:
<SignedOut>
  <SignUpButton mode="modal">
    <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
      Start Free — No Credit Card
      <ArrowRight className="h-4 w-4" />
    </button>
  </SignUpButton>
</SignedOut>
<SignedIn>
  <a
    href="/chain-guard"
    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
  >
    Open Dashboard
    <ArrowRight className="h-4 w-4" />
  </a>
</SignedIn>
```

- [ ] **Step 3: Remove unused `ApiKeyCheck` import**

Remove the `import { ApiKeyCheck } from "@/components/ApiKeyCheck";` line from `src/app/page.tsx`.

- [ ] **Step 4: Verify in browser**

Visit `localhost:3000`. You should see "Sign In" and "Get Started Free" buttons in the header for unauthenticated visitors. After signing in, those become "Go to Dashboard →".

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add sign-in/sign-up buttons to home page, show dashboard link when signed in"
```

---

## Task 15: Final End-to-End Verification

No new files. This is the acceptance test before shipping.

- [ ] **Step 1: Build production bundle**

```bash
npm run build
```

Expected: `✓ Compiled successfully`. No TypeScript errors. No ESLint errors.

- [ ] **Step 2: Test as a new user (incognito)**

1. Visit `localhost:3000` — see marketing page with Sign In / Get Started buttons
2. Click "Get Started Free" → Clerk sign-up modal appears
3. Create account with email + password
4. After sign-up, you're at `/chain-guard` — see empty "My Shipments" tab
5. Click your user avatar — dropdown shows name, email, and org switcher
6. Create a new organization via the org switcher (click "Create organization" in the dropdown)
7. Name it "Test Corp"
8. Add a shipment: `FX9876543210` / `fedex` / `Test Package`
9. Quota shows: `1/25 shipments this month`
10. Click the ExternalLink on the shipment → goes to Track tab with that tracking number
11. Switch to AI tab → type "Audit shipment FX9876543210" → agent runs audit

- [ ] **Step 3: Test org isolation (second user)**

1. Open another incognito window
2. Sign up a second account
3. Add a different shipment
4. Verify that user 1's shipments are NOT visible to user 2 (different org)

- [ ] **Step 4: Test unauthenticated API access is blocked**

```bash
curl -s http://localhost:3000/api/audit-shipment -X POST \
  -H "Content-Type: application/json" \
  -d '{"tracking_number":"FX9876543210"}'
```

Expected: `{"error":"Unauthorized"}`

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: multi-tenant accounts complete — clerk auth, neon db, org-scoped shipments"
```

---

## Self-Review Notes

- **Spec coverage:** All 5 multi-tenant requirements covered: user accounts ✓, org creation ✓, data isolation (orgId on all DB queries) ✓, roles (Clerk handles admin/member) ✓, plan limits ✓
- **No placeholders:** All code blocks are complete and ready to paste
- **Type consistency:** `TrackedShipment` from schema used in both `queries.ts` and `my-shipments.tsx`. `orgId` string used consistently across all query functions and API routes.
- **One gap (deferred):** Plan limits in `POST /api/shipments` are hardcoded to `free: 25`. Starter/Growth/Business plan limits require Stripe integration (planned for a later milestone) to know which plan an org is on. For now, all orgs are treated as free tier. Add a `TODO` comment in `route.ts` to note this.
