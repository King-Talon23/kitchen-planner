import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, latestCanadaPrices } from '../scripts/statcan.js';

const CSV = `﻿"REF_DATE","GEO","DGUID","Products","UOM","UOM_ID","SCALAR_FACTOR","SCALAR_ID","VECTOR","COORDINATE","VALUE","STATUS","SYMBOL","TERMINATED","DECIMALS"
"2026-07","Canada","2016A000011124","Ground beef, per kilogram","Dollars","81","units","0","v1","1.1","16.50","","","","2"
"2026-08","Canada","2016A000011124","Ground beef, per kilogram","Dollars","81","units","0","v1","1.1","16.75","","","","2"
"2026-08","Canada","2016A000011124","Eggs, 1 dozen","Dollars","81","units","0","v2","1.2","4.83","","","","2"
"2026-08","Ontario","2016A000235","Eggs, 1 dozen","Dollars","81","units","0","v3","7.2","5.10","","","","2"
"2026-08","Canada","2016A000011124","Tea (20 bags)","Dollars","81","units","0","v4","1.3","","..","","","2"
`;

test('CSV parser handles quotes, commas and CRLF', () => {
  assert.deepEqual(parseCsv('a,"b, c","d ""e"""\r\n1,2,3\r\n'), [['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
});

test('picks the newest month of Canada-wide prices', () => {
  const { month, prices } = latestCanadaPrices(CSV);
  assert.equal(month, '2026-08');
  assert.deepEqual(prices, { 'Ground beef, per kilogram': 16.75, 'Eggs, 1 dozen': 4.83 });
});
