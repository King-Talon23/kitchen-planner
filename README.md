# Kitchen Planner

A personal app that keeps track of what's in your kitchen, suggests meals from
what you have, takes ingredients out of the inventory when you log a meal, and
builds a weekly shopping list that stays within a budget ($150 CAD by default).

## What it does

- **Inventory** by pantry, fridge and freezer, with best-before dates and an
  optional "keep at least" level for staples (milk, eggs, bread).
- **Meal suggestions** ranked by how much of each recipe you already have,
  with recipes that use food about to expire pushed to the top.
- **Log a meal** ("I made this") and its ingredients come out of the
  inventory, scaled to the servings you made, oldest stock first.
- **Weekly plan and shopping list.** Auto-plan picks the meals that add the
  least to your bill given what's already in the kitchen. The list covers
  what the plan needs plus anything below its restock level, priced and kept
  within the budget. Anything that doesn't fit is listed separately so you
  choose what to drop. "I bought these" moves the purchases into inventory.
- **Prices** default to Statistics Canada national averages and can be
  changed to match your store.
- **Store and flyer prices.** Enter a price from a flyer, shelf tag or receipt
  with its store and sale end date. The shopping list uses the cheapest
  current price and shows which store it's at.
- **Spending log.** "I bought these" asks what you actually paid, or you can
  record a shop by hand. The Spending tab shows each week against the budget,
  and money already spent this week comes off the shopping list's budget.
- **Barcode scanning.** Scan a product with the phone camera (or type the
  number) to look it up in Open Food Facts and add it to inventory. Barcodes
  you've added before are remembered and work offline.
- **Nutrition targets.** From your height, weight, age, sex, activity and goal,
  the app estimates daily calories and protein, shows how much of that the
  week's planned meals cover, lists calories and protein per serving for each
  recipe, and ranks foods by calories and protein per dollar.
- **Sync between devices** through a secret GitHub Gist (see below).
- Works offline and can be installed to a phone's home screen.

## Running it

No install step and no dependencies.

```sh
npm start        # serves the app at http://localhost:8080
npm test         # runs the logic tests (Node 20+)
```

To use it on your phone, publish it with GitHub Pages: repository
**Settings → Pages → Build and deployment → Deploy from a branch**, pick
`main` and `/ (root)`. The app will be at
`https://<your-username>.github.io/kitchen-planner/`. Open it on your phone and
use "Add to Home Screen".
([GitHub Pages docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site))

## Your data

Everything is stored in the browser on the device you use (localStorage).
Nothing is sent anywhere. Two things to know:

- Browsers may clear site data under storage pressure unless the site has
  persistent storage; the app asks for it with `navigator.storage.persist()`.
  Safari also deletes script-written data for sites you haven't interacted
  with in 7 days of browser use. Home-screen web apps keep their own counter,
  and WebKit says it does not expect their data to be deleted.
  ([MDN: storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria),
  [WebKit blog](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/))
- So use **Settings → Export backup** now and then. The same file moves your
  data to another device with **Import backup**.

## Syncing your phone and laptop

