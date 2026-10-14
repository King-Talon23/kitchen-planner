// Screens and sections for nutrition, spending, store prices, barcode
// scanning and sync. Each returns an HTML string.

import { money, esc, unitOptions, unitLabel } from './ui.js';
import { ACTIVITY, GOALS, LB_PER_KG, CM_PER_IN, dailyTargets, planNutrition, recipeNutrition, valueRanking, profileComplete } from './nutrition.js';
import { spendingSummary, spentInWeek, weekStart } from './spending.js';
import { activeStorePrices, STORE_PRICE_DAYS } from './shopping.js';
import { today } from './inventory.js';
import { DEFAULT_PRICES } from './data/prices.js';
import { NUTRIENT_SOURCE } from './data/nutrients.js';

const pct = (part, whole) => (whole ? Math.min(100, Math.round((part / whole) * 100)) : 0);
const lb = (kg) => (kg === '' || kg == null ? '' : Math.round(Number(kg) * LB_PER_KG * 10) / 10);

// ---------- Nutrition ----------

export function renderNutrition(state, cat) {
  const p = state.profile;
  const heightIn = p.heightCm ? Number(p.heightCm) / CM_PER_IN : '';
  const ft = heightIn === '' ? '' : Math.floor(Math.round(heightIn) / 12);
  const inch = heightIn === '' ? '' : Math.round(heightIn) % 12;
  const t = dailyTargets(p);
  const plan = planNutrition(state, cat);
  const meter = (label, value, target, unit) => `
    <div class="meter">
      <div class="row space"><span>${label}</span><span>${value} / ${target} ${unit}</span></div>
      <div class="bar"><div style="width:${pct(value, target)}%"></div></div>
    </div>`;

  const recipes = state.recipes.map((r) => ({ r, n: recipeNutrition(r, cat) }))
    .sort((a, b) => b.n.perServing.kcal - a.n.perServing.kcal);
  const kcalValue = valueRanking(cat, 'kcal', 8);
  const proteinValue = valueRanking(cat, 'protein', 8);

  return `
    <section>
      <h2>Your details</h2>
      <p class="muted small">Stored only in your app data (and your sync gist if you turn sync on).</p>
      <form data-form="profile" class="grid">
        <label>Sex (for the energy equation)
          <select name="sex"><option value="">Choose</option>
            <option value="male" ${p.sex === 'male' ? 'selected' : ''}>Male</option>
            <option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option></select></label>
        <label>Age <input name="age" type="number" min="14" max="100" value="${esc(p.age)}"></label>
        <label>Height (ft) <input name="ft" type="number" min="3" max="8" value="${ft}"></label>
        <label>Height (in) <input name="in" type="number" min="0" max="11" value="${inch}"></label>
        <label>Weight (lb) <input name="lb" type="number" min="50" max="600" step="0.1" value="${lb(p.weightKg)}"></label>
        <label>Goal weight (lb) <input name="goalLb" type="number" min="50" max="600" step="0.1" value="${lb(p.goalWeightKg)}"></label>
        <label>Activity <select name="activity">${Object.entries(ACTIVITY).map(([k, a]) => `<option value="${k}" ${p.activity === k ? 'selected' : ''}>${esc(a.label)}</option>`).join('')}</select></label>
        <label>Goal <select name="goal">${Object.entries(GOALS).map(([k, g]) => `<option value="${k}" ${p.goal === k ? 'selected' : ''}>${g.label}</option>`).join('')}</select></label>
        <button>Save</button>
      </form>
    </section>

    ${t ? `
    <section>
      <h2>Daily targets</h2>
      <ul class="cards stats">
        <li class="card"><span class="muted small">Calories</span><strong>${t.kcal.toLocaleString()} kcal</strong><span class="muted small">range ${t.kcalRange[0].toLocaleString()}–${t.kcalRange[1].toLocaleString()}; maintenance ≈ ${t.maintenance.toLocaleString()}</span></li>
        <li class="card"><span class="muted small">Protein</span><strong>${t.protein[0]}–${t.protein[1]} g</strong><span class="muted small">1.6–2.2 g per kg</span></li>
        <li class="card"><span class="muted small">Fat</span><strong>${t.fat[0]}–${t.fat[1]} g</strong><span class="muted small">0.5–1.5 g per kg</span></li>
        <li class="card"><span class="muted small">Carbohydrate</span><strong>≈ ${t.carbs} g</strong><span class="muted small">the rest of your calories</span></li>
      </ul>
      ${t.weeksToGoal ? `<p>Aim to gain about ${lb(t.weeklyGainKg[0])}–${lb(t.weeklyGainKg[1])} lb a week, which reaches your goal in roughly ${t.weeksToGoal[0]}–${t.weeksToGoal[1]} weeks. Weigh yourself regularly and add or remove about 100–200 kcal a day if you're gaining slower or faster than that.</p>` : ''}
      <p class="muted small">These are estimates for planning, not medical advice. The equation is typically within about 10% of a measured value.
        Sources: <a href="https://doi.org/10.1016/j.jada.2005.02.005" target="_blank" rel="noopener">Frankenfield 2005</a> (energy equation),
        <a href="https://www.fao.org/3/y5686e/y5686e07.htm" target="_blank" rel="noopener">FAO/WHO/UNU</a> (activity levels),
        <a href="https://doi.org/10.3390/sports7070154" target="_blank" rel="noopener">Iraki 2019</a> (surplus, protein, fat, rate of gain; assumes resistance training),
        <a href="https://doi.org/10.1136/bjsports-2017-097608" target="_blank" rel="noopener">Morton 2018</a> (protein).</p>
    </section>

    <section>
      <h2>What this week's plan gives you per day</h2>
      ${state.plan.length ? `
        ${meter('Calories', plan.kcal, t.kcal, 'kcal')}
        ${meter('Protein', plan.protein, t.protein[0], 'g')}
        <p class="muted">Planned meals cover ${pct(plan.kcal, t.kcal)}% of your calories and ${pct(plan.protein, t.protein[0])}% of your protein.
          ${plan.kcal < t.kcal ? `The other ${(t.kcal - plan.kcal).toLocaleString()} kcal a day come from breakfasts and snacks; the cheapest calories at current prices are listed below.` : ''}</p>`
        : '<p class="muted">Plan some meals in Plan &amp; shop to see how they measure up.</p>'}
    </section>` : `
    <section class="callout">
      <h2>Fill in your details to get targets</h2>
      <p>Sex, age, height and weight are needed for the calorie estimate.</p>
    </section>`}

    <section>
      <h2>Most calories per dollar</h2>
      <p class="muted small">At your current prices. Calorie-dense staples make gaining easier on a budget.</p>
      ${valueTable(kcalValue, 'kcal')}
    </section>
    <section>
      <h2>Most protein per dollar</h2>
      ${valueTable(proteinValue, 'protein')}
    </section>

    <section>
      <h2>Per serving</h2>
      <table class="table">
        <thead><tr><th>Recipe</th><th>kcal</th><th>Protein</th><th>Fat</th><th>Carbs</th></tr></thead>
        <tbody>${recipes.map(({ r, n }) => `
          <tr><td>${esc(r.name)}${n.unknown.length ? ` <span class="muted small">(no data: ${esc(n.unknown.join(', '))})</span>` : ''}</td>
            <td data-label="kcal">${n.perServing.kcal}</td><td data-label="Protein">${n.perServing.protein} g</td>
            <td data-label="Fat">${n.perServing.fat} g</td><td data-label="Carbs">${n.perServing.carbs} g</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="muted small">Nutrient values: ${esc(NUTRIENT_SOURCE)}</p>
    </section>`;
}

function valueTable(rows, kind) {
  if (!rows.length) return '<p class="muted">No data yet.</p>';
  return `<table class="table">
    <thead><tr><th>Food</th><th>${kind === 'kcal' ? 'kcal per $' : 'Protein per $'}</th><th>Buy</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${esc(r.key)}</td>
      <td data-label="${kind === 'kcal' ? 'kcal per $' : 'Protein per $'}">${kind === 'kcal' ? r.kcalPerDollar.toLocaleString() : `${r.proteinPerDollar} g`}</td>
      <td data-label="Buy" class="muted small">${esc(r.buy)} for ${money(r.cost)}</td></tr>`).join('')}</tbody>
  </table>`;
}

