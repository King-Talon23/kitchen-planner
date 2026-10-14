// User interface. Renders one tab at a time from the saved state and wires
// up forms and buttons through event delegation.

import { load, save, exportState, importState, defaultState } from './store.js';
import { UNITS, formatQty } from './units.js';
import { money, esc, unitOptions, recipeTime, recipeSteps } from './ui.js';
import { addToInventory, logMeal, lowStock, expiringSoon, newId, today, canonicalName } from './inventory.js';
import { suggestMeals } from './suggest.js';
import { buildShoppingList, effectiveCatalog, autoPlan } from './shopping.js';
import { DEFAULT_PRICES, PRICE_SOURCE } from './data/prices.js';
import { addSpend } from './spending.js';
import { lookupBarcode, rememberBarcode, startScanner } from './barcode.js';
import { parseReceipt, buildReview, applyReceipt, amountFor, recognizeReceipt, prepareImage } from './receipt.js';
import { loadSyncConfig, saveSyncConfig, syncNow, resolveConflict } from './sync.js';
import { CM_PER_IN, LB_PER_KG } from './nutrition.js';
import { renderNutrition, renderSpending, renderStorePrices, renderScanner, renderSync } from './views-more.js';

let state = load();
let tab = sessionGet('tab') || 'today';
let editingRecipeId = null;
let scan = { open: false };
let receipt = {};
let scanner = null;
let syncConfig = loadSyncConfig();
let syncStatus = '';
let syncTimer = null;
let syncing = false;
const app = document.getElementById('app');

const LOCATIONS = ['pantry', 'fridge', 'freezer'];
const catalog = () => effectiveCatalog(state);

function sessionGet(key) {
  try { return sessionStorage.getItem(`kp-${key}`); } catch { return null; }
}
function sessionSet(key, value) {
  try { sessionStorage.setItem(`kp-${key}`, value); } catch { /* private mode */ }
}

function commit(message, { touch = true } = {}) {
  if (touch) state.updatedAt = new Date().toISOString();
  try {
    save(state);
  } catch (err) {
    toast(`Could not save: ${err.message}. Export a backup from Settings.`);
    return;
  }
  render();
  if (message) toast(message);
  if (touch) scheduleSync();
}

// ---------- Sync ----------

function scheduleSync(delay = 4000) {
  if (!syncConfig.token) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => runSync(), delay);
}

async function runSync({ manual = false } = {}) {
  if (!syncConfig.token || syncing || !navigator.onLine) return;
  syncing = true;
  try {
    let result = await syncNow(state, syncConfig);
    if (result.action === 'conflict') {
      const keepHere = confirm('This device and your other device both have changes since the last sync.\n\nOK: keep THIS device\'s data (the other copy is replaced).\nCancel: use the OTHER device\'s data (this copy is replaced).\n\nExport a backup first if you are unsure.');
      result = await resolveConflict(keepHere ? 'local' : 'remote', state, result.remote, result.config);
    }
    syncConfig = result.config;
    saveSyncConfig(syncConfig);
    syncStatus = '';
    if (result.action === 'pulled') {
      state = result.state;
      commit('Updated with changes from your other device.', { touch: false });
    } else {
      if (manual) toast({ created: 'Sync turned on.', pushed: 'Synced.', unchanged: 'Already up to date.' }[result.action]);
      if (tab === 'settings') render();
    }
  } catch (err) {
    syncStatus = `sync failed: ${err.message}`;
    if (manual || tab === 'settings') toast(`Sync failed: ${err.message}`);
    if (tab === 'settings') render();
  } finally {
    syncing = false;
  }
}

let toastTimer;
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ---------- Today ----------

