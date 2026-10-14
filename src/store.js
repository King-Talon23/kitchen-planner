// Saving and loading. Everything lives in the browser's localStorage under
// one key, with JSON export/import for backups and moving between devices.

import { DEFAULT_RECIPES } from './data/recipes.js';

export const STORAGE_KEY = 'kitchen-planner/v1';
export const SCHEMA_VERSION = 1;

// The starter recipes the first version shipped with. Saves from before
// starterIds existed have already seen these, so a deleted one stays deleted.
const FIRST_STARTERS = ['r-bolognese', 'r-chicken-stirfry', 'r-sheetpan-thighs', 'r-chili', 'r-lentil-soup', 'r-salmon-rice', 'r-tofu-stirfry',
  'r-pork-sweetpotato', 'r-quesadillas', 'r-tuna-pasta', 'r-omelette', 'r-pancakes', 'r-grilled-cheese', 'r-fried-rice'];

export function defaultState() {
  return {
    version: SCHEMA_VERSION,
    inventory: [],
    recipes: structuredClone(DEFAULT_RECIPES),
    starterIds: DEFAULT_RECIPES.map((r) => r.id),
    plan: [],
    extras: [],
    history: [],
    eaten: [],
    weights: [],
    priceOverrides: {},
    customPrices: [],
    storePrices: [],
    spending: [],
    barcodes: {},
    receiptAliases: {},
    profile: { sex: '', age: '', heightCm: '', weightKg: '', goalWeightKg: '', activity: 'light', goal: 'gain', units: 'imperial' },
    updatedAt: null,
    settings: { budget: 150, people: 1, mealsPerWeek: 14, expiryWarningDays: 3, mealTimes: { breakfast: '08:00', lunch: '12:30', dinner: '18:30', snack: '15:30' } },
    lastBackup: null,
  };
}

// Fill in anything missing so older or hand-edited saves still load.
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Not a kitchen planner save file');
  const base = defaultState();
  const state = { ...base, ...raw, settings: { ...base.settings, ...(raw.settings || {}) } };
  for (const key of ['inventory', 'recipes', 'plan', 'extras', 'history', 'eaten', 'weights', 'customPrices', 'storePrices', 'spending']) {
    if (!Array.isArray(state[key])) throw new Error(`Save file has an invalid "${key}" list`);
  }
  if (typeof state.priceOverrides !== 'object' || state.priceOverrides === null) state.priceOverrides = {};
  if (typeof state.barcodes !== 'object' || state.barcodes === null) state.barcodes = {};
  if (typeof state.receiptAliases !== 'object' || state.receiptAliases === null) state.receiptAliases = {};
  state.profile = { ...base.profile, ...(raw.profile || {}) };
  // New starter recipes reach older saves once; ones you deleted stay gone.
  if (!Array.isArray(raw.starterIds)) state.starterIds = Array.isArray(raw.recipes) ? [...FIRST_STARTERS] : base.starterIds;
  for (const starter of DEFAULT_RECIPES) {
    if (state.starterIds.includes(starter.id)) continue;
    if (!state.recipes.some((r) => r.id === starter.id)) state.recipes.push(structuredClone(starter));
    state.starterIds.push(starter.id);
  }
  // Saves made before recipes had steps: fill in the starter recipes' steps and times.
  for (const recipe of state.recipes) {
    const starter = DEFAULT_RECIPES.find((r) => r.id === recipe.id);
    if (!starter || recipe.steps) continue;
    Object.assign(recipe, { prepMin: starter.prepMin, cookMin: starter.cookMin, steps: [...starter.steps] });
  }
  state.version = SCHEMA_VERSION;
  return state;
}

export function load(storage = globalThis.localStorage) {
  let text = null;
  try {
    text = storage?.getItem(STORAGE_KEY);
    return text ? normalizeState(JSON.parse(text)) : defaultState();
  } catch (err) {
    // Keep the unreadable save under another key so the next save cannot destroy it.
    console.error('Could not load saved data, starting fresh', err);
    if (text) storage.setItem(`${STORAGE_KEY}/unreadable-${Date.now()}`, text);
    return defaultState();
  }
}

export function save(state, storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state) {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function importState(text) {
  const { exportedAt, ...rest } = JSON.parse(text);
  return normalizeState(rest);
}