Settings → Sync between devices. Make a GitHub fine-grained personal access
token with only **Gists: read and write** and paste it on each device. The app
saves your data to one secret gist and keeps every device up to date: when only
one side changed it copies that side, and when both changed since the last sync
it asks which copy to keep. ([GitHub Gists API](https://docs.github.com/en/rest/gists/gists))

The token stays in that browser. It is never put in backups or in the gist.
A secret gist is unlisted, not encrypted, so anyone who has its link can read it.

## Nutrition targets, and where they come from

- Resting energy: Mifflin-St Jeor equation, which a systematic review found
  most likely to estimate within 10% of measured values
  ([Frankenfield et al. 2005](https://doi.org/10.1016/j.jada.2005.02.005)).
- Activity: midpoints of the FAO/WHO/UNU physical activity level bands
  ([FAO 2001, table 5.3](https://www.fao.org/3/y5686e/y5686e07.htm)).
- Gaining weight: a 10–20% surplus, 1.6–2.2 g protein and 0.5–1.5 g fat per
  kg each day, gaining about 0.25–0.5% of body weight a week
  ([Iraki et al. 2019](https://doi.org/10.3390/sports7070154); written for
  people doing resistance training). Muscle gains from protein level off
  around 1.6 g/kg ([Morton et al. 2018](https://doi.org/10.1136/bjsports-2017-097608)).
- Food values: USDA FoodData Central, SR Legacy, per 100 g as purchased
  (`src/data/nutrients.js` lists each food's FDC id).

These are planning estimates, not medical advice.

## Barcodes

Products are looked up in [Open Food Facts](https://openfoodfacts.github.io/openfoodfacts-server/api/),
a free open database (product reads are limited to 15 a minute). Scanning uses
the browser's [Barcode Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API)
where it exists. Elsewhere (for example Safari), it uses the
[barcode-detector](https://github.com/Sec-ant/barcode-detector) ponyfill, which
is vendored in `vendor/`, so scanning works offline.

## Store prices, flyers and receipts

I couldn't find an official public API for Canadian grocery flyers (Flipp, for
example, doesn't document one publicly), and Walmart Canada's terms of use
forbid scraping its site, so the app doesn't read store websites. Store prices
come from you instead, two ways:

- **Scan a receipt** (Spending tab). Take a photo; the text is read on your
  device with [Tesseract.js](https://github.com/naptha/tesseract.js)
  (Apache-2.0, loaded from jsDelivr the first time and cached after). You check
  the matched items, then one Save records what you paid, adds the food to your
  inventory and stores each price as a store price. Receipts abbreviate names
  ("GRND BF MED"), so the matcher expands common abbreviations and remembers
  every match you confirm or skip. Weighed items use the "kg @ $/kg" line
  when the receipt prints one; otherwise you type the weight.
- **Type a flyer or shelf price** (Prices tab), optionally with the sale's end date.

A store price is used until its sale ends, or for 45 days after you saw it,
and the cheapest active price wins over the StatCan default.

## Where the prices come from

Default prices are from Statistics Canada,
[Table 18-10-0245-01, Monthly average retail prices for selected products](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501),
Canada, August 2026 (released 7 October 2026). A GitHub Action
(`.github/workflows/update-prices.yml`) checks StatCan every Monday,
downloads the full table when a new month is out, writes
`src/data/statcan-latest.js`, runs the tests and commits the change, so the
defaults follow the monthly releases without anyone editing them. They are national averages
from retailer scanner data, so your store's prices will differ; edit them in
the Prices tab. Basic groceries are zero-rated for GST/HST, so the list adds
no tax ([CRA](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-type-supply.html)).

How items are priced:
- Per-kilogram items (meat, loose produce) are rounded up to the next 100 g.
- Packaged items are bought in whole packs at the StatCan pack size.
- When a recipe counts something ("2 onions") but the store sells it by
  weight, an approximate per-item weight in `src/units.js` converts between
  them.

## How it's built

A static web app in plain JavaScript modules: no framework, no build step,
no server. For a single-user app that mostly stores a few hundred records,
this keeps it free to host, usable offline, and easy to change.

```
index.html, styles.css    app shell
src/app.js                screens and event handling
src/units.js              unit conversion and name matching
src/inventory.js          adding stock, cooking meals, low-stock, expiry
src/suggest.js            meal suggestions
src/shopping.js           shopping list, budget, auto-plan
src/store.js              save/load, backup import/export
src/data/prices.js        StatCan default prices
src/data/recipes.js       starter recipes
src/data/nutrients.js     USDA nutrient values per food
src/spending.js           spending log and weekly totals
src/barcode.js            scanning and Open Food Facts lookup
src/nutrition.js          calorie/protein targets, recipe nutrition
src/sync.js               GitHub Gist sync
src/views-more.js         screens for the above
vendor/barcode-detector/  barcode scanner for browsers without one
sw.js                     offline cache
test/                     node:test tests for the logic
```

## Ideas for later

- Track what you eat each day against the calorie and protein targets.
- Let auto-plan favour recipes that close your calorie and protein gap.
- A Canada's Food Guide plate check of the plan (half vegetables and fruits,
  a quarter protein foods, a quarter whole grains;
  [Health Canada](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/cooking/make-healthy-meals-plate.html)).
