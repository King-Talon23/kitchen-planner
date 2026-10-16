// Meal ideas built from whatever is in the inventory, including foods the
// starter recipes never mention. Each idea follows a simple template (a
// stir-fry, a sheet-pan roast, a pasta toss...) and fills its slots with
// items you have, favouring food that expires soonest.
//
// Doneness uses Health Canada's safe internal cooking temperatures:
// https://www.canada.ca/en/health-canada/services/general-food-safety-tips/safe-internal-cooking-temperatures.html
// Times are estimates; the thermometer reading is what matters for meat.

import { toBase, convertBase, normalizeName, normalizeUnit } from './units.js';
import { canonicalName, available, today, addDays } from './inventory.js';

// How a protein is cooked and when it's done.
const PROTEINS = [
  { kind: 'poultry', match: /\b(chicken|turkey|duck)\b/, done: 'until it reaches 74°C inside', stirFry: 7, roast: 25, boneInRoast: 40 },
  { kind: 'ground', match: /\b(ground|mince|minced)\b|\bsausage\b/, done: 'until no pink remains and it reaches 71°C (74°C for ground poultry)', stirFry: 8, roast: 25 },
  { kind: 'pork', match: /\b(pork|ham)\b/, done: 'until it reaches 71°C inside', stirFry: 6, roast: 22 },
  { kind: 'beef', match: /\b(beef|steak|sirloin|veal|lamb|bison)\b/, done: 'until it reaches at least 63°C inside for medium-rare (71°C for medium)', stirFry: 4, roast: 20 },
  { kind: 'fish', match: /\b(salmon|cod|tilapia|haddock|trout|halibut|pollock|fish|tuna steak|mackerel|sole)\b/, done: 'until it flakes easily and reaches 70°C', stirFry: 5, roast: 13 },
  { kind: 'shellfish', match: /\b(shrimp|prawn|scallop)\b/, done: 'until pink and opaque all through', stirFry: 3, roast: 8 },
  { kind: 'cured', match: /\b(bacon|wiener|hot dog|kielbasa|pepperoni|chorizo)\b/, done: 'until hot all through', stirFry: 5, roast: 15 },
  { kind: 'canned fish', match: /\b(canned tuna|canned salmon|sardine)\b/, done: 'until hot', stirFry: 2, roast: 0, noCook: true },
  { kind: 'tofu', match: /\b(tofu|tempeh|seitan)\b/, done: 'until golden', stirFry: 9, roast: 25 },
  { kind: 'dried lentil', match: /\b(dried|dry) lentil|\blentil\b(?!.*\bcanned\b)/, done: 'until soft', stirFry: 0, roast: 0, noCook: true, soupOnly: true },
  { kind: 'legume', match: /\b(bean|beans|chickpea|chickpeas|lentil|lentils)\b/, done: 'until hot', stirFry: 4, roast: 25, noCook: true },
  { kind: 'egg', match: /\begg\b/, done: 'until set with no runny egg left (74°C)', stirFry: 3, roast: 0 },
];

const STARCHES = [
  { kind: 'rice', match: /\brice\b/, perServing: 75, unit: 'g', how: 'Rinse the {name}, then simmer it covered with twice its volume of water until tender, {time}, and let it stand 5 minutes.', min: 20, brownMin: 45 },
  { kind: 'pasta', match: /\b(pasta|spaghetti|penne|macaroni|noodle|noodles|fusilli|linguine|rotini|ramen|udon)\b/, perServing: 100, unit: 'g', how: 'Cook the {name} in boiling salted water to the time on the package, usually 8 to 12 minutes, and drain.', min: 12 },
  { kind: 'grain', match: /\b(quinoa|couscous|barley|bulgur|farro)\b/, perServing: 70, unit: 'g', how: 'Cook the {name} to the package directions (couscous takes 5 minutes, quinoa about 15).', min: 15 },
  { kind: 'potato', match: /\b(potato|potatoes|sweet potato|yam|gnocchi)\b/, perServing: 250, unit: 'g', roastable: true, how: 'Cut the {name} into 2 to 3 cm chunks.', min: 0 },
  { kind: 'bread', match: /\b(bread|pita|tortilla|wrap|bagel|bun|naan|flatbread|roll)\b/, perServing: 2, unit: 'ea', how: '', min: 0 },
];

