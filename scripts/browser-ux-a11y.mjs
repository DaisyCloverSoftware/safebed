import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";

const ROOT = process.cwd();
const MIME = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
]);

function findChrome() {
  for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try {
      return execFileSync("which", [name], { encoding: "utf8" }).trim();
    } catch {
      // Try the next hosted-runner browser name.
    }
  }
  throw new Error("No supported Chrome/Chromium executable is available.");
}

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      const filePath = resolve(ROOT, `.${pathname}`);
      const rootPrefix = ROOT.endsWith(sep) ? ROOT : `${ROOT}${sep}`;
      if (filePath !== ROOT && !filePath.startsWith(rootPrefix)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "content-type": MIME.get(extname(filePath)) ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not determine static-server port.");
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function startChrome() {
  const chromePath = findChrome();
  const profileDir = await mkdtemp(join(tmpdir(), "safebed-a11y-chrome-"));
  const port = 9223;
  const args = [
    "--headless=new",
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-sync",
    "--metrics-recording-only",
    "--mute-audio",
    "about:blank",
  ];
  if (typeof process.getuid === "function" && process.getuid() === 0) args.unshift("--no-sandbox");

  const chrome = spawn(chromePath, args, { stdio: ["ignore", "ignore", "pipe"] });
  let stderr = "";
  let spawnError = null;
  chrome.stderr.setEncoding("utf8");
  chrome.stderr.on("data", (chunk) => { stderr += chunk; });
  chrome.once("error", (error) => { spawnError = error; });

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (chrome.exitCode !== null) throw new Error(`Chrome exited before DevTools was ready.\n${stderr}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) {
        const version = await response.json();
        if (version.webSocketDebuggerUrl) return { chrome, profileDir, port, chromePath };
      }
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`Timed out waiting for Chrome DevTools.\n${stderr}`);
}

class CdpClient {
  #socket;
  #nextId = 1;
  #pending = new Map();

  constructor(url) {
    this.#socket = new WebSocket(url);
  }

  async open() {
    await new Promise((resolvePromise, reject) => {
      this.#socket.addEventListener("open", resolvePromise, { once: true });
      this.#socket.addEventListener("error", reject, { once: true });
    });
    this.#socket.addEventListener("message", async (event) => {
      const raw = typeof event.data === "string"
        ? event.data
        : Buffer.from(await event.data.arrayBuffer()).toString("utf8");
      const message = JSON.parse(raw);
      if (!message.id) return;
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result ?? {});
    });
  }

  send(method, params = {}) {
    const id = this.#nextId++;
    return new Promise((resolvePromise, reject) => {
      this.#pending.set(id, { resolve: resolvePromise, reject, method });
      this.#socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.#socket.close();
  }
}

async function createPage(port, url) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  if (!response.ok) throw new Error(`Chrome target creation failed: ${response.status}`);
  const target = await response.json();
  const cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.open();
  for (const domain of ["Runtime", "Page", "DOM", "Accessibility"]) await cdp.send(`${domain}.enable`);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return cdp;
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(`Browser evaluation failed: ${result.exceptionDetails.text ?? "unknown exception"}`);
  return result.result?.value;
}

async function waitFor(cdp, expression, description, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 40));
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

async function key(cdp, keyName, keyCode) {
  const params = {
    key: keyName,
    code: keyName,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  };
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...params });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...params });
}

async function axNode(cdp, selector) {
  const document = await cdp.send("DOM.getDocument", { depth: 1 });
  const query = await cdp.send("DOM.querySelector", { nodeId: document.root.nodeId, selector });
  assert.ok(query.nodeId, `Expected DOM node for ${selector}`);
  const tree = await cdp.send("Accessibility.getPartialAXTree", {
    nodeId: query.nodeId,
    fetchRelatives: false,
  });
  const node = tree.nodes.find((candidate) => !candidate.ignored) ?? tree.nodes[0];
  assert.ok(node, `Expected accessibility node for ${selector}`);
  return node;
}

function axValue(node, field) {
  return node[field]?.value;
}

function axProperty(node, name) {
  return node.properties?.find((property) => property.name === name)?.value?.value;
}

function axBooleanProperty(node, name) {
  const value = axProperty(node, name);
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

async function stopChrome(chrome) {
  if (chrome.exitCode !== null) return;
  const waitForExit = (timeoutMs) => new Promise((resolvePromise) => {
    if (chrome.exitCode !== null) return resolvePromise(true);
    const timer = setTimeout(() => resolvePromise(false), timeoutMs);
    chrome.once("exit", () => {
      clearTimeout(timer);
      resolvePromise(true);
    });
  });
  chrome.kill("SIGTERM");
  if (await waitForExit(3_000)) return;
  chrome.kill("SIGKILL");
  await waitForExit(2_000);
}

let passed = 0;
async function check(name, callback) {
  await callback();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

const { server, baseUrl } = await startStaticServer();
const { chrome, profileDir, port, chromePath } = await startChrome();
let page;

try {
  console.log(`Browser: ${chromePath}`);
  page = await createPage(port, `${baseUrl}/prototype/ux/`);
  await waitFor(page, "document.readyState === 'complete'", "initial page load");

  await check("skip link and main content expose navigation semantics", async () => {
    const skip = await axNode(page, ".skip-link");
    assert.equal(axValue(skip, "role"), "link");
    assert.equal(axValue(skip, "name"), "Skip to main content");
    assert.equal(axValue(await axNode(page, "#main"), "role"), "main");
  });

  await check("route buttons expose concise names with separate descriptions", async () => {
    const person = await axNode(page, "[data-role=PERSON]");
    assert.equal(axValue(person, "role"), "button");
    assert.equal(axValue(person, "name"), "I need somewhere safe");
    assert.equal(axValue(person, "description"), "Search nearby options for tonight.");
  });

  await evaluate(page, "document.querySelector('[data-role=PERSON]').click()");
  await waitFor(page, "document.querySelector('#search-view').hidden === false", "search view");

  await check("active screen heading is level one and receives focus", async () => {
    const heading = await axNode(page, "#search-title");
    assert.equal(axValue(heading, "role"), "heading");
    assert.equal(axValue(heading, "name"), "Find somewhere safe tonight");
    assert.equal(axProperty(heading, "level"), 1);
    assert.equal(await evaluate(page, "document.activeElement?.id"), "search-title");
  });

  await evaluate(page, "document.querySelector('#search-form').requestSubmit()");
  await waitFor(page, "document.querySelector('#results-view').hidden === false", "results view");

  await check("repeated result actions have service-specific accessible names", async () => {
    const actions = await evaluate(page, "[...document.querySelectorAll('.result-action')].map(button => ({ service: button.dataset.service, label: button.getAttribute('aria-label') }))");
    assert.ok(actions.length >= 3, "Expected multiple synthetic result actions");
    assert.equal(new Set(actions.map(({ label }) => label)).size, actions.length);
    for (const { service, label } of actions) {
      const button = await axNode(page, `[data-service='${service}']`);
      assert.equal(axValue(button, "role"), "button");
      assert.equal(axValue(button, "name"), label);
      assert.match(label, / for /);
    }
  });

  await check("offline control exposes toggle state and disables live actions", async () => {
    let toggle = await axNode(page, "#offline-toggle");
    assert.equal(axBooleanProperty(toggle, "pressed"), false);
    await evaluate(page, "document.querySelector('#offline-toggle').click()");
    toggle = await axNode(page, "#offline-toggle");
    assert.equal(axBooleanProperty(toggle, "pressed"), true);
    assert.equal(await evaluate(page, "document.querySelector('#offline-banner').hidden"), false);
    assert.equal(await evaluate(page, "[...document.querySelectorAll('.result-action')].every(button => button.disabled)"), true);
    await evaluate(page, "document.querySelector('#offline-toggle').click()");
  });

  await check("dialog exposes its title, focuses it, and restores invoking focus", async () => {
    await evaluate(page, "document.querySelector('[data-service=read-only]').focus(); document.querySelector('[data-service=read-only]').click()");
    await waitFor(page, "document.querySelector('#action-dialog').open", "information dialog");
    await waitFor(page, "document.activeElement?.id === 'dialog-title'", "dialog-title focus");
    const modal = await axNode(page, "#action-dialog");
    assert.equal(axValue(modal, "role"), "dialog");
    assert.equal(axValue(modal, "name"), "Use the provider's existing route");
    await key(page, "Escape", 27);
    await waitFor(page, "!document.querySelector('#action-dialog').open", "dialog close");
    assert.equal(await evaluate(page, "document.activeElement?.dataset.service"), "read-only");
  });

  await check("provider capacity output exposes a stable accessible name", async () => {
    await evaluate(page, "document.querySelector('[data-back-to-search]').click()");
    await waitFor(page, "document.querySelector('#search-view').hidden === false", "search return");
    await evaluate(page, "document.querySelector('#search-view [data-back]').click()");
    await waitFor(page, "document.querySelector('#start-view').hidden === false", "start return");
    await evaluate(page, "document.querySelector('[data-role=PROVIDER]').click()");
    await waitFor(page, "document.querySelector('#provider-view').hidden === false", "provider view");
    const output = await axNode(page, "#capacity-output");
    assert.equal(axValue(output, "name"), "Usable spaces tonight");
    assert.equal(await evaluate(page, "document.activeElement?.id"), "provider-title");
  });

  await check("hidden views do not leak extra level-one headings into the accessibility tree", async () => {
    const tree = await page.send("Accessibility.getFullAXTree");
    const headings = tree.nodes
      .filter((node) => !node.ignored && axValue(node, "role") === "heading" && axProperty(node, "level") === 1)
      .map((node) => axValue(node, "name"));
    assert.deepEqual(headings, ["Tonight’s synthetic capacity"]);
  });

  await check("320px reflow has no horizontal page scroll", async () => {
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 320,
      height: 720,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await page.send("Page.navigate", { url: `${baseUrl}/prototype/ux/` });
    await waitFor(page, "document.readyState === 'complete'", "320px reload");
    await evaluate(page, "document.querySelector('[data-role=PERSON]').click()");
    await evaluate(page, "document.querySelector('#search-form').requestSubmit()");
    await waitFor(page, "document.querySelector('#results-view').hidden === false", "320px results");
    assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= window.innerWidth + 1"), true);
    assert.equal(await evaluate(page, "window.innerWidth"), 320);
  });

  await check("reduced-motion preference removes view animation", async () => {
    await page.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('#results-view')).animationName"), "none");
  });

  console.log(`SafeBed accessibility-tree regression passed: ${passed}/${passed} checks.`);
} finally {
  page?.close();
  server.close();
  await stopChrome(chrome);
  await rm(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