// ---------- Spending ----------

export function renderSpending(state, receipt = {}, catalog = []) {
  const summary = spendingSummary(state, { weeks: 8 });
  const thisWeek = spentInWeek(state);
  const budget = Number(state.settings.budget);
  const max = Math.max(budget, ...summary.rows.map((r) => r.spent)) || 1;
  return `
    <section>
      <h2>This week (from ${weekStart()})</h2>
      <div class="budget">
        <div class="row space"><span>${money(thisWeek)} spent of ${money(budget)}</span><span>${money(budget - thisWeek)} left</span></div>
        <div class="bar ${thisWeek > budget ? 'over' : ''}"><div style="width:${pct(thisWeek, budget)}%"></div></div>
      </div>
    </section>
    ${renderReceipt(receipt, catalog)}
    <section>
      <h2>Record a shop</h2>
      <form data-form="spend" class="row wrap">
        <label>Date <input name="date" type="date" value="${today()}" required></label>
        <label>Store <input name="store" list="stores" placeholder="e.g. No Frills"></label>
        <label>Total paid <input name="amount" type="number" min="0" step="0.01" required class="num"></label>
        <label>Note <input name="note" placeholder="optional"></label>
        <button>Save</button>
      </form>
      ${storeList(state)}
    </section>
    <section>
      <h2>Last 8 weeks</h2>
      ${summary.weeksTracked ? `<p class="muted">Average ${money(summary.average)} a week over ${summary.weeksTracked} tracked ${summary.weeksTracked === 1 ? 'week' : 'weeks'}; over budget ${summary.weeksOver} ${summary.weeksOver === 1 ? 'time' : 'times'}.</p>` : ''}
      <ul class="weeks">${summary.rows.map((r) => `
        <li><span class="muted small">${r.start.slice(5)}</span>
          <span class="bar ${r.over ? 'over' : ''}"><span style="width:${pct(r.spent, max)}%"></span><i style="left:${pct(budget, max)}%" title="budget"></i></span>
          <span class="small">${money(r.spent)}</span></li>`).join('')}
      </ul>
    </section>
    <section>
      <h2>All shops</h2>
      ${state.spending.length ? `<ul class="list plain">${state.spending.map((s) => `
        <li class="row space"><span>${esc(s.date)} · ${esc(s.store || 'Store')}${s.note ? ` <span class="muted small">${esc(s.note)}</span>` : ''}</span>
          <span class="row">${money(s.amount)} <button class="ghost small" data-action="spend-delete" data-id="${s.id}" aria-label="Delete">✕</button></span></li>`).join('')}</ul>`
        : '<p class="muted">Nothing recorded yet. "I bought these" on the shopping list asks what you paid, or add a shop above.</p>'}
    </section>`;
}

