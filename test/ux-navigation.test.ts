import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("prototype/ux/index.html", "utf8");
const app = readFileSync("prototype/ux/app.js", "utf8");

test("primary view headings are programmatically focusable", () => {
  for (const id of ["start-title", "search-title", "results-title", "provider-title"]) {
    assert.match(html, new RegExp(`<h1 id="${id}" tabindex="-1">`));
  }
  assert.match(app, /target\.querySelector\("h1"\)\?\.focus\(\)/);
});

test("list/map tabs implement roving tabindex and keyboard navigation", () => {
  assert.match(app, /listTab\.tabIndex = listSelected \? 0 : -1/);
  assert.match(app, /mapTab\.tabIndex = listSelected \? -1 : 0/);
  assert.match(app, /event\.key === "ArrowRight" \|\| event\.key === "ArrowLeft"/);
  assert.match(app, /event\.key === "Home"/);
  assert.match(app, /event\.key === "End"/);
});