const VEGETABLES = /\b(onion|carrot|celery|pepper|broccoli|cauliflower|zucchini|squash|eggplant|cabbage|kale|spinach|lettuce|romaine|greens|chard|bok choy|mushroom|tomato|cucumber|salad green|pea|peas|corn|green bean|asparagus|brussels|leek|beet|parsnip|turnip|radish|fennel|okra|sprout|edamame|artichoke|mixed vegetables|vegetables|veg|garlic|scallion|green onion|snow pea|snap pea)s?\b/;
const LEAFY = /\b(spinach|kale|lettuce|romaine|greens?|chard|arugula)\b/;
const RAW_OK = /\b(cucumber|tomato|lettuce|romaine|greens?|spinach|arugula|pepper|carrot|celery|radish|avocado)\b/;
const ROOT = /\b(carrot|beet|parsnip|turnip|squash|sweet potato|potato)\b/;
const SALAD_ONLY = /\b(lettuce|romaine|salad green|arugula|mixed green|iceberg)\b/;
const CHEESE = /\b(cheese|cheddar|mozzarella|feta|parmesan)\b/;

const NOT_FOOD_BASE = /\b(sauce|soup|broth|stock|powder|seasoning|juice|flour|oil|butter|dressing|vinegar|crumb|crumbs|cereal|cracker|crackers|chip|chips)\b/;

export function classify(name) {
  const n = ` ${normalizeName(name)} `;
  if (NOT_FOOD_BASE.test(n) || /\b(dry|dried) bean/.test(n)) return { role: 'other' };
  if (/\b(green|string|wax) bean/.test(n)) return { role: 'veg', leafy: false, root: false, rawOk: false };
  const starch = STARCHES.find((s) => s.match.test(n));
  // "sweet potato" is a starch, "canned beans" a protein, "frozen peas" a vegetable.
  if (starch) {
    const how = starch.how.replace('{time}', /\bbrown\b/.test(n) ? '40 to 45 minutes' : 'about 18 minutes');
    return { role: 'starch', ...starch, how };
  }
  const protein = PROTEINS.find((p) => p.match.test(n));
  if (protein) return { role: 'protein', ...protein };
  if (CHEESE.test(n)) return { role: 'cheese' };
  if (VEGETABLES.test(n)) {
    const processed = /\b(canned|frozen|jarred|pickled)\b/.test(n);
    return { role: 'veg', leafy: LEAFY.test(n), root: ROOT.test(n), rawOk: RAW_OK.test(n) && !processed, saladOnly: SALAD_ONLY.test(n), canned: /\bcanned\b/.test(n) };
  }
  return { role: 'other' };
}

// What's in stock, one entry per food, with the role it can play and how
// soon it expires. Spoiled-looking zero quantities are skipped.
export function pantryByRole(state, catalog, on = today()) {
  const seen = new Map();
  for (const item of state.inventory) {
    if (!(item.qty > 0)) continue;
    const key = canonicalName(item.name, catalog);
    const cls = classify(key);
    if (cls.role === 'other') continue;
    const prev = seen.get(key);
    const expires = item.expires || '';
    if (prev) {
      if (expires && (!prev.expires || expires < prev.expires)) prev.expires = expires;
      continue;
    }
    const uncovered = !state.recipes.some((r) => r.ingredients.some((i) => canonicalName(i.name, catalog) === key));
    seen.set(key, { name: key, label: String(item.name).trim().toLowerCase(), unit: normalizeUnit(item.unit), expires, uncovered, ...cls });
  }
  const soon = addDays(on, 3);
  return [...seen.values()]
    .map((f) => ({ ...f, urgent: Boolean(f.expires && f.expires <= soon) }))
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || (a.expires || '9999').localeCompare(b.expires || '9999') || a.name.localeCompare(b.name));
}

// Up to `perServing` × servings of a food, in a unit the inventory can
// match, never more than is on hand.
function amount(state, food, perServing, unit, servings, catalog) {
  const want = toBase(perServing * servings, unit);
  const haveBase = toBase(1, food.unit).unit;
  let qty = convertBase(want.qty, want.unit, haveBase, food.name);
  if (qty == null) qty = haveBase === 'ea' ? Math.max(1, Math.round(servings / 2)) : want.qty; // a count with no known weight
  const have = available(state.inventory, food.name, haveBase, catalog);
  qty = Math.min(qty, have);
  if (haveBase === 'ea') qty = Math.max(1, Math.round(qty));
  else qty = Math.round(qty);
  return qty > 0 ? { name: food.name, qty, unit: haveBase } : null;
}