function renderToday() {
  const cat = catalog();
  const expiring = expiringSoon(state, today(), Number(state.settings.expiryWarningDays));
  const suggestions = suggestMeals(state, cat, { days: Number(state.settings.expiryWarningDays) });
  const ready = suggestions.filter((s) => s.canMake);
  const close = suggestions.filter((s) => !s.canMake && s.coverage >= 0.5).slice(0, 5);
  const recent = state.history.slice(0, 5);

  const card = (s) => `
    <li class="card">
      <div class="row space">
        <strong>${esc(s.recipe.name)}</strong>
        <span class="pill">${Math.round(s.coverage * 100)}% on hand</span>
      </div>
      ${recipeTime(s.recipe) ? `<p class="muted small">⏱ ${recipeTime(s.recipe)} · serves ${s.recipe.servings}</p>` : ''}
      ${s.usesExpiring.length ? `<p class="warn">Uses ${esc(s.usesExpiring.join(', '))} before ${s.usesExpiring.length > 1 ? 'they expire' : 'it expires'}</p>` : ''}
      ${s.missing.length ? `<p class="muted">Missing: ${s.missing.map((m) => `${esc(m.name)} (${formatQty(m.qty, m.unit)})`).join(', ')}</p>` : ''}
      ${recipeSteps(s.recipe)}
      <div class="row">
        <button data-action="cook" data-id="${s.recipe.id}">I made this</button>
        <button class="ghost" data-action="plan-add" data-id="${s.recipe.id}">Add to plan</button>
      </div>
    </li>`;

  return `
    ${state.inventory.length === 0 ? `
      <section class="callout">
        <h2>Start by adding what's in your kitchen</h2>
        <p>Add items in the Inventory tab, or load a sample pantry to try things out.</p>
        <button data-action="sample">Load sample pantry</button>
      </section>` : ''}
    ${expiring.length ? `
      <section>
        <h2>Use soon</h2>
        <ul class="chips">${expiring.map((i) => `<li class="chip warn">${esc(i.name)} · ${esc(i.expires)}</li>`).join('')}</ul>
      </section>` : ''}
    <section>
      <h2>You can make now</h2>
      ${ready.length ? `<ul class="cards">${ready.map(card).join('')}</ul>` : '<p class="muted">Nothing fully covered yet. See the close matches below.</p>'}
    </section>
    ${close.length ? `<section><h2>Almost there</h2><ul class="cards">${close.map(card).join('')}</ul></section>` : ''}
    <section>
      <h2>Log something else you ate</h2>
      <form data-form="log" class="row wrap">
        <select name="recipeId" required>${state.recipes.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>
        <label>Servings <input name="servings" type="number" min="0.5" step="0.5" value="2" required></label>
        <label>Date <input name="date" type="date" value="${today()}" required></label>
        <button>Log meal</button>
      </form>
    </section>
    ${recent.length ? `
      <section>
        <h2>Recently cooked</h2>
        <ul class="list">${recent.map((h) => `<li>${esc(h.date)} · ${esc(h.recipeName)} (${h.servings} servings)</li>`).join('')}</ul>
      </section>` : ''}`;
}

// ---------- Inventory ----------

function renderInventory() {
  const low = new Set(lowStock(state, catalog()).map((i) => i.id));
  const groups = LOCATIONS.map((loc) => [loc, state.inventory.filter((i) => (i.location || 'pantry') === loc)]);
  const names = [...new Set(DEFAULT_PRICES.map((p) => p.key))].sort();
  return `
    <section>
      <h2>Add to inventory</h2>
      ${renderScanner(scan)}
      <form data-form="inventory" class="grid">
        <label>Item <input name="name" list="food-names" required autocomplete="off" placeholder="e.g. milk"></label>
        <label>Amount <input name="qty" type="number" min="0" step="any" required></label>
        <label>Unit <select name="unit">${unitOptions('ea')}</select></label>
        <label>Where <select name="location">${LOCATIONS.map((l) => `<option>${l}</option>`).join('')}</select></label>
        <label>Best before <input name="expires" type="date"></label>
        <label title="When you have less than this, it goes on the shopping list">Keep at least <input name="par" type="number" min="0" step="any" placeholder="optional"></label>
        <button>Add</button>
      </form>
      <datalist id="food-names">${names.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
    </section>
    ${groups.map(([loc, items]) => `
      <section>
        <h2 class="cap">${loc} <span class="muted">(${items.length})</span></h2>
        ${items.length ? `
        <table class="table">
          <thead><tr><th>Item</th><th>Amount</th><th>Best before</th><th>Keep at least</th><th></th></tr></thead>
          <tbody>${items.map((i) => `
            <tr class="${low.has(i.id) ? 'low' : ''}">
              <td>${esc(i.name)}${low.has(i.id) ? ' <span class="pill warn">low</span>' : ''}</td>
              <td data-label="Amount"><input class="num" type="number" min="0" step="any" value="${i.qty}" data-change="qty" data-id="${i.id}" aria-label="Amount of ${esc(i.name)}"> ${UNITS[i.unit]?.label ?? esc(i.unit)}</td>
              <td data-label="Best before"><input type="date" value="${esc(i.expires)}" data-change="expires" data-id="${i.id}" aria-label="Best before for ${esc(i.name)}"></td>
              <td data-label="Keep at least"><input class="num" type="number" min="0" step="any" value="${i.par ?? ''}" data-change="par" data-id="${i.id}" aria-label="Restock level for ${esc(i.name)}"></td>
              <td><button class="ghost small" data-action="inv-delete" data-id="${i.id}" aria-label="Remove ${esc(i.name)}">✕</button></td>
            </tr>`).join('')}
          </tbody>
        </table>` : '<p class="muted">Empty.</p>'}
      </section>`).join('')}`;
}

// ---------- Plan & shop ----------

