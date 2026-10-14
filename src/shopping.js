// Weekly shopping list and meal plan, kept inside the weekly budget.
//
// The list is built in priority order:
//   0. items you added by hand
//   1. ingredients the planned meals need that are not in the kitchen
//   2. restocking items that have fallen below their restock level
// Items are added while they fit the budget; anything that does not fit is
// listed separately as "over budget" so you can decide what to drop.

import { DEFAULT_PRICES } from './data/prices.js';
import { toBase, convertBase, formatQty, normalizeName } from './units.js';
import { recipeNeeds, consume, canonicalName, available, today, addDays } from './inventory.js';
import { spentInWeek } from './spending.js';
import { dailyTargets, servingNutritionMap } from './nutrition.js';

export const PRIORITY = { manual: 0, plan: 1, restock: 2 };

// Store prices you entered (from a flyer, shelf tag or receipt) count while
// they are current: until their sale end date, or for STORE_PRICE_DAYS after
// you saw them when there is no end date.
export const STORE_PRICE_DAYS = 45;

export function activeStorePrices(state, on = today()) {
  const oldest = addDays(on, -STORE_PRICE_DAYS);
  return (state.storePrices || []).filter((p) => (p.until ? p.until >= on : p.seen >= oldest));
}

function unitPrice(entry) {
  const pack = toBase(entry.pack.qty, entry.pack.unit);
  return { per: entry.price / pack.qty, unit: pack.unit };
}

// The default StatCan prices, then your own edits, then the cheapest current
// store price for each item (a real price beats a national average).
export function effectiveCatalog(state, on = today()) {
  const overrides = state.priceOverrides || {};
  const catalog = DEFAULT_PRICES.map((entry) => (overrides[entry.key] != null
    ? { ...entry, price: Number(overrides[entry.key]), overridden: true }
    : entry));
  catalog.push(...(state.customPrices || []));

  for (const sp of activeStorePrices(state, on)) {
    const candidate = {
      key: sp.key, statcan: `${sp.store || 'Store'} price`, price: Number(sp.price), pack: { qty: Number(sp.qty), unit: sp.unit },
      perWeight: Boolean(sp.perWeight), aliases: [], category: 'other', store: sp.store, until: sp.until || '', fromStore: true,
    };
    const key = canonicalName(sp.key, catalog);
    const idx = catalog.findIndex((e) => normalizeName(e.key) === key);
    if (idx < 0) {
      catalog.push(candidate);
      continue;
    }
    const current = catalog[idx];
    const mine = unitPrice(candidate);
    const theirs = unitPrice(current);
    const comparable = mine.unit === theirs.unit;
    // Replace a default price with any store price; replace another store price only when cheaper.
    if (!current.fromStore || (comparable && mine.per < theirs.per)) {
      catalog[idx] = { ...candidate, key: current.key, aliases: current.aliases, category: current.category, defaultPrice: current.fromStore ? current.defaultPrice : current };
    }
  }
  return catalog;
}

export function findPrice(name, catalog) {
  const key = canonicalName(name, catalog);
  return catalog.find((entry) => normalizeName(entry.key) === key) || null;
}

// What it costs to buy at least `qty` (in `unit`, a base unit) of `name`.
export function priceFor(name, qty, unit, catalog) {
  const entry = findPrice(name, catalog);
  if (!entry) return null;
  const pack = toBase(entry.pack.qty, entry.pack.unit);
  const key = canonicalName(name, catalog);
  const needed = convertBase(qty, unit, pack.unit, key);
  if (needed == null) return null;
  if (entry.perWeight) {
    // Loose or per-kg items: round up to the next 100 g.
    const buy = Math.max(100, Math.ceil(needed / 100 - 1e-9) * 100);
    return { entry, cost: round2((buy / pack.qty) * entry.price), buy: formatQty(buy, pack.unit), buyQty: buy, buyUnit: pack.unit };
  }
  const packs = Math.max(1, Math.ceil(needed / pack.qty - 1e-9));
  const size = pack.unit === 'ea' ? (pack.qty === 1 ? '' : ` × pack of ${pack.qty}`) : ` × ${formatQty(pack.qty, pack.unit)}`;
  return { entry, cost: round2(packs * entry.price), buy: `${packs}${size}`, buyQty: packs * pack.qty, buyUnit: pack.unit };
}

function addNeed(map, name, qty, unit, reason, source, catalog) {
  const key = `${canonicalName(name, catalog)}|${unit}`;
  const existing = map.get(key);
  if (existing) {
    existing.qty += qty;
    if (source && !existing.sources.includes(source)) existing.sources.push(source);
    existing.priority = Math.min(existing.priority, PRIORITY[reason]);
    return;
  }
  map.set(key, { name, qty, unit, reason, priority: PRIORITY[reason], sources: source ? [source] : [] });
}

// Everything the week needs that the kitchen does not already have.
export function weeklyNeeds(state, catalog) {
  const stock = structuredClone(state.inventory);
  const needs = new Map();

  for (const extra of state.extras || []) {
    const base = toBase(extra.qty, extra.unit);
    addNeed(needs, extra.name, base.qty, base.unit, 'manual', 'added by you', catalog);
  }

  for (const planned of state.plan || []) {
    const recipe = state.recipes.find((r) => r.id === planned.recipeId);
    if (!recipe) continue;
    for (const ing of recipeNeeds(recipe, planned.servings)) {
      if (ing.optional) continue;
      const short = consume(stock, ing.name, ing.base.qty, ing.base.unit, catalog);
      if (short > 0) addNeed(needs, ing.name, short, ing.base.unit, 'plan', recipe.name, catalog);
    }
  }

  // Restock what will be below its restock level once the planned meals are
  // cooked. Count every entry for the same food, whatever unit it is in.
  const seen = new Set();
  for (const item of stock) {
    if (item.par == null) continue;
    const key = canonicalName(item.name, catalog);
    if (seen.has(key)) continue;
    seen.add(key);
    const target = toBase(item.par, item.unit);
    const gap = target.qty - available(stock, item.name, target.unit, catalog);
    if (gap > 1e-6) addNeed(needs, item.name, gap, target.unit, 'restock', 'restock level', catalog);
  }
  return [...needs.values()];
}

