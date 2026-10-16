// What you actually ate, and your weight over time, measured against the
// daily targets in nutrition.js.
//
// Each food log entry stores its nutrition per serving at the time it was
// logged, so later changes to a recipe or price don't rewrite your history.
//
// Leftovers: Health Canada says to eat refrigerated leftovers within 2 to 3
// days (https://www.canada.ca/en/health-canada/services/general-food-safety-tips/food-safety-tips-leftovers.html),
// so a cooked meal's spare servings are offered on the day it was cooked
// and the 2 days after, the cautious end of that range.
//
// Weight trend: a single weigh-in moves around from day to day, so
// the trend is a least-squares line through the weigh-ins of the last
// 4 weeks rather than the change between two weigh-ins.

import { newId, today, addDays } from './inventory.js';
import { recipeNutrition, ingredientNutrition } from './nutrition.js';

export const LEFTOVER_DAYS = 2; // days after the cooking day
const KEYS = ['kcal', 'protein', 'fat', 'carbs'];

const round = (n, places = 0) => Math.round(n * 10 ** places) / 10 ** places;
const zero = () => ({ kcal: 0, protein: 0, fat: 0, carbs: 0 });

export function ensureLogs(state) {
  if (!Array.isArray(state.eaten)) state.eaten = [];
  if (!Array.isArray(state.weights)) state.weights = [];
  return state;
}

// Add something you ate. `per` is the nutrition of one serving.
export function logEaten(state, { date = today(), name, servings = 1, per, recipeId, mealId, kind = 'food', unknown = [] }) {
  ensureLogs(state);
  if (!name) throw new Error('Name what you ate');
  const amount = Number(servings);
  if (!(amount > 0)) throw new Error('Enter how many servings you ate');
  const entry = {
    id: newId('eat'), date, name, servings: amount, kind,
    per: Object.fromEntries(KEYS.map((k) => [k, round(Number(per?.[k]) || 0, 1)])),
  };
  if (recipeId) entry.recipeId = recipeId;
  if (mealId) entry.mealId = mealId;
  if (unknown.length) entry.unknown = [...unknown];
  state.eaten.unshift(entry);
  return entry;
}

export function recipeServing(recipe, catalog) {
  const n = recipeNutrition(recipe, catalog);
  return { per: n.perServing, unknown: n.unknown };
}

// One food from the catalog in any amount, e.g. 250 ml of milk.
export function foodServing(name, qty, unit, catalog) {
  const n = ingredientNutrition(name, Number(qty), unit, catalog);
  if (!n) return null;
  return Object.fromEntries(KEYS.map((k) => [k, round(n[k], 1)]));
}

export function totalsOf(entries) {
  const t = zero();
  for (const e of entries) for (const k of KEYS) t[k] += (e.per?.[k] || 0) * e.servings;
  return Object.fromEntries(KEYS.map((k) => [k, Math.round(t[k])]));
}

export function eatenOn(state, date = today()) {
  const entries = (state.eaten || []).filter((e) => e.date === date);
  return { entries, totals: totalsOf(entries) };
}

// Daily totals for the `days` days ending on `until`, and the average over
// the days that have anything logged (an empty day usually means you didn't
// log, not that you ate nothing).
export function recentDays(state, { days = 7, until = today() } = {}) {
  const rows = Array.from({ length: days }, (_, n) => {
    const date = addDays(until, n - days + 1);
    const { entries, totals } = eatenOn(state, date);
    return { date, logged: entries.length > 0, ...totals };
  });
  const logged = rows.filter((r) => r.logged);
  const average = logged.length
    ? Object.fromEntries(KEYS.map((k) => [k, Math.round(logged.reduce((s, r) => s + r[k], 0) / logged.length)]))
    : null;
  return { rows, average, daysLogged: logged.length };
}

// Cooked meals that still have servings nobody has logged eating, and are
// recent enough to be safe.
export function leftovers(state, on = today()) {
  const since = addDays(on, -LEFTOVER_DAYS);
  return (state.history || [])
    .filter((m) => m.date >= since && m.date <= on)
    .map((m) => {
      const eaten = (state.eaten || []).filter((e) => e.mealId === m.id).reduce((s, e) => s + e.servings, 0);
      return { meal: m, left: round(Math.max(0, m.servings - eaten), 2), lastDay: addDays(m.date, LEFTOVER_DAYS) };
    })
    .filter((x) => x.left > 0 && x.meal.per);
}

// ---------- Weight ----------

export function logWeight(state, { date = today(), kg }) {
  ensureLogs(state);
  const value = Number(kg);
  if (!(value > 0)) throw new Error('Enter your weight');
  state.weights = state.weights.filter((w) => w.date !== date);
  state.weights.push({ id: newId('wt'), date, kg: round(value, 2) });
  state.weights.sort((a, b) => a.date.localeCompare(b.date));
  // The latest weigh-in drives the targets.
  const latest = state.weights[state.weights.length - 1];
  if (state.profile) state.profile.weightKg = latest.kg;
  return latest;
}

const dayNumber = (date) => Date.parse(`${date}T00:00:00Z`) / 86400000;

// Kilograms gained (or lost) per week over the last `days`, or null when the
// weigh-ins span less than a week.
export function weightTrend(state, { days = 28, on = today() } = {}) {
  const since = addDays(on, -days);
  const points = (state.weights || []).filter((w) => w.date >= since && w.date <= on).map((w) => [dayNumber(w.date), w.kg]);
  if (points.length < 2) return null;
  const span = points[points.length - 1][0] - points[0][0];
  if (span < 7) return null;
  const mx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const my = points.reduce((s, p) => s + p[1], 0) / points.length;
  const slope = points.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / points.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  return { kgPerWeek: round(slope * 7, 2), weighIns: points.length, days: span };
}

// How the trend compares with the target rate of gain.
export function trendAdvice(trend, targets) {
  if (!trend || !targets?.weeklyGainKg) return null;
  const [low, high] = targets.weeklyGainKg;
  if (trend.kgPerWeek < low) return 'slow';
  if (trend.kgPerWeek > high) return 'fast';
  return 'on track';
}
