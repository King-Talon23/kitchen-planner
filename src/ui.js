// Small HTML helpers shared by the screens.

import { UNIT_KEYS, UNITS } from './units.js';

export const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' }));
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const unitOptions = (selected = 'ea') => UNIT_KEYS.map((u) => `<option value="${u}" ${u === selected ? 'selected' : ''}>${UNITS[u].label}</option>`).join('');
export const unitLabel = (u) => UNITS[u]?.label ?? u;
