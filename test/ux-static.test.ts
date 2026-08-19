import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const htmlPath = "prototype/ux/index.html";
const appPath = "prototype/ux/app.js";

test("prototype JavaScript is syntactically valid", () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ["--check", appPath], { cwd: process.cwd(), stdio: "pipe" });
  });
});

test("prototype shell has no remote script, stylesheet or image dependency", () => {
  const html = readFileSync(htmlPath, "utf8");
  assert.doesNotMatch(html, /<(?:script|link|img)[^>]+(?:src|href)=["']https?:\/\//i);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/app\.js"/);
});

test("prototype exposes accessible list and map tabs and an offline warning", () => {
  const html = readFileSync(htmlPath, "utf8");
  assert.match(html, /role="tablist"/);
  assert.match(html, /id="list-panel" role="tabpanel"/);
  assert.match(html, /id="map-panel" role="tabpanel"/);
  assert.match(html, /id="offline-banner"[^>]+role="status"/);
  assert.match(html, /The list contains the complete accessible result information/);
});

test("prototype prominently identifies itself as fictional synthetic data", () => {
  const html = readFileSync(htmlPath, "utf8");
  assert.match(html, /No real services, people or locations are shown\./);
  assert.match(html, /fictional interaction model/i);
});
