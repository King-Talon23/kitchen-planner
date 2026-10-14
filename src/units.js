// Unit handling. Every quantity is converted to one of three base units:
// grams (g), millilitres (ml) or a count (ea), so amounts from recipes,
// inventory and store packs can be compared and added up.

// Canadian metric kitchen measures: 1 cup = 250 ml, 1 tbsp = 15 ml, 1 tsp = 5 ml.
export const UNITS = {
  g: { base: 'g', factor: 1, label: 'g' },
  kg: { base: 'g', factor: 1000, label: 'kg' },
  lb: { base: 'g', factor: 453.592, label: 'lb' },
  oz: { base: 'g', factor: 28.3495, label: 'oz' },
  ml: { base: 'ml', factor: 1, label: 'ml' },
  l: { base: 'ml', factor: 1000, label: 'L' },
  cup: { base: 'ml', factor: 250, label: 'cup' },
  tbsp: { base: 'ml', factor: 15, label: 'tbsp' },
  tsp: { base: 'ml', factor: 5, label: 'tsp' },
  ea: { base: 'ea', factor: 1, label: 'each' },
  dozen: { base: 'ea', factor: 12, label: 'dozen' },
};

export const UNIT_KEYS = Object.keys(UNITS);

// Rough weight of one item, used only when a recipe and the inventory count
// the same food differently (e.g. "2 onions" vs "300 g onion"). These are
// estimates, not measured values; edit them if your produce runs bigger.
export const AVG_WEIGHT_G = {
  onion: 150,
  potato: 200,
  'sweet potato': 250,
  carrot: 60,
  tomato: 120,
  apple: 180,
  banana: 120,
  pepper: 150,
  orange: 150,
  pear: 180,
  cucumber: 300,
  avocado: 170,
  'chicken breast': 200,
  'chicken thigh': 120,
  'chicken drumstick': 110,
};

export function normalizeUnit(unit) {
  const u = String(unit || '').trim().toLowerCase();
  const aliases = {
    gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg', kgs: 'kg',
    lbs: 'lb', pound: 'lb', pounds: 'lb', ounce: 'oz', ounces: 'oz',
    millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml', ml: 'ml',
    litre: 'l', litres: 'l', liter: 'l', liters: 'l', l: 'l',
    cups: 'cup', tablespoon: 'tbsp', tablespoons: 'tbsp', teaspoon: 'tsp', teaspoons: 'tsp',
    each: 'ea', unit: 'ea', units: 'ea', pc: 'ea', pcs: 'ea', piece: 'ea', pieces: 'ea', '': 'ea',
    dozens: 'dozen',
  };
  const key = aliases[u] ?? u;
  if (!UNITS[key]) throw new Error(`Unknown unit "${unit}"`);
  return key;
}

export function toBase(qty, unit) {
  const key = normalizeUnit(unit);
  const { base, factor } = UNITS[key];
  return { qty: Number(qty) * factor, unit: base };
}

// Lower-case, collapse whitespace and drop simple plurals so "Tomatoes",
// "tomato" and " TOMATO " all match.
export function normalizeName(name) {
  const words = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ').split(' ');
  const last = words.pop() || '';
  let single = last;
  if (/[^aeiou]ies$/.test(last)) single = last.slice(0, -3) + 'y';
  else if (/oes$/.test(last)) single = last.slice(0, -2);
  else if (/[^su]s$/.test(last)) single = last.slice(0, -1);
  return [...words, single].join(' ');
}

// Convert a base amount of `name` from one base unit to another, using the
// average weights above for count <-> grams. Returns null when impossible.
export function convertBase(qty, fromUnit, toUnit, name) {
  if (fromUnit === toUnit) return qty;
  const w = AVG_WEIGHT_G[normalizeName(name)];
  if (!w) return null;
  if (fromUnit === 'ea' && toUnit === 'g') return qty * w;
  if (fromUnit === 'g' && toUnit === 'ea') return qty / w;
  return null;
}

// Pick a friendly display unit for a base amount.
export function formatQty(qty, baseUnit) {
  const round = (n) => (Math.round(n * 100) / 100).toString();
  if (baseUnit === 'g') return qty >= 1000 ? `${round(qty / 1000)} kg` : `${round(qty)} g`;
  if (baseUnit === 'ml') return qty >= 1000 ? `${round(qty / 1000)} L` : `${round(qty)} ml`;
  return `${round(qty)}`;
}