function renderPlan() {
  const list = buildShoppingList(state, catalog());
  const servings = state.plan.reduce((s, p) => s + Number(p.servings), 0);
  const target = state.settings.people * state.settings.mealsPerWeek;
  const pct = Math.min(100, (list.total / list.budget) * 100);
  const reasonLabel = { manual: 'added', plan: 'for plan', restock: 'restock' };
  const row = (i) => `
    <li class="shop-item">
      <label class="row"><input type="checkbox" data-action="noop">
        <span><strong>${esc(i.name)}</strong> · buy ${esc(i.buy)}${i.store ? ` <span class="pill">${esc(i.store)}${i.until ? ` until ${esc(i.until.slice(5))}` : ''}</span>` : ''}
          <span class="muted small">(need ${esc(i.need)}; ${esc(reasonLabel[i.reason])}${i.sources.length && i.reason === 'plan' ? `: ${esc(i.sources.join(', '))}` : ''})</span>
        </span>
      </label>
      <span>${money(i.cost)}</span>
    </li>`;

  return `
    <section>
      <div class="row space wrap">
        <h2>This week's meals</h2>
        <div class="row">
          <button data-action="autoplan">Auto-plan the week</button>
          <button class="ghost" data-action="plan-clear">Clear plan</button>
        </div>
      </div>
      <p class="muted">${servings} of ${target} servings planned (${state.settings.people} ${state.settings.people == 1 ? 'person' : 'people'} × ${state.settings.mealsPerWeek} meals). Auto-plan picks the meals that add the least to your bill given what you already have.</p>
      ${state.plan.length ? `<ul class="list">${state.plan.map((p) => {
        const r = state.recipes.find((x) => x.id === p.recipeId);
        return `<li class="row space"><span>${esc(r?.name ?? 'Deleted recipe')} · ${p.servings} servings</span>
          <span class="row"><button class="small" data-action="plan-cook" data-id="${p.id}">Made it</button>
          <button class="ghost small" data-action="plan-remove" data-id="${p.id}" aria-label="Remove from plan">✕</button></span></li>`;
      }).join('')}</ul>` : '<p class="muted">No meals planned yet.</p>'}
      <form data-form="plan" class="row wrap">
        <select name="recipeId">${state.recipes.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>
        <label>Servings <input name="servings" type="number" min="1" step="1" value="4"></label>
        <button class="ghost">Add meal</button>
      </form>
    </section>

    <section>
      <h2>Shopping list</h2>
      <div class="budget">
        <div class="row space"><span>${money(list.total)} of ${money(list.budget)}</span><span>${money(list.remaining)} left</span></div>
        ${list.spent ? `<p class="muted small">${money(list.weekly)} weekly budget minus ${money(list.spent)} already spent this week.</p>` : ''}
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${list.budget}" aria-valuenow="${list.total}"><div style="width:${pct}%"></div></div>
      </div>
      ${list.items.length ? `<ul class="shop">${list.items.map(row).join('')}</ul>` : '<p class="muted">Nothing to buy. Plan some meals or set restock levels in Inventory.</p>'}
      ${list.over.length ? `
        <h3 class="warn">Doesn't fit the budget (${money(list.overTotal)})</h3>
        <p class="muted small">Drop a planned meal, lower a restock level, or raise the budget in Settings.</p>
        <ul class="shop over">${list.over.map(row).join('')}</ul>` : ''}
      ${list.unpriced.length ? `<p class="muted small">No price on file for: ${esc(list.unpriced.join(', '))}. Add one in the Prices tab so the total is accurate.</p>` : ''}
      <div class="row wrap">
        <button data-action="bought">I bought these</button>
        <button class="ghost" data-action="copy-list">Copy list</button>
      </div>
      <p class="muted small">Prices are ${esc(PRICE_SOURCE.name)} averages unless you've set your own. Basic groceries are zero-rated for GST/HST, so no tax is added.</p>
    </section>

    <section>
      <h2>Add something to the list</h2>
      <form data-form="extra" class="row wrap">
        <input name="name" list="food-names-plan" placeholder="Item" required>
        <input name="qty" type="number" min="0" step="any" placeholder="Amount" required class="num">
        <select name="unit">${unitOptions('ea')}</select>
        <button class="ghost">Add</button>
      </form>
      <datalist id="food-names-plan">${DEFAULT_PRICES.map((p) => `<option value="${esc(p.key)}">`).join('')}</datalist>
      ${state.extras.length ? `<ul class="chips">${state.extras.map((e) => `<li class="chip">${esc(e.name)} ${e.qty} ${esc(UNITS[e.unit]?.label ?? e.unit)} <button class="ghost small" data-action="extra-remove" data-id="${e.id}" aria-label="Remove">✕</button></li>`).join('')}</ul>` : ''}
    </section>`;
}

// ---------- Recipes ----------

