// Recipes from TheMealDB (https://www.themealdb.com), a free recipe database
// with a JSON API that browsers can call directly. Its terms allow copying
// what the API returns as long as TheMealDB is credited as the source:
// https://www.themealdb.com/terms_of_use.php
// The free key "1" is for development and personal use; publishing an app
// to an app store needs a supporter key, which can be set here instead.
//
// TheMealDB gives ingredients, measures and instructions but no servings or
// cooking times, so those are estimated: servings default to 4, and the
// time is added up from the minutes and hours the steps mention.

import { normalizeUnit, UNITS } from './units.js';
import { newId } from './inventory.js';

export const MEALDB_CREDIT = { name: 'TheMealDB', url: 'https://www.themealdb.com/' };
const API = (key) => `https://www.themealdb.com/api/json/v1/${encodeURIComponent(key || '1')}`;

export async function searchByIngredient(ingredient, { key, fetchImpl = fetch } = {}) {
  const name = String(ingredient).trim().toLowerCase().replace(/\s+/g, '_');
  if (!name) return [];
  const res = await fetchImpl(`${API(key)}/filter.php?i=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`TheMealDB answered ${res.status}`);
  const data = await res.json();
  return (data.meals || []).map((m) => ({ id: m.idMeal, name: m.strMeal, thumb: m.strMealThumb }));
}

export async function fetchRecipe(id, { key, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`${API(key)}/lookup.php?i=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`TheMealDB answered ${res.status}`);
  const meal = (await res.json()).meals?.[0];
  if (!meal) throw new Error('Recipe not found');
  return mealToRecipe(meal);
}

// Seasonings and garnishes never block a suggestion.
const OPTIONAL = /\b(salt|black pepper|white pepper|peppercorn|spice|seasoning|powder|paprika|cumin|oregano|basil|thyme|rosemary|parsley|coriander|cilantro|bay lea|cinnamon|nutmeg|ginger|chilli flake|chili flake|red pepper flake|garam masala|turmeric|vanilla|sauce|vinegar|mustard|stock cube|bouillon|water|ice)\b/;

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };

// "1 1/2 cups", "400g", "2 tbs", "1/2 lb", "3 large" -> { qty, unit } or null.
export function parseMeasure(text) {
  let t = String(text || '').toLowerCase().trim();
  for (const [f, v] of Object.entries(FRACTIONS)) t = t.replace(f, ` ${v}`);
  t = t.trim();
  const m = t.match(/^((?:\d+\/\d+|\d+(?:\.\d+)?)(?:\s+(?:\d+\/\d+|\d*\.\d+))?)\s*([a-z]+)?/);
  if (!m) return null;
  const qty = m[1].split(/\s+/).reduce((sum, part) => {
    const [a, b] = part.split('/');
    return sum + (b ? Number(a) / Number(b) : Number(a));
  }, 0);
  const word = (m[2] || '').replace(/s$/, '');
  const map = { tb: 'tbsp', tbs: 'tbsp', tbl: 'tbsp', tbsp: 'tbsp', tablespoon: 'tbsp', tsp: 'tsp', teaspoon: 'tsp', cup: 'cup', g: 'g', gram: 'g', kg: 'kg', ml: 'ml', l: 'l', litre: 'l', liter: 'l', lb: 'lb', pound: 'lb', oz: 'oz', ounce: 'oz', can: 'can', tin: 'can' };
  let unit = map[word];
  if (unit === 'can') return { qty: qty * 400, unit: 'ml' }; // a typical can; edit if yours differs
  if (!unit) unit = 'ea';
  try { unit = normalizeUnit(unit); } catch { return null; }
  return qty > 0 && UNITS[unit] ? { qty: Math.round(qty * 1000) / 1000, unit } : null;
}

export function splitSteps(text) {
  const clean = String(text || '').replace(/\r/g, '').replace(/\bstep\s*\d+\s*[:.-]?/gi, '\n');
  let parts = clean.split(/\n+/).map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter((s) => s.length > 2);
  if (parts.length === 1) parts = parts[0].split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  return parts;
}

// Add up "10 minutes", "1 hour", "15-20 mins" mentioned in the steps (taking the
// upper end of a range). An estimate only; null when nothing is mentioned.
export function minutesFromSteps(steps) {
  let total = 0;
  for (const step of steps) {
    for (const m of step.matchAll(/(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?)\b/gi)) {
      const n = Number(m[2] || m[1]);
      total += /^h/i.test(m[3]) ? n * 60 : n;
    }
  }
  return total > 0 ? Math.round(total) : null;
}

export function mealToRecipe(meal) {
  const ingredients = [];
  for (let n = 1; n <= 20; n += 1) {
    const raw = (meal[`strIngredient${n}`] || '').trim();
    if (!raw) continue;
    let name = raw.toLowerCase();
    if (name === 'pepper') name = 'black pepper'; // TheMealDB's "Pepper" is the spice
    const measure = (meal[`strMeasure${n}`] || '').trim();
    const parsed = parseMeasure(measure);
    ingredients.push({
      name,
      qty: parsed?.qty ?? 1,
      unit: parsed?.unit ?? 'ea',
      optional: OPTIONAL.test(` ${name} `) || !parsed,
      note: measure && !parsed ? measure : undefined,
    });
  }
  const steps = splitSteps(meal.strInstructions);
  const cook = minutesFromSteps(steps);
  return {
    id: newId('r'), name: meal.strMeal, servings: 4, tags: [meal.strCategory, meal.strArea].filter(Boolean).map((t) => t.toLowerCase()),
    ingredients: ingredients.map(({ note, ...i }) => i), steps, prepMin: 15, cookMin: cook,
    source: { name: 'TheMealDB', url: `https://www.themealdb.com/meal/${meal.idMeal}`, id: meal.idMeal, estimatedTime: true, estimatedServings: true },
    notes: ingredients.filter((i) => i.note).map((i) => `${i.name}: ${i.note}`),
  };
}
