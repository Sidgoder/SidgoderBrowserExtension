import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./newtab.js", import.meta.url), "utf8");

assert.match(
  source,
  /function updateSearchHistoryVisibility\(\)/,
  "search history visibility should be controlled separately from rendering"
);

assert.match(
  source,
  /elements\.input\.addEventListener\("focus", updateSearchHistoryVisibility\)/,
  "search history should open when the search input receives focus"
);

assert.match(
  source,
  /elements\.input\.addEventListener\("blur", \(\) => \{/,
  "search history should hide after the search input loses focus"
);

assert.doesNotMatch(
  source,
  /elements\.historyPanel\.hidden = items\.length === 0;/,
  "rendering history items should not force the panel visible outside input focus"
);
