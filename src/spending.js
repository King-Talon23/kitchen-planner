// Spending log: what you actually paid at the store, by week, against the budget.
// Weeks start on Monday.

import { newId, today, addDays } from './inventory.js';

export function weekStart(isoDate = today()) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(isoDate, -offset);
}

export function addSpend(state, { date = today(), store = '', amount, note = '' }) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) throw new Error('Amount must be a positive number');
  const entry = { id: newId('spend'), date, store: String(store).trim(), amount: Math.round(value * 100) / 100, note: String(note).trim() };
  state.spending.push(entry);
  state.spending.sort((a, b) => b.date.localeCompare(a.date));
  return entry;
}

export function spentInWeek(state, on = today()) {
  const start = weekStart(on);
  const end = addDays(start, 6);
  return round2(state.spending.filter((s) => s.date >= start && s.date <= end).reduce((sum, s) => sum + s.amount, 0));
}

// Totals for the last `weeks` weeks, oldest first.
export function weeklyTotals(state, { weeks = 8, on = today() } = {}) {
  const budget = Number(state.settings?.budget ?? 150);
  const current = weekStart(on);
  const rows = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(current, -7 * i);
    const spent = spentInWeek(state, start);
    rows.push({ start, spent, budget, over: spent > budget });
  }
  return rows;
}

export function spendingSummary(state, opts) {
  const rows = weeklyTotals(state, opts);
  const withData = rows.filter((r) => r.spent > 0);
  const average = withData.length ? round2(withData.reduce((s, r) => s + r.spent, 0) / withData.length) : 0;
  return { rows, average, weeksOver: withData.filter((r) => r.over).length, weeksTracked: withData.length };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
