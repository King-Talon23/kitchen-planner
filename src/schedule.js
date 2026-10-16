// Putting the week's meals on a schedule: each planned meal gets a day and
// a meal slot, and the cooking block runs from (meal time - prep - cook) to
// the meal time. The schedule exports as an iCalendar file (RFC 5545,
// https://www.rfc-editor.org/rfc/rfc5545), which Google Calendar, Apple
// Calendar, Outlook and most schedule apps can import.

import { today, addDays } from './inventory.js';

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
export const DEFAULT_MEAL_TIMES = { breakfast: '08:00', lunch: '12:30', dinner: '18:30', snack: '15:30' };

export function totalMinutes(recipe) {
  return (Number(recipe?.prepMin) || 0) + (Number(recipe?.cookMin) || 0);
}

function minutesOf(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

function hhmm(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// The slot a recipe suits best, from its tags.
export function mealFor(recipe) {
  const tags = recipe?.tags || [];
  if (tags.includes('dinner')) return 'dinner';
  if (tags.includes('breakfast')) return 'breakfast';
  if (tags.includes('lunch')) return 'lunch';
  if (tags.includes('snack')) return 'snack';
  return 'dinner';
}

// Give every unscheduled planned meal a day and slot in the 7 days from
// `from`, filling each slot once and keeping meals already placed.
export function scheduleWeek(state, { from = today() } = {}) {
  const days = Array.from({ length: 7 }, (_, n) => addDays(from, n));
  const taken = new Set(state.plan.filter((p) => p.date && p.meal).map((p) => `${p.date}|${p.meal}`));
  for (const p of state.plan) {
    if (p.date && p.meal) continue;
    const recipe = state.recipes.find((r) => r.id === p.recipeId);
    const order = [mealFor(recipe), ...MEALS.filter((m) => m !== mealFor(recipe))];
    let placed = false;
    for (const meal of order) {
      const day = days.find((d) => !taken.has(`${d}|${meal}`));
      if (day) {
        Object.assign(p, { date: day, meal });
        taken.add(`${day}|${meal}`);
        placed = true;
        break;
      }
    }
    if (!placed) Object.assign(p, { date: days[6], meal: mealFor(recipe) });
  }
  return state.plan;
}

// One block per scheduled meal: when to start cooking and when it's ready.
export function cookingBlocks(state) {
  const times = { ...DEFAULT_MEAL_TIMES, ...(state.settings.mealTimes || {}) };
  return state.plan
    .filter((p) => p.date && p.meal)
    .map((p) => {
      const recipe = state.recipes.find((r) => r.id === p.recipeId);
      const ready = minutesOf(times[p.meal] ?? DEFAULT_MEAL_TIMES.dinner);
      const minutes = totalMinutes(recipe);
      const startMin = ready - minutes;
      const startDate = startMin < 0 ? addDays(p.date, -1) : p.date;
      return {
        id: p.id, date: p.date, meal: p.meal, recipe, servings: p.servings, minutes,
        start: hhmm(startMin), startDate, ready: hhmm(ready),
      };
    })
    .filter((b) => b.recipe)
    .sort((a, b) => `${a.startDate} ${a.start}`.localeCompare(`${b.startDate} ${b.start}`));
}

// ---------- iCalendar ----------

function icsText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// Fold lines longer than 75 octets: CRLF followed by a space (RFC 5545 3.1).
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let chunk = '';
  let size = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    if (size + len > (out.length ? 74 : 75)) {
      out.push(chunk);
      chunk = '';
      size = 0;
    }
    chunk += ch;
    size += len;
  }
  out.push(chunk);
  return out.join('\r\n ');
}

const local = (date, time) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

// Floating local times (no time zone), so events land at the same clock time
// wherever the calendar is.
export function toICS(blocks, { now = new Date() } = {}) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kitchen Planner//Meal schedule//EN', 'CALSCALE:GREGORIAN'];
  for (const b of blocks) {
    const r = b.recipe;
    const body = [
      `${b.minutes ? `${b.minutes} min` : 'Time not set'} (${r.prepMin ?? 0} prep, ${r.cookMin ?? 0} cook) · ${b.servings} servings`,
      '',
      'Ingredients:',
      ...r.ingredients.map((i) => `- ${i.name} ${i.qty} ${i.unit}${i.optional ? ' (optional)' : ''}`),
      ...(r.steps?.length ? ['', 'Steps:', ...r.steps.map((s, n) => `${n + 1}. ${s}`)] : []),
    ].join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.id}-${b.date}-${b.meal}@kitchen-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${local(b.startDate, b.start)}`,
      `DTEND:${local(b.date, b.ready)}`,
      `SUMMARY:${icsText(`Cook: ${r.name}`)}`,
      `DESCRIPTION:${icsText(body)}`,
      `CATEGORIES:${icsText(b.meal)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

// The same schedule as plain data, for apps that take JSON.
export function scheduleJSON(blocks) {
  return blocks.map((b) => ({
    title: `Cook: ${b.recipe.name}`, meal: b.meal, date: b.date, start: `${b.startDate}T${b.start}`, ready: `${b.date}T${b.ready}`,
    minutes: b.minutes, prepMin: b.recipe.prepMin ?? null, cookMin: b.recipe.cookMin ?? null, servings: b.servings,
  }));
}