function renderRecipes() {
  const editing = state.recipes.find((r) => r.id === editingRecipeId);
  const ingRow = (ing = { name: '', qty: '', unit: 'g', optional: false }) => `
    <div class="row ing">
      <input name="ing-name" value="${esc(ing.name)}" placeholder="Ingredient" list="food-names-recipe">
      <input name="ing-qty" type="number" min="0" step="any" value="${esc(ing.qty)}" placeholder="Amount" class="num">
      <select name="ing-unit">${unitOptions(ing.unit)}</select>
      <label class="small"><input type="checkbox" name="ing-optional" ${ing.optional ? 'checked' : ''}> optional</label>
    </div>`;
  return `
    <section>
      <h2>${editing ? `Edit ${esc(editing.name)}` : 'New recipe'}</h2>
      <form data-form="recipe" class="stack">
        <div class="row wrap">
          <label>Name <input name="name" required value="${esc(editing?.name)}"></label>
          <label>Serves <input name="servings" type="number" min="1" step="1" required value="${editing?.servings ?? 4}" class="num"></label>
          <label>Tags <input name="tags" value="${esc(editing?.tags?.join(', '))}" placeholder="dinner, vegetarian"></label>
        </div>
        <div class="row wrap">
          <label>Prep minutes <input name="prepMin" type="number" min="0" step="1" value="${editing?.prepMin ?? ''}" class="num"></label>
          <label>Cook minutes <input name="cookMin" type="number" min="0" step="1" value="${editing?.cookMin ?? ''}" class="num"></label>
        </div>
        <div id="ings">${(editing?.ingredients ?? [undefined, undefined, undefined]).map(ingRow).join('')}</div>
        <p class="muted small">Optional ingredients (spices, garnish) never block a suggestion or go on the shopping list.</p>
        <label>Steps, one per line <textarea name="steps" rows="6" placeholder="Heat the oven to 200°C (400°F).">${esc(editing?.steps?.join('\n') ?? '')}</textarea></label>
        <div class="row">
          <button type="button" class="ghost" data-action="ing-add">Add ingredient</button>
          <button>${editing ? 'Save recipe' : 'Add recipe'}</button>
          ${editing ? '<button type="button" class="ghost" data-action="recipe-cancel">Cancel</button>' : ''}
        </div>
      </form>
      <datalist id="food-names-recipe">${DEFAULT_PRICES.map((p) => `<option value="${esc(p.key)}">`).join('')}</datalist>
      <template id="ing-template">${ingRow()}</template>
    </section>
    <section>
      <h2>Your recipes (${state.recipes.length})</h2>
      <ul class="cards">${state.recipes.map((r) => `
        <li class="card">
          <div class="row space"><strong>${esc(r.name)}</strong><span class="muted small">serves ${r.servings}${recipeTime(r) ? ` · ${recipeTime(r)}` : ''}</span></div>
          <p class="muted small">${r.ingredients.map((i) => `${esc(i.name)} ${i.qty} ${esc(UNITS[i.unit]?.label ?? i.unit)}${i.optional ? ' (optional)' : ''}`).join(' · ')}</p>
          ${recipeSteps(r, 'Steps')}
          <div class="row">
            <button class="ghost small" data-action="recipe-edit" data-id="${r.id}">Edit</button>
            <button class="ghost small" data-action="recipe-delete" data-id="${r.id}">Delete</button>
          </div>
        </li>`).join('')}
      </ul>
    </section>`;
}

// ---------- Prices ----------