// ---------- Receipt ----------

function renderReceipt(receipt, catalog) {
  const photo = `<label class="button">${receipt.review ? 'Scan another receipt' : 'Scan a receipt'}
    <input type="file" accept="image/*" capture="environment" data-change="receipt-photo" hidden></label>`;
  if (receipt.busy) {
    return `<section><h2>Receipt</h2><p class="muted">${esc(receipt.busy)}</p>
      <div class="bar"><div style="width:${Math.round((receipt.progress || 0) * 100)}%"></div></div></section>`;
  }
  if (!receipt.review) {
    return `<section><h2>Receipt</h2>
      <p class="muted">Take a photo of your receipt. The text is read on this device, then you check the matches before anything is saved.
        Saving records what you paid, adds the items to your inventory and keeps each price as a store price.</p>
      ${receipt.error ? `<p class="warn">${esc(receipt.error)}</p>` : ''}
      <div class="row wrap">${photo}</div></section>`;
  }
  const r = receipt.review;
  const keys = [...new Set(catalog.map((e) => e.key))].sort();
  const itemsTotal = r.rows.reduce((s, row) => s + row.price, 0);
  return `
    <section>
      <h2>Check this receipt</h2>
      <div class="row wrap">
        <label>Store <input data-change="receipt-meta" data-field="store" value="${esc(r.store)}" list="stores" placeholder="e.g. Food Basics"></label>
        <label>Date <input data-change="receipt-meta" data-field="date" type="date" value="${esc(r.date)}"></label>
        <label>Total paid <input data-change="receipt-meta" data-field="total" type="number" min="0" step="0.01" class="num" value="${r.total ?? ''}"></label>
      </div>
      <p class="muted small">Lines found add up to ${money(itemsTotal)}. Pick "skip" for anything that isn't food you track; skipped names are remembered too.</p>
      <table class="table receipt">
        <thead><tr><th>On receipt</th><th>Price</th><th>Item</th><th>Amount bought</th><th>Stock</th></tr></thead>
        <tbody>${r.rows.map((row) => `
          <tr class="${row.key ? '' : 'muted'}">
            <td data-label="On receipt">${esc(row.text)}</td>
            <td data-label="Price">${money(row.price)}</td>
            <td data-label="Item"><select data-change="receipt-row" data-idx="${row.idx}" data-field="key">
              <option value="">skip</option>${keys.map((k) => `<option${k === row.key ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></td>
            <td ${row.key ? 'data-label="Amount bought"' : ''}>${row.key ? `<span class="row"><input data-change="receipt-row" data-idx="${row.idx}" data-field="qty" type="number" min="0" step="any" class="num" value="${row.qty}" ${row.qty === '' ? 'placeholder="weight?"' : ''}>
              <select data-change="receipt-row" data-idx="${row.idx}" data-field="unit">${unitOptions(row.unit)}</select></span>` : ''}</td>
            <td ${row.key ? 'data-label="Stock"' : ''}>${row.key ? `<input type="checkbox" data-change="receipt-row" data-idx="${row.idx}" data-field="addToInventory" ${row.addToInventory === false ? '' : 'checked'} aria-label="Add to inventory">` : ''}</td>
          </tr>`).join('')}</tbody>
      </table>
      <div class="row wrap">
        <button data-action="receipt-save">Save receipt</button>
        <button class="ghost" data-action="receipt-cancel">Discard</button>
        ${photo}
      </div>
    </section>`;
}

function storeList(state) {
  const stores = [...new Set([...state.spending, ...(state.storePrices || [])].map((s) => s.store).filter(Boolean))];
  return `<datalist id="stores">${stores.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>`;
}

// ---------- Store and flyer prices ----------

export function renderStorePrices(state) {
  const active = new Set(activeStorePrices(state).map((p) => p.id));
  const rows = [...(state.storePrices || [])].sort((a, b) => a.key.localeCompare(b.key));
  return `
    <section>
      <h2>Store and flyer prices</h2>
      <p class="muted">Enter a price from a flyer, shelf tag or receipt. The shopping list uses the cheapest current price for each item and tells you which store it's at.
        A price counts until its sale end date, or for ${STORE_PRICE_DAYS} days after you saw it if there's no end date.</p>
      <form data-form="store-price" class="grid">
        <label>Item <input name="key" list="food-names-store" required placeholder="e.g. chicken thigh"></label>
        <label>Store <input name="store" list="stores" required placeholder="e.g. Food Basics"></label>
        <label>Price <input name="price" type="number" min="0" step="0.01" required></label>
        <label>For <input name="qty" type="number" min="0" step="any" value="1" required></label>
        <label>Unit <select name="unit">${unitOptions('kg')}</select></label>
        <label class="row"><input type="checkbox" name="perWeight"> priced by weight (per kg / lb)</label>
        <label>Sale ends <input name="until" type="date"></label>
        <button>Add price</button>
      </form>
      <datalist id="food-names-store">${DEFAULT_PRICES.map((p) => `<option value="${esc(p.key)}">`).join('')}</datalist>
      ${storeList(state)}
      ${rows.length ? `
      <table class="table">
        <thead><tr><th>Item</th><th>Store</th><th>Price</th><th>Until</th><th></th></tr></thead>
        <tbody>${rows.map((p) => `
          <tr class="${active.has(p.id) ? '' : 'expired'}">
            <td>${esc(p.key)}</td><td data-label="Store">${esc(p.store)}</td>
            <td data-label="Price">${money(p.price)} / ${p.qty} ${esc(unitLabel(p.unit))}</td>
            <td data-label="Until">${p.until ? esc(p.until) : `<span class="muted small">seen ${esc(p.seen)}</span>`}${active.has(p.id) ? '' : ' <span class="pill">expired</span>'}</td>
            <td><button class="ghost small" data-action="store-price-delete" data-id="${p.id}" aria-label="Delete">✕</button></td>
          </tr>`).join('')}
        </tbody>
      </table>` : ''}
    </section>`;
}

// ---------- Barcode scanning ----------

export function renderScanner(scan) {
  if (!scan.open) {
    return `<div class="row wrap"><button class="ghost" data-action="scan-open">Scan a barcode</button></div>`;
  }
  const product = scan.product;
  return `
    <div class="callout scan">
      <div class="row space"><strong>Scan a barcode</strong><button class="ghost small" data-action="scan-close">Close</button></div>
      ${scan.scanning ? '<video id="scan-video" playsinline muted></video><p class="muted small">Point the camera at the barcode.</p>' : ''}
      ${scan.message ? `<p class="${scan.error ? 'warn' : 'muted'}">${esc(scan.message)}</p>` : ''}
      ${product ? `
        <form data-form="scan-add" class="grid">
          <label>Item <input name="name" value="${esc(product.key || product.name)}" required list="food-names"></label>
          <label>Amount <input name="qty" type="number" min="0" step="any" value="${product.qty}" required></label>
          <label>Unit <select name="unit">${unitOptions(product.unit)}</select></label>
          <label>Where <select name="location">${['pantry', 'fridge', 'freezer'].map((l) => `<option>${l}</option>`).join('')}</select></label>
          <label>Best before <input name="expires" type="date"></label>
          <button>Add to inventory</button>
        </form>
        <p class="muted small">${esc(product.brand ? `${product.brand} ` : '')}${esc(product.name)} · barcode ${esc(product.code)}${product.cached ? ' (saved)' : ` · from ${esc(product.source)}`}</p>` : ''}
      <form data-form="scan-code" class="row wrap">
        <input name="code" inputmode="numeric" pattern="[0-9 ]*" placeholder="Or type the barcode number" value="${esc(scan.code || '')}">
        <button class="ghost">Look up</button>
        ${scan.scanning ? '' : '<button type="button" data-action="scan-start">Use camera</button>'}
      </form>
    </div>`;
}

// ---------- Sync ----------

export function renderSync(config, status) {
  const on = Boolean(config.token);
  return `
    <section>
      <h2>Sync between devices</h2>
      <p class="muted">Keeps your phone and laptop in step by saving your data to a secret GitHub Gist. On each device, paste the same token and press Save.
        ${on ? `<br>Status: ${esc(status || (config.lastSyncAt ? `last synced ${new Date(config.lastSyncAt).toLocaleString('en-CA')}` : 'not synced yet'))}.` : ''}</p>
      <details>
        <summary>How to make a token</summary>
        <ol class="small">
          <li>On GitHub go to Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.</li>
          <li>Give it a name and an expiry. In the permissions list (under your account, not a repository), set <strong>Gists</strong> to <strong>Read and write</strong>. Nothing else is needed.</li>
          <li>Copy the token and paste it below.</li>
        </ol>
        <p class="small muted">The token is kept in this browser only and is never included in backups or the gist. Anyone who can run code on this site's address could read it, so give it Gists access only. A secret gist is unlisted, not encrypted: anyone with its link can read it.</p>
      </details>
      <form data-form="sync" class="row wrap">
        <input name="token" type="password" autocomplete="off" placeholder="GitHub token" value="${esc(config.token)}">
        <button>${on ? 'Save' : 'Turn on sync'}</button>
        ${on ? '<button type="button" class="ghost" data-action="sync-now">Sync now</button><button type="button" class="ghost danger" data-action="sync-off">Turn off</button>' : ''}
      </form>
    </section>`;
}
