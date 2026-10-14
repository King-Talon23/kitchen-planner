// Inventory: what is in the kitchen, and how cooking a meal changes it.
// Functions here mutate the state they are given; the UI saves afterwards.

import { toBase, normalizeName, normalizeUnit, convertBase, UNITS } from './units.js';

const EPSILON = 1e-6;

export function newId(prefix = 'id') {
  const rand = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}

// Map a food name onto the price catalogue's name when it is a known alias,
// so "rice", "Rice" and "white rice" are all the same item.
export function canonicalName(name, catalog = []) {
  const n = normalizeName(name);
  for (const entry of catalog) {
    if (normalizeName(entry.key) === n) return normalizeName(entry.key);
    if (entry.aliases?.some((a) => normalizeName(a) === n)) return normalizeName(entry.key);
  }
  return n;
}

export function itemBase(item) {
  return toBase(item.qty, item.unit);
}

function matching(inventory, name, catalog) {
  const key = canonicalName(name, catalog);
  return inventory.filter((item) => canonicalName(item.name, catalog) === key);
}

// Total amount of `name` on hand, expressed in `baseUnit`.
export function available(inventory, name, baseUnit, catalog) {
  const key = canonicalName(name, catalog);
  let total = 0;
  for (const item of matching(inventory, name, catalog)) {
    const base = itemBase(item);
    const converted = convertBase(base.qty, base.unit, baseUnit, key);
    if (converted != null) total += converted;
  }
  return total;
}

export function addToInventory(state, { name, qty, unit, location = 'pantry', expires = '', par = null }, catalog = []) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Item needs a name');
  const amount = Number(qty);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Quantity must be a positive number');
  const u = normalizeUnit(unit);
  const key = canonicalName(cleanName, catalog);
  const existing = state.inventory.find(
    (item) => canonicalName(item.name, catalog) === key && normalizeUnit(item.unit) === u && (item.expires || '') === (expires || ''),
  );
  if (existing) {
    existing.qty = round(existing.qty + amount);
    if (par != null && par !== '') existing.par = Number(par);
    if (location) existing.location = location;
    return existing;
  }
  const item = {
    id: newId('inv'), name: cleanName, qty: round(amount), unit: u, location, expires: expires || '',
    par: par == null || par === '' ? null : Number(par),
  };
  state.inventory.push(item);
  return item;
}

// Remove `qtyBase` (in `baseUnit`) of `name`, using the items that expire
// first. Returns how much could not be found (0 when fully covered).
export function consume(inventory, name, qtyBase, baseUnit, catalog) {
  const key = canonicalName(name, catalog);
  let remaining = qtyBase;
  const items = matching(inventory, name, catalog).sort(
    (a, b) => (a.expires || '9999').localeCompare(b.expires || '9999'),
  );
  for (const item of items) {
    if (remaining <= EPSILON) break;
    const base = itemBase(item);
    const have = convertBase(base.qty, base.unit, baseUnit, key);
    if (have == null || have <= EPSILON) continue;
    const take = Math.min(have, remaining);
    remaining -= take;
    // Convert what was taken back into the item's own unit.
    const takenInItemBase = convertBase(take, baseUnit, base.unit, key);
    const factor = UNITS[normalizeUnit(item.unit)].factor;
    item.qty = round(Math.max(0, item.qty - takenInItemBase / factor));
  }
  // Drop empty items unless they carry a restock level, so they reappear on the shopping list.
  for (let idx = inventory.length - 1; idx >= 0; idx--) {
    const item = inventory[idx];
    if (item.qty <= EPSILON && item.par == null) inventory.splice(idx, 1);
  }
  return remaining > EPSILON ? remaining : 0;
}

export function recipeNeeds(recipe, servings) {
  const scale = (Number(servings) || recipe.servings) / recipe.servings;
  return recipe.ingredients.map((ing) => ({ ...ing, base: toBase(ing.qty * scale, ing.unit) }));
}

// Record that a meal was cooked and take its ingredients out of the inventory.
export function logMeal(state, recipe, { servings = recipe.servings, date = today() } = {}, catalog = []) {
  const shortfalls = [];
  for (const ing of recipeNeeds(recipe, servings)) {
    const missing = consume(state.inventory, ing.name, ing.base.qty, ing.base.unit, catalog);
    if (missing > 0 && !ing.optional) shortfalls.push({ name: ing.name, qty: missing, unit: ing.base.unit });
  }
  const entry = { id: newId('meal'), date, recipeId: recipe.id, recipeName: recipe.name, servings: Number(servings) };
  state.history.unshift(entry);
  return { entry, shortfalls };
}

// Items below their restock level, counting every entry for the same food.
export function lowStock(state, catalog = []) {
  return state.inventory.filter((item) => {
    if (item.par == null) return false;
    const target = toBase(item.par, item.unit);
    return available(state.inventory, item.name, target.unit, catalog) < target.qty - EPSILON;
  });
}

export function expiringSoon(state, on = today(), days = 3) {
  const limit = addDays(on, days);
  return state.inventory
    .filter((item) => item.expires && item.qty > 0 && item.expires <= limit)
    .sort((a, b) => a.expires.localeCompare(b.expires));
}

export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}
