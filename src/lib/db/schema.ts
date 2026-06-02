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
