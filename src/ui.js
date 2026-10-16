// Small HTML helpers shared by the screens.

import { UNIT_KEYS, UNITS } from './units.js';

export const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' }));
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const unitOptions = (selected = 'ea') => UNIT_KEYS.map((u) => `<option value="${u}" ${u === selected ? 'selected' : ''}>${UNITS[u].label}</option>`).join('');
export const unitLabel = (u) => UNITS[u]?.label ?? u;

// "35 min (10 prep, 25 cook)", or '' when the recipe has no times.
export function recipeTime(recipe) {
  const prep = Number(recipe.prepMin) || 0;
  const cook = Number(recipe.cookMin) || 0;
  if (!prep && !cook) return '';
  const total = prep + cook;
  const label = total >= 60 ? `${Math.floor(total / 60)} h${total % 60 ? ` ${total % 60} min` : ''}` : `${total} min`;
  return prep && cook ? `${label} (${prep} prep, ${cook} cook)` : label;
}

export function recipeSteps(recipe, summary = 'How to make it') {
  if (!recipe.steps?.length) return '';
  return `<details class="steps"><summary>${esc(summary)}</summary><ol>${recipe.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></details>`;
}