function renderPrices() {
  const cat = catalog();
  return `
    <section>
      <h2>Prices</h2>
      <p class="muted">Defaults are Canadian national average retail prices from
        <a href="${PRICE_SOURCE.url}" target="_blank" rel="noopener">${esc(PRICE_SOURCE.name)}</a>.
        Change any price to match your store; clear the box to go back to the default.</p>
      <table class="table">
        <thead><tr><th>Item</th><th>Sold as</th><th>Price (CAD)</th></tr></thead>
        <tbody>${cat.map((p) => `
          <tr>
            <td>${esc(p.key)}${p.custom ? ' <span class="pill">yours</span>' : ''}</td>
            <td class="muted small">${p.perWeight ? 'per kg' : `${p.pack.qty} ${esc(UNITS[p.pack.unit]?.label ?? p.pack.unit)}`}</td>
            <td><input class="num" type="number" min="0" step="0.01" value="${p.price}" data-change="price" data-key="${esc(p.key)}" data-custom="${p.custom ? 1 : ''}" aria-label="Price of ${esc(p.key)}">
              ${p.overridden ? '<span class="pill">edited</span>' : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>
    <section>
      <h2>Add a price for something not listed</h2>
      <form data-form="custom-price" class="row wrap">
        <input name="key" placeholder="Item, e.g. soy sauce" required>
        <input name="qty" type="number" min="0" step="any" placeholder="Pack size" required class="num">
        <select name="unit">${unitOptions('ml')}</select>
        <input name="price" type="number" min="0" step="0.01" placeholder="Price" required class="num">
        <button class="ghost">Add</button>
      </form>
    </section>
    ${renderStorePrices(state)}`;
}

// ---------- Barcode scanning ----------

function closeScanner() {
  scanner?.stop();
  scanner = null;
  scan = { open: false };
}

async function startCamera() {
  scan = { ...scan, scanning: true, message: '', error: false, product: null };
  render();
  const video = document.getElementById('scan-video');
  try {
    scanner = startScanner(video);
    const code = await scanner.result;
    scanner = null;
    if (code) await findProduct(code);
  } catch (err) {
    scanner = null;
    const messages = {
      NotAllowedError: 'Camera permission was denied. Type the barcode number instead.',
      NotFoundError: 'No camera found. Type the barcode number instead.',
    };
    scan = { ...scan, scanning: false, error: true, message: messages[err?.name] ?? err.message };
    render();
  }
}

async function findProduct(code) {
  scan = { ...scan, scanning: false, code, message: 'Looking up…', error: false, product: null };
  render();
  try {
    const product = await lookupBarcode(code, state, catalog());
    scan = product
      ? { ...scan, product, message: product.key ? '' : 'No matching price item; edit the name if you like.' }
      : { ...scan, error: true, message: 'Not found in Open Food Facts. Add it by hand below the scanner.' };
  } catch (err) {
    scan = { ...scan, error: true, message: err.message };
  }
  render();
}

// ---------- Settings ----------

function renderSettings() {
  const s = state.settings;
  return `
    <section>
      <h2>Weekly plan</h2>
      <form data-form="settings" class="grid">
        <label>Weekly budget (CAD) <input name="budget" type="number" min="0" step="1" value="${s.budget}"></label>
        <label>People <input name="people" type="number" min="1" step="1" value="${s.people}"></label>
        <label>Meals to plan per person per week <input name="mealsPerWeek" type="number" min="1" step="1" value="${s.mealsPerWeek}"></label>
        <label>Warn about expiry this many days ahead <input name="expiryWarningDays" type="number" min="0" step="1" value="${s.expiryWarningDays}"></label>
        <button>Save settings</button>
      </form>
    </section>
    <section>
      <h2>Backup</h2>
      <p class="muted">Your data is stored only in this browser. Export a backup now and then, and to move to another device.
        ${state.lastBackup ? `Last backup: ${esc(state.lastBackup.slice(0, 10))}.` : 'No backup yet.'}</p>
      <div class="row wrap">
        <button data-action="export">Export backup</button>
        <label class="button ghost">Import backup <input type="file" accept="application/json,.json" data-change="import" hidden></label>
        <button class="ghost danger" data-action="reset">Erase everything</button>
      </div>
    </section>
    ${renderSync(syncConfig, syncStatus)}`;
}

const VIEWS = {
  today: renderToday, inventory: renderInventory, plan: renderPlan, recipes: renderRecipes, prices: renderPrices,
  nutrition: () => renderNutrition(state, catalog()), spending: () => renderSpending(state, receipt, catalog()), settings: renderSettings,
};

function render() {
  if (!VIEWS[tab]) tab = 'today';
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  app.innerHTML = VIEWS[tab]();
}

// ---------- Actions ----------

const SAMPLE_PANTRY = [
  ['white rice', 2, 'kg', 'pantry', null, 0.5], ['pasta', 500, 'g', 'pantry', null, 500], ['canned tomatoes', 796, 'ml', 'pantry'],
  ['canned beans', 540, 'ml', 'pantry'], ['vegetable oil', 1, 'l', 'pantry'], ['flour', 2, 'kg', 'pantry'], ['sugar', 1, 'kg', 'pantry'],
  ['onion', 4, 'ea', 'pantry'], ['potato', 1.5, 'kg', 'pantry'], ['carrot', 6, 'ea', 'fridge'], ['egg', 10, 'ea', 'fridge', 2, 12],
  ['milk', 2, 'l', 'fridge', 4, 2], ['butter', 300, 'g', 'fridge', 21], ['cheese', 400, 'g', 'fridge', 14], ['pepper', 2, 'ea', 'fridge', 4],
  ['mushroom', 227, 'g', 'fridge', 2], ['bread', 675, 'g', 'pantry', 5, 675], ['banana', 6, 'ea', 'pantry', 4, 6],
  ['ground beef', 450, 'g', 'freezer', 60], ['frozen mixed vegetables', 750, 'g', 'freezer'], ['frozen peas', 750, 'g', 'freezer'],
];

function loadSample() {
  const cat = catalog();
  for (const [name, qty, unit, location, days, par] of SAMPLE_PANTRY) {
    const expires = days ? addDaysISO(days) : '';
    addToInventory(state, { name, qty, unit, location, expires, par: par ?? null }, cat);
  }
  commit('Sample pantry loaded. Edit or remove anything in Inventory.');
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
}

function cook(recipe, servings, date) {
  const { shortfalls } = logMeal(state, recipe, { servings, date }, catalog());
  const note = shortfalls.length
    ? ` You didn't have enough ${shortfalls.map((s) => s.name).join(', ')}, so check those amounts in Inventory.`
    : '';
  commit(`Logged ${recipe.name}. Inventory updated.${note}`);
}

const CATEGORY_LOCATION = { frozen: 'freezer', meat: 'fridge', dairy: 'fridge', fridge: 'fridge' };

// Move everything on the list (within budget) into the inventory, using the
// amount actually bought (whole packs) rather than the amount needed.
function boughtEverything() {
  const cat = catalog();
  const list = buildShoppingList(state, cat);
  for (const item of list.items) {
    const existing = state.inventory.find((i) => canonicalName(i.name, cat) === canonicalName(item.name, cat));
    addToInventory(state, {
      name: existing?.name ?? item.name,
      qty: item.buyQty,
      unit: item.buyUnit,
      location: existing?.location ?? CATEGORY_LOCATION[item.category] ?? 'pantry',
    }, cat);
  }
  const boughtManual = new Set(list.items.filter((i) => i.reason === 'manual').map((i) => canonicalName(i.name, cat)));
  state.extras = state.extras.filter((e) => !boughtManual.has(canonicalName(e.name, cat)));
  const paid = prompt('What did you pay in total? (Leave blank to skip the spending log.)', list.total.toFixed(2));
  let note = '';
  if (paid != null && paid.trim() !== '' && Number.isFinite(Number(paid))) {
    addSpend(state, { amount: Number(paid), store: [...new Set(list.items.map((i) => i.store).filter(Boolean))].join(', '), note: `${list.items.length} items` });
    note = ` Logged ${money(Number(paid))} in Spending.`;
  }
  commit(`Added ${list.items.length} items to inventory.${note}`);
}

function listAsText() {
  const list = buildShoppingList(state, catalog());
  return [`Shopping list (${money(list.total)} of ${money(list.budget)})`, ...list.items.map((i) => `- ${i.name}: ${i.buy} (${money(i.cost)})`)].join('\n');
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener('click', async (event) => {
  const tabButton = event.target.closest('[data-tab]');
  if (tabButton) {
    tab = tabButton.dataset.tab;
    sessionSet('tab', tab);
    editingRecipeId = null;
    closeScanner();
    render();
    app.focus();
    return;
  }
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const { action, id } = el.dataset;
  const recipe = state.recipes.find((r) => r.id === id);

  switch (action) {
    case 'sample': return loadSample();
    case 'cook': return cook(recipe, recipe.servings, today());
    case 'plan-add':
      state.plan.push({ id: newId('plan'), recipeId: id, servings: recipe.servings });
      return commit(`Added ${recipe.name} to this week's plan.`);
    case 'plan-remove':
      state.plan = state.plan.filter((p) => p.id !== id);
      return commit();
    case 'plan-clear':
      state.plan = [];
      return commit('Plan cleared.');
    case 'plan-cook': {
      const planned = state.plan.find((p) => p.id === id);
      const r = state.recipes.find((x) => x.id === planned.recipeId);
      state.plan = state.plan.filter((p) => p.id !== id);
      if (r) return cook(r, planned.servings, today());
      return commit();
    }
    case 'autoplan': {
      const { plan, reason } = autoPlan(state, catalog());
      state.plan = plan;
      return commit(reason);
    }
    case 'bought': return boughtEverything();
    case 'scan-open':
      scan = { open: true };
      render();
      if ('BarcodeDetector' in window || navigator.mediaDevices?.getUserMedia) startCamera();
      return;
    case 'scan-close':
      closeScanner();
      return render();
    case 'scan-start': return startCamera();
    case 'spend-delete':
      state.spending = state.spending.filter((s) => s.id !== id);
      return commit();
    case 'store-price-delete':
      state.storePrices = state.storePrices.filter((p) => p.id !== id);
      return commit();
    case 'sync-now': return runSync({ manual: true });
    case 'sync-off':
      if (!confirm('Turn off sync on this device? Your data stays here and in the gist.')) return;
      syncConfig = { token: '', gistId: '', lastSynced: null, lastSyncAt: null };
      saveSyncConfig(syncConfig);
      return render();
    case 'copy-list':
      try {
        await navigator.clipboard.writeText(listAsText());
        toast('Shopping list copied.');
      } catch {
        toast('Copy is not available here.');
      }
      return;
    case 'extra-remove':
      state.extras = state.extras.filter((e) => e.id !== id);
      return commit();
    case 'inv-delete':
      state.inventory = state.inventory.filter((i) => i.id !== id);
      return commit();
    case 'ing-add':
      document.getElementById('ings').insertAdjacentHTML('beforeend', document.getElementById('ing-template').innerHTML);
      return;
    case 'recipe-edit':
      editingRecipeId = id;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    case 'recipe-cancel':
      editingRecipeId = null;
      return render();
    case 'recipe-delete':
      if (!confirm(`Delete ${recipe.name}?`)) return;
      state.recipes = state.recipes.filter((r) => r.id !== id);
      state.plan = state.plan.filter((p) => p.recipeId !== id);
      return commit('Recipe deleted.');
    case 'export':
      download(`kitchen-planner-${today()}.json`, exportState(state));
      state.lastBackup = new Date().toISOString();
      return commit('Backup downloaded.');
    case 'receipt-cancel':
      receipt = {};
      return render();
    case 'receipt-save': {
      const { prices, added } = applyReceipt(state, receipt.review, catalog(), { addToInventory, addSpend, newId });
      const total = Number(receipt.review.total) || 0;
      receipt = {};
      return commit(`Saved: ${money(total)} spent, ${added} ${added === 1 ? 'item' : 'items'} stocked, ${prices} store ${prices === 1 ? 'price' : 'prices'} updated.`);
    }
    case 'reset':
      if (!confirm('Erase all inventory, recipes, plans and history? Export a backup first if you might want it.')) return;
      state = defaultState();
      return commit('Everything erased.');
    default:
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-form]');
  if (!form) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  try {
    switch (form.dataset.form) {
      case 'inventory':
        addToInventory(state, data, catalog());
        commit(`Added ${data.name}.`);
        document.querySelector('[data-form="inventory"] [name="name"]')?.focus();
        return;
      case 'log': {
        const recipe = state.recipes.find((r) => r.id === data.recipeId);
        return cook(recipe, Number(data.servings), data.date);
      }
      case 'plan':
        state.plan.push({ id: newId('plan'), recipeId: data.recipeId, servings: Number(data.servings) });
        return commit();
      case 'extra':
        if (!UNITS[data.unit]) throw new Error('Pick a unit');
        state.extras.push({ id: newId('extra'), name: data.name.trim(), qty: Number(data.qty), unit: data.unit });
        return commit(`Added ${data.name} to the list.`);
      case 'recipe': return saveRecipe(form, data);
      case 'custom-price':
        state.customPrices = state.customPrices.filter((p) => p.key !== data.key.trim().toLowerCase());
        state.customPrices.push({
          key: data.key.trim().toLowerCase(), statcan: 'Your price', price: Number(data.price),
          pack: { qty: Number(data.qty), unit: data.unit }, aliases: [], perWeight: false, category: 'other', custom: true,
        });
        return commit(`Price added for ${data.key}.`);
      case 'spend':
        addSpend(state, data);
        return commit(`Recorded ${money(Number(data.amount))}.`);
      case 'store-price': {
        const price = Number(data.price);
        const qty = Number(data.qty);
        if (!(price >= 0) || !(qty > 0)) throw new Error('Enter a price and an amount');
        if (!UNITS[data.unit]) throw new Error('Pick a unit');
        state.storePrices.push({
          id: newId('sp'), key: data.key.trim().toLowerCase(), store: data.store.trim(), price, qty, unit: data.unit,
          perWeight: Boolean(data.perWeight), until: data.until || '', seen: today(),
        });
        return commit(`Saved the ${data.store.trim()} price for ${data.key.trim()}.`);
      }
      case 'profile': {
        const inches = Number(data.ft || 0) * 12 + Number(data.in || 0);
        Object.assign(state.profile, {
          sex: data.sex, age: data.age === '' ? '' : Number(data.age), activity: data.activity, goal: data.goal,
          heightCm: inches ? Math.round(inches * CM_PER_IN * 10) / 10 : '',
          weightKg: data.lb === '' ? '' : Math.round((Number(data.lb) / LB_PER_KG) * 1000) / 1000,
          goalWeightKg: data.goalLb === '' ? '' : Math.round((Number(data.goalLb) / LB_PER_KG) * 1000) / 1000,
        });
        return commit('Details saved.');
      }
      case 'scan-code':
        if (!data.code.trim()) return;
        scanner?.stop();
        findProduct(data.code.trim());
        return;
      case 'scan-add': {
        const item = addToInventory(state, data, catalog());
        if (scan.product) rememberBarcode(state, { ...scan.product, name: item.name, key: scan.product.key, qty: Number(data.qty), unit: data.unit });
        closeScanner();
        return commit(`Added ${item.name}.`);
      }
      case 'sync':
        syncConfig = { ...syncConfig, token: data.token.trim() };
        saveSyncConfig(syncConfig);
        render();
        runSync({ manual: true });
        return;
      case 'settings':
        for (const key of ['budget', 'people', 'mealsPerWeek', 'expiryWarningDays']) state.settings[key] = Number(data[key]);
        return commit('Settings saved.');
      default:
    }
  } catch (err) {
    toast(err.message);
  }
});

function saveRecipe(form, data) {
  const names = form.querySelectorAll('[name="ing-name"]');
  const qtys = form.querySelectorAll('[name="ing-qty"]');
  const units = form.querySelectorAll('[name="ing-unit"]');
  const opts = form.querySelectorAll('[name="ing-optional"]');
  const ingredients = [...names].map((n, idx) => ({
    name: n.value.trim(), qty: Number(qtys[idx].value), unit: units[idx].value, optional: opts[idx].checked,
  })).filter((i) => i.name && i.qty > 0);
  if (!ingredients.length) throw new Error('Add at least one ingredient with an amount');
  const recipe = {
    id: editingRecipeId ?? newId('r'), name: data.name.trim(), servings: Number(data.servings),
    tags: String(data.tags || '').split(',').map((t) => t.trim()).filter(Boolean), ingredients,
    prepMin: data.prepMin === '' ? null : Number(data.prepMin), cookMin: data.cookMin === '' ? null : Number(data.cookMin),
    steps: String(data.steps || '').split('\n').map((t) => t.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean),
  };
  const idx = state.recipes.findIndex((r) => r.id === recipe.id);
  if (idx >= 0) state.recipes[idx] = recipe;
  else state.recipes.push(recipe);
  editingRecipeId = null;
  commit(`Saved ${recipe.name}.`);
}

document.addEventListener('change', async (event) => {
  const el = event.target.closest('[data-change]');
  if (!el) return;
  const { change, id, key } = el.dataset;
  if (change === 'import') {
    const file = el.files?.[0];
    if (!file) return;
    try {
      state = importState(await file.text());
      commit('Backup restored.');
    } catch (err) {
      toast(`Could not import: ${err.message}`);
    }
    return;
  }
  if (change === 'receipt-photo') return readReceipt(el.files?.[0]);
  if (change === 'receipt-meta') {
    receipt.review[el.dataset.field] = el.dataset.field === 'total' ? (el.value === '' ? '' : Number(el.value)) : el.value;
    return;
  }
  if (change === 'receipt-row') {
    const row = receipt.review.rows.find((r) => r.idx === Number(el.dataset.idx));
    const field = el.dataset.field;
    if (field === 'key') {
      row.key = el.value || null;
      Object.assign(row, amountFor(row, catalog().find((e) => e.key === row.key)));
    } else if (field === 'addToInventory') row.addToInventory = el.checked;
    else if (field === 'qty') row.qty = el.value === '' ? '' : Number(el.value);
    else row[field] = el.value;
    return render();
  }
  if (change === 'price') {
    if (el.dataset.custom) {
      const entry = state.customPrices.find((p) => p.key === key);
      if (entry && el.value !== '') entry.price = Number(el.value);
    } else {
      const def = DEFAULT_PRICES.find((p) => p.key === key);
      if (el.value === '' || Number(el.value) === def.price) delete state.priceOverrides[key];
      else state.priceOverrides[key] = Number(el.value);
    }
    return commit();
  }
  const item = state.inventory.find((i) => i.id === id);
  if (!item) return;
  if (change === 'qty') item.qty = Math.max(0, Number(el.value) || 0);
  if (change === 'expires') item.expires = el.value;
  if (change === 'par') item.par = el.value === '' ? null : Number(el.value);
  commit();
});

// Read a receipt photo on the device, then show the matches for checking.
async function readReceipt(file) {
  if (!file) return;
  receipt = { busy: 'Loading the text reader (first time only)…', progress: 0 };
  render();
  try {
    const image = await prepareImage(file);
    const text = await recognizeReceipt(image, (progress) => {
      receipt = { busy: 'Reading the receipt…', progress };
      render();
    });
    const parsed = parseReceipt(text);
    if (!parsed.items.length) throw new Error('No priced lines found. Try a flatter, closer photo in good light.');
    receipt = { review: buildReview(parsed, catalog(), state.receiptAliases) };
  } catch (err) {
    console.error(err);
    receipt = { error: err.message?.startsWith('No priced') ? err.message : `Could not read the receipt: ${err.message || err}` };
  }
  render();
}

// Ask the browser not to clear our data under storage pressure.
navigator.storage?.persist?.().catch(() => {});

// Pick up changes from the other device when the app opens or comes back.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') scheduleSync(0);
});
scheduleSync(0);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Offline mode unavailable', err));
}

render();
