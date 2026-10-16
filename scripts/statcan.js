// Parse Statistics Canada's full-table CSV for Table 18-10-0245-01 and pick
// out the newest month of national (GEO = "Canada") prices.
//
// StatCan full-table CSVs have one row per data point with columns such as
// REF_DATE, GEO, DGUID, <dimension>, UOM, ..., VALUE, STATUS, ...
// https://www.statcan.gc.ca/en/developers/csv/user-guide

const META = new Set(['REF_DATE', 'GEO', 'DGUID', 'UOM', 'UOM_ID', 'SCALAR_FACTOR', 'SCALAR_ID', 'VECTOR', 'COORDINATE',
  'VALUE', 'STATUS', 'SYMBOL', 'TERMINATED', 'DECIMALS']);

// Minimal RFC 4180 CSV parser (quoted fields, doubled quotes, CRLF).
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

export function latestCanadaPrices(csvText) {
  const [header, ...rows] = parseCsv(csvText.replace(/^﻿/, ''));
  const col = (name) => header.indexOf(name);
  const iDate = col('REF_DATE');
  const iGeo = col('GEO');
  const iValue = col('VALUE');
  const iProduct = header.findIndex((h) => !META.has(h));
  if ([iDate, iGeo, iValue, iProduct].some((i) => i < 0)) throw new Error(`Unexpected CSV header: ${header.join(',')}`);

  const canada = rows.filter((r) => r[iGeo] === 'Canada' && r[iValue] !== '');
  const month = canada.reduce((max, r) => (r[iDate] > max ? r[iDate] : max), '');
  if (!month) throw new Error('No Canada rows with values');
  const prices = {};
  for (const r of canada) {
    if (r[iDate] === month) prices[r[iProduct]] = Number(r[iValue]);
  }
  return { month: month.slice(0, 7), prices };
}