const join = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Templates. Each takes the chosen foods and returns name, steps and times.
const TEMPLATES = [
  {
    id: 'stirfry',
    fits: (p, v, s) => p && !p.noCook && p.kind !== 'canned fish' && v.length && (!s || ['rice', 'pasta', 'grain'].includes(s.kind)) && (p.kind !== 'egg' || s?.kind === 'rice'),
    build: (p, v, s) => ({
      name: p.kind === 'egg' ? `Egg fried ${s.label} with ${join(v.map((x) => x.label))}` : `${cap(p.label)} and ${join(v.map((x) => x.label))} stir-fry${s ? ` with ${s.label}` : ''}`,
      prepMin: 10,
      cookMin: Math.max(s ? (s.name.includes('brown') ? s.brownMin : s.min) : 0, p.stirFry + 6),
      steps: [
        s ? s.how.replace('{name}', s.label) : null,
        p.kind === 'egg' ? `Cut the ${join(v.map((x) => x.label))} into small pieces.` : `Cut the ${p.label} into bite-sized pieces and the ${join(v.map((x) => x.label))} into strips or small florets.`,
        p.kind === 'egg'
          ? 'Beat the eggs, scramble them in a little oil over medium-high heat until set with no runny egg left (74°C), and set aside.'
          : `Heat a little oil in a large pan over high heat. Stir-fry the ${p.label} about ${p.stirFry} minutes, ${p.done}.`,
        `Add the ${join(v.map((x) => x.label))} and stir-fry 4 to 6 minutes until tender-crisp${p.kind === 'egg' ? ', then return the eggs' : ''}.`,
        `Season with soy sauce or salt and serve${s ? ` over the ${s.label}` : ''}.`,
      ].filter(Boolean),
    }),
  },
  {
    id: 'sheetpan',
    fits: (p, v, s) => p && p.roast > 0 && !['egg', 'canned fish', 'legume'].includes(p.kind) && (v.length || s?.roastable) && (!s || s.roastable),
    build: (p, v, s) => {
      const veg = v.filter((x) => !x.leafy);
      const sides = [s, ...veg].filter(Boolean);
      const rootish = sides.some((x) => x.root || x.kind === 'potato');
      const proteinMin = /\b(thigh|drumstick|leg|wing|whole)\b/.test(p.label) ? p.boneInRoast ?? p.roast : p.roast;
      const sideMin = rootish ? 35 : 25;
      return {
        name: `Sheet-pan ${p.label} with ${join(sides.map((x) => x.label))}`,
        prepMin: 15,
        cookMin: Math.max(proteinMin, sideMin),
        steps: [
          'Heat the oven to 200°C (400°F).',
          `Cut the ${join(sides.map((x) => x.label))} into even 2 to 3 cm pieces, toss with oil, salt and pepper, and spread on a large sheet pan.`,
          sideMin > proteinMin
            ? `Roast the vegetables ${sideMin - proteinMin} minutes on their own first, then add the ${p.label}, oiled and seasoned.`
            : `Add the ${p.label}, oiled and seasoned, to the pan.`,
          `Roast about ${proteinMin} minutes more, turning the vegetables once, ${p.done}.`,
        ],
      };
    },
  },
  {
    id: 'pasta',
    fits: (p, v, s) => s?.kind === 'pasta' && (p || v.length),
    build: (p, v, s) => ({
      name: `${cap(s.label)} with ${join([p?.label, ...v.map((x) => x.label)].filter(Boolean))}`,
      prepMin: 10,
      cookMin: Math.max(s.min, (p && !p.noCook ? p.stirFry : 0) + 6),
      steps: [
        s.how.replace('{name}', s.label) + ' Save a cup of the cooking water before draining.',
        p && !p.noCook ? `Meanwhile cook the ${p.label} in a little oil or butter in a large pan over medium-high heat, about ${p.stirFry} minutes, ${p.done}.` : null,
        v.length ? `Add the ${join(v.map((x) => x.label))}, chopped, and cook 4 to 6 minutes until tender.` : null,
        p?.noCook ? `Stir in the ${p.label} and heat through.` : null,
        `Toss in the ${s.label} with a splash of the cooking water, a knob of butter or some cheese, and season to taste.`,
      ].filter(Boolean),
    }),
  },
  {
    id: 'omelette',
    fits: (p, v) => p?.kind === 'egg' && v.length,
    build: (p, v, s, extras) => ({
      name: `${cap(join(v.map((x) => x.label)))} omelette`,
      prepMin: 5,
      cookMin: 10,
      steps: [
        `Chop the ${join(v.map((x) => x.label))}. Beat the eggs with a pinch of salt.`,
        `Cook the vegetables in a little butter in a non-stick pan over medium heat for 3 to 4 minutes${v.some((x) => x.leafy) ? ', adding leafy greens for the last minute' : ''}.`,
        `Pour in the eggs and cook, lifting the edges, ${p.done}.`,
        `${extras.cheese ? `Add the ${extras.cheese.label}, fold` : 'Fold'} in half and serve${s?.kind === 'bread' ? ` with ${s.label}` : ''}.`,
      ],
    }),
  },
  {
    id: 'soup',
    fits: (p, v) => v.length >= 2 && (!p || ['legume', 'poultry', 'ground', 'cured', 'tofu', 'beef', 'pork'].includes(p.kind)),
    build: (p, v, s) => ({
      name: `${cap(join([...v.map((x) => x.label), p?.label].filter(Boolean)))} soup`,
      prepMin: 15,
      cookMin: p && ['beef'].includes(p.kind) ? 60 : 35,
      steps: [
        `Dice the ${join(v.filter((x) => !x.leafy).map((x) => x.label)) || join(v.map((x) => x.label))}.`,
        p && !p.noCook && p.kind !== 'tofu' ? `Brown the ${p.label} in a little oil in a large pot, then set it aside.` : null,
        'Soften the vegetables in a little oil in the pot over medium heat, about 6 minutes.',
        `Add about 1.5 litres of water or stock${p ? ` and the ${p.label}` : ''}, bring to a boil and simmer ${p?.kind === 'beef' ? '45 to 60 minutes until the meat is tender' : '20 to 25 minutes until everything is tender'}${p && !p.noCook ? ` (${p.done.replace(/^until /, '')})` : ''}.`,
        p?.kind === 'dried lentil' ? `Rinse the ${p.label} before adding them; red lentils take 15 to 20 minutes, green or brown 20 to 25.` : null,
        s && ['pasta', 'rice', 'grain'].includes(s.kind) ? `Add a handful of ${s.label} for the last 12 to 18 minutes.` : null,
        v.some((x) => x.leafy) ? 'Stir in the leafy greens at the end until wilted.' : null,
        'Season to taste. Blend it smooth if you like.',
      ].filter(Boolean),
    }),
  },
  {
    id: 'bowl',
    fits: (p, v, s) => s && ['rice', 'grain'].includes(s.kind) && p && v.length,
    build: (p, v, s, extras) => ({
      name: `${cap(p.label)} ${s.label} bowl with ${join(v.map((x) => x.label))}`,
      prepMin: 10,
      cookMin: Math.max(s.name.includes('brown') ? s.brownMin : s.min, p.noCook ? 5 : p.stirFry + 5),
      steps: [
        s.how.replace('{name}', s.label),
        p.noCook
          ? `Drain the ${p.label}${p.kind === 'legume' ? ', rinse,' : ''} and warm it in a small pot.`
          : `Season the ${p.label} and cook it in a little oil over medium-high heat, about ${p.stirFry} minutes, ${p.done}. Slice if needed.`,
        vegPrep(v),
        `Fill bowls with ${s.label}, the ${p.label} and the vegetables${extras.cheese ? `, topped with ${extras.cheese.label}` : ''}.`,
      ],
    }),
  },
  {
    id: 'wrap',
    fits: (p, v, s) => s?.kind === 'bread' && (p || v.length) && v.some((x) => x.rawOk || x.leafy),
    build: (p, v, s, extras) => ({
      name: `${cap(join([p?.label, ...v.map((x) => x.label)].filter(Boolean)))} ${/pita|tortilla|wrap/.test(s.label) ? 'wraps' : 'sandwiches'}`,
      prepMin: 10,
      cookMin: p && !p.noCook ? p.stirFry + 4 : 0,
      steps: [
        p && !p.noCook ? `Season the ${p.label} and cook it in a little oil over medium-high heat, about ${p.stirFry} minutes, ${p.done}. Let it rest, then slice.` : null,
        p?.noCook ? `Drain the ${p.label} and mash or flake it with a little mayonnaise or oil.` : null,
        v.every((x) => x.leafy) ? `Wash the ${join(v.map((x) => x.label))}.` : `Slice the ${join(v.map((x) => x.label))}.`,
        `Fill the ${s.label} with ${join([p ? `the ${p.label}` : null, 'the vegetables', extras.cheese ? `some ${extras.cheese.label}` : null].filter(Boolean))}. Toast it in a pan if you like.`,
      ].filter(Boolean),
    }),
  },
];

