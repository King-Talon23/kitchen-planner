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

## Where the prices come from

Default prices are from Statistics Canada,
[Table 18-10-0245-01, Monthly average retail prices for selected products](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501),
Canada, August 2026 (released 7 October 2026). They are national averages
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
sw.js                     offline cache
test/                     node:test tests for the logic
```

## Ideas for later

- Sync between phone and laptop (needs a small backend or a sync service).
- Barcode scanning to add groceries faster.
- Weekly flyer prices for your local stores instead of national averages.
- Spending history: what you actually paid each week against the budget.
- Nutrition targets for the plan (e.g. Canada's Food Guide plate proportions).
