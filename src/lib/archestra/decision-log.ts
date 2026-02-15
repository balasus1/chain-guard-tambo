/**
 * Decision Log for Archestra
 *
 * Stores structured logs of agent decisions: audit results, requested actions,
 * policy checks, and what was executed vs denied.
 */

import type { DecisionLogEntry } from "./types";

const log: DecisionLogEntry[] = [];
const MAX_ENTRIES = 100;

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `dec-${Date.now()}-${idCounter}`;
}

/**
 * Append a decision log entry
 */
export function appendDecisionLog(entry: Omit<DecisionLogEntry, "id" | "timestamp">): DecisionLogEntry {
  const full: DecisionLogEntry = {
    ...entry,
    id: nextId(),
    timestamp: new Date().toISOString(),
  };
  log.push(full);
  if (log.length > MAX_ENTRIES) {
    log.shift();
  }
  return full;
}

/**
 * Get the last N decision log entries
 */
export function getLastDecisions(limit = 10): DecisionLogEntry[] {
  return [...log].reverse().slice(0, limit);
}

/**
 * Get all decision log entries (for debugging)
 */
export function getAllDecisions(): DecisionLogEntry[] {
  return [...log];
}