// Per-serving amounts. Legumes are canned (about half a 540 ml can).
const PROTEIN_SERVING = { egg: [2, 'ea'], legume: [270, 'ml'], 'dried lentil': [60, 'g'], 'canned fish': [85, 'g'], cured: [75, 'g'] };

// Build up to `limit` ideas from the inventory, each from a different template
// and led by a different food where possible.
export function mealIdeas(state, catalog, { limit = 4, servings = 2, on = today() } = {}) {
  const foods = pantryByRole(state, catalog, on);
  const proteins = foods.filter((f) => f.role === 'protein');
  const starches = foods.filter((f) => f.role === 'starch');
  const vegs = foods.filter((f) => f.role === 'veg');
  const cheese = foods.find((f) => f.role === 'cheese');
  if (!proteins.length && !vegs.length) return [];

  const ideas = [];
  const usedLead = new Set();
  const usedTemplate = new Set();
  const candidates = [];
  for (const t of TEMPLATES) {
    for (const p of [...proteins, null]) {
      for (const s of [...starches, null]) {
        if (p?.soupOnly && t.id !== 'soup') continue;
        const v = pickVeg(vegs, t.id, p);
        if (!t.fits(p, v, s)) continue;
        const chosen = [p, s, ...v].filter(Boolean);
        const urgency = chosen.filter((f) => f.urgent).length;
        // Food no saved recipe uses gets a boost, so new groceries show up here.
        const fresh = chosen.filter((f) => f.uncovered).length;
        candidates.push({ t, p, s, v, urgency, rank: (p ? 2 : 0) + (s ? 1 : 0) + v.length * 0.5 + urgency * 3 + fresh * 2.5 });
      }
    }
  }
  candidates.sort((a, b) => b.rank - a.rank);
  for (const c of candidates) {
    if (ideas.length >= limit) break;
    const lead = c.p?.name ?? c.v[0]?.name;
    if (usedTemplate.has(c.t.id) || usedLead.has(lead)) continue;
    const built = c.t.build(c.p, c.v, c.s, { cheese });
    const ingredients = [
      c.p && amount(state, c.p, ...PROTEIN_SERVING[c.p.kind] ?? [150, 'g'], servings, catalog),
      c.s && amount(state, c.s, c.s.perServing, c.s.unit, servings, catalog),
      ...c.v.map((x) => amount(state, x, x.leafy ? 40 : 100, 'g', servings, catalog)),
      cheese && ['omelette', 'bowl', 'wrap', 'pasta'].includes(c.t.id) ? { ...amount(state, cheese, 30, 'g', servings, catalog), optional: true } : null,
    ].filter((i) => i && i.qty > 0);
    if (!ingredients.length) continue;
    usedTemplate.add(c.t.id);
    usedLead.add(lead);
    const id = `idea-${c.t.id}-${[c.p, c.s, ...c.v].filter(Boolean).map((f) => f.name.replace(/\W+/g, '_')).join('-')}`;
    ideas.push({
      id, name: built.name, servings, tags: ['idea'], prepMin: built.prepMin, cookMin: built.cookMin, steps: built.steps,
      ingredients: ingredients.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit, optional: Boolean(i.optional) })),
      usesExpiring: [c.p, c.s, ...c.v].filter((f) => f?.urgent).map((f) => f.name),
    });
  }
  return ideas;
}