// The budget left for the week is the weekly budget minus what the spending
// log says you've already spent this week.
export function buildShoppingList(state, catalog = effectiveCatalog(state), { on = today() } = {}) {
  const weekly = Number(state.settings?.budget ?? 150);
  const spent = spentInWeek({ spending: state.spending || [] }, on);
  const budget = Math.max(0, round2(weekly - spent));
  const needs = weeklyNeeds(state, catalog);
  const priced = needs.map((need) => {
    const price = priceFor(need.name, need.qty, need.unit, catalog);
    return {
      ...need,
      need: formatQty(need.qty, need.unit),
      buy: price?.buy ?? formatQty(need.qty, need.unit),
      cost: price?.cost ?? null,
      buyQty: price?.buyQty ?? need.qty,
      buyUnit: price?.buyUnit ?? need.unit,
      category: price?.entry.category ?? 'other',
      priceLabel: price?.entry.statcan ?? null,
      store: price?.entry.store ?? null,
      until: price?.entry.until ?? null,
    };
  });
  priced.sort((a, b) => a.priority - b.priority || (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name));

  let total = 0;
  const items = [];
  const over = [];
  for (const item of priced) {
    const cost = item.cost ?? 0;
    if (total + cost <= budget + 1e-9) {
      total += cost;
      items.push(item);
    } else {
      over.push(item);
    }
  }
  return {
    budget,
    weekly,
    spent,
    total: round2(total),
    remaining: round2(budget - total),
    items,
    over,
    overTotal: round2(over.reduce((sum, i) => sum + (i.cost ?? 0), 0)),
    unpriced: priced.filter((i) => i.cost == null).map((i) => i.name),
  };
}

function plannedServings(plan) {
  return plan.reduce((sum, p) => sum + Number(p.servings || 0), 0);
}

// Fill the week's plan with the recipes that add the least to the shopping
// bill, given what is already in the kitchen, until there are enough
// servings for the week or the budget runs out. Each recipe is used once
// before any repeats.
export function autoPlan(state, catalog = effectiveCatalog(state)) {
  const people = Number(state.settings?.people ?? 1);
  const meals = Number(state.settings?.mealsPerWeek ?? 14);
  const target = people * meals;
  const plan = [...(state.plan || [])];
  const candidates = state.recipes.filter((r) => !r.tags?.includes('breakfast') && !r.tags?.includes('snack'));
  const pool = candidates.length ? candidates : state.recipes;
  if (!pool.length) return { plan, reason: 'Add some recipes first.' };

  const listFor = (p) => buildShoppingList({ ...state, plan: p }, catalog);
  // Cost of what the plan itself (and hand-added items) put on the list.
  const planCost = (list) => [...list.items, ...list.over]
    .filter((i) => i.priority <= PRIORITY.plan)
    .reduce((sum, i) => sum + (i.cost ?? 0), 0);

  // With nutrition targets set, a recipe's cost per serving is weighed against
  // how much of a meal's share of the day's calories and protein it gives
  // (a third of each, for three meals a day), so cheap but small meals don't
  // win over filling ones.
  const targets = dailyTargets(state.profile || {});
  const nutrition = targets ? servingNutritionMap(pool, catalog) : null;
  const fit = (recipe) => {
    if (!nutrition) return 1;
    const n = nutrition.get(recipe.id);
    const kcal = Math.min(1, n.kcal / (targets.kcal / 3));
    const protein = Math.min(1, n.protein / (targets.protein[0] / 3));
    return Math.max(0.05, (kcal + protein) / 2);
  };
  // Lower is better. Meals made from what you already have (no added cost)
  // come first, the most filling of them first.
  const score = (cost, recipe) => (cost <= 0 ? -fit(recipe) : cost / fit(recipe));

  let reason = targets
    ? 'Planned enough servings for the week, favouring meals that give the most calories and protein for the money.'
    : 'Planned enough servings for the week.';
  while (plannedServings(plan) < target) {
    const current = listFor(plan);
    const used = new Set(plan.map((p) => p.recipeId));
    const fresh = pool.filter((r) => !used.has(r.id));
    const choices = fresh.length ? fresh : pool;
    let best = null;
    for (const recipe of choices) {
      const trial = [...plan, { id: `trial-${recipe.id}`, recipeId: recipe.id, servings: recipe.servings }];
      const list = listFor(trial);
      // Skip a recipe if it would push anything new off the list.
      if (list.over.length > current.over.length) continue;
      const perServing = (planCost(list) - planCost(current)) / recipe.servings;
      const value = score(perServing, recipe);
      if (!best || value < best.value) best = { recipe, value };
    }
    if (!best) {
      reason = 'Stopped early: another meal would push the list over budget.';
      break;
    }
    plan.push({ id: `plan-${best.recipe.id}-${plan.length}`, recipeId: best.recipe.id, servings: best.recipe.servings });
  }
  return { plan, reason };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