function vegPrep(v) {
  const raw = v.filter((x) => x.rawOk).map((x) => x.label);
  const cooked = v.filter((x) => !x.rawOk).map((x) => x.label);
  return [
    raw.length ? `Slice the ${join(raw)} to eat raw.` : '',
    cooked.length ? `Sauté the ${join(cooked)} in a little oil 4 to 6 minutes until tender.` : '',
  ].filter(Boolean).join(' ');
}

// Up to three vegetables suited to the template, expiring first.
function pickVeg(vegs, template, protein) {
  let pool = ['wrap', 'bowl'].includes(template) ? vegs : vegs.filter((v) => !v.saladOnly);
  if (!['soup', 'pasta'].includes(template)) pool = pool.filter((v) => !v.canned);
  // Expiring food first, then food no recipe uses yet, then the rest.
  pool = [...pool].sort((a, b) => Number(b.urgent) - Number(a.urgent) || Number(b.uncovered) - Number(a.uncovered));

  if (template === 'sheetpan') pool = pool.filter((v) => !v.leafy);
  if (template === 'wrap') pool = pool.filter((v) => v.rawOk || v.leafy);
  if (template === 'omelette') pool = pool.filter((v) => !v.root);
  return pool.filter((v) => v.name !== protein?.name).slice(0, template === 'soup' ? 3 : 2);
}
