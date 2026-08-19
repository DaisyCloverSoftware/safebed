import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
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
      // Try the next runner/browser name.
    }
  }
  throw new Error("No supported Chrome/Chromium executable is available on this runner.");
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
  if (!address || typeof address === "string") throw new Error("Unable to determine local server port.");
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function startChrome() {
  const chromePath = findChrome();
  const profileDir = await mkdtemp(join(tmpdir(), "safebed-chrome-"));
  const port = 9222;
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

  const chrome = spawn(chromePath, args, {
    stdio: ["ignore", "ignore", "pipe"],
  });

  let stderr = "";
  let exitCode = null;
  let spawnError = null;
  chrome.stderr.setEncoding("utf8");
  chrome.stderr.on("data", (chunk) => { stderr += chunk; });
  chrome.once("exit", (code) => { exitCode = code; });
  chrome.once("error", (error) => { spawnError = error; });

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (exitCode !== null) {
      throw new Error(`Chrome exited before DevTools was ready (code ${exitCode}).\n${stderr}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) {
        const version = await response.json();
        if (version.webSocketDebuggerUrl) return { chrome, profileDir, port, chromePath };
      }
    } catch {
      // Chrome is still starting; retry within the bounded deadline.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }

  throw new Error(`Timed out waiting for Chrome DevTools endpoint.\n${stderr}`);
}

class CdpClient {
  #socket;
  #nextId = 1;
  #pending = new Map();

  constructor(url) {
    this.#socket = new WebSocket(url);
  }

  async open() {
    if (this.#socket.readyState === WebSocket.OPEN) return;
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
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error(`Chrome target creation failed: ${response.status}`);
  const target = await response.json();
  const cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
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
  if (result.exceptionDetails) {
    throw new Error(`Browser evaluation failed: ${result.exceptionDetails.text ?? "unknown exception"}`);
  }
  return result.result?.value;
}

async function waitFor(cdp, expression, description, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 40));
  }
  throw new Error(`Timed out waiting for: ${description}`);
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

  await check("route change focuses the new screen heading", async () => {
    await evaluate(page, "document.querySelector('[data-role=PERSON]').click()");
    await waitFor(page, "document.querySelector('#search-view').hidden === false", "search screen");
    assert.equal(await evaluate(page, "document.activeElement?.id"), "search-title");
  });

  await check("search submission focuses results heading", async () => {
    await evaluate(page, "document.querySelector('#search-form').requestSubmit()");
    await waitFor(page, "document.querySelector('#results-view').hidden === false", "results screen");
    assert.equal(await evaluate(page, "document.activeElement?.id"), "results-title");
  });

  await check("public specialist pathway stays visible without a protected destination", async () => {
    assert.equal(
      await evaluate(page, "document.querySelector('[data-service=restricted]')?.textContent.trim()"),
      "Get referral help",
    );
    assert.equal(
      await evaluate(page, "document.body.innerText.includes('5 Synthetic Lane')"),
      false,
    );
    assert.equal(
      await evaluate(page, "document.body.innerText.includes('Location protected')"),
      true,
    );
  });

  await check("List/Map tabs support keyboard navigation and protected-area rendering", async () => {
    await evaluate(page, "document.querySelector('#list-tab').focus()");
    await key(page, "ArrowRight", 39);
    assert.equal(await evaluate(page, "document.activeElement?.id"), "map-tab");
    assert.equal(await evaluate(page, "document.querySelector('#map-panel').hidden"), false);
    assert.equal(await evaluate(page, "document.querySelector('#list-panel').hidden"), true);
    assert.equal(await evaluate(page, "document.querySelector('#synthetic-map').innerText.includes('Protected area')"), true);
    await key(page, "ArrowLeft", 37);
    assert.equal(await evaluate(page, "document.activeElement?.id"), "list-tab");
  });

  await check("read-only feed opens a contact route rather than a booking flow", async () => {
    assert.equal(
      await evaluate(page, "document.querySelector('[data-service=read-only]')?.textContent.trim()"),
      "Contact service",
    );
    await evaluate(page, "document.querySelector('[data-service=read-only]').click()");
    await waitFor(page, "document.querySelector('#action-dialog').open", "read-only information dialog");
    assert.equal(
      await evaluate(page, "document.querySelector('#dialog-content').innerText.includes('Live availability does not imply bookability.')"),
      true,
    );
    await key(page, "Escape", 27);
    await waitFor(page, "!document.querySelector('#action-dialog').open", "dialog close on Escape");
  });

  await check("offline mode withdraws live placement actions", async () => {
    await evaluate(page, "document.querySelector('#offline-toggle').click()");
    assert.equal(await evaluate(page, "document.querySelector('#offline-banner').hidden"), false);
    assert.equal(
      await evaluate(page, "[...document.querySelectorAll('.result-action')].every(button => button.disabled)"),
      true,
    );
    assert.equal(
      await evaluate(page, "document.querySelector('#results-summary').innerText.includes('live capacity is deliberately treated as unconfirmed')"),
      true,
    );
    await evaluate(page, "document.querySelector('#offline-toggle').click()");
  });

  await check("public specialist action explains referral without revealing a destination", async () => {
    await evaluate(page, "document.querySelector('[data-service=restricted]').click()");
    await waitFor(page, "document.querySelector('#action-dialog').open", "specialist referral-help dialog");
    assert.equal(await evaluate(page, "document.querySelector('#dialog-title').innerText"), "Professional referral required");
    assert.equal(await evaluate(page, "document.querySelector('#action-dialog').innerText.includes('Synthetic Lane')"), false);
    await key(page, "Escape", 27);
  });

  await check("provider screen focuses heading and updates synthetic capacity/referral state", async () => {
    await evaluate(page, "document.querySelector('[data-back-to-search]').click()");
    await waitFor(page, "document.querySelector('#search-view').hidden === false", "search screen return");
    assert.equal(await evaluate(page, "document.activeElement?.id"), "search-title");
    await evaluate(page, "document.querySelector('#search-view [data-back]').click()");
    await waitFor(page, "document.querySelector('#start-view').hidden === false", "start screen return");
    assert.equal(await evaluate(page, "document.activeElement?.id"), "start-title");
    await evaluate(page, "document.querySelector('[data-role=PROVIDER]').click()");
    await waitFor(page, "document.querySelector('#provider-view').hidden === false", "provider screen");
    assert.equal(await evaluate(page, "document.activeElement?.id"), "provider-title");
    assert.equal(await evaluate(page, "document.querySelector('#capacity-output').value"), "3");
    await evaluate(page, "document.querySelector('#capacity-plus').click()");
    assert.equal(await evaluate(page, "document.querySelector('#capacity-output').value"), "4");
    await evaluate(page, "document.querySelector('#accept-referral').click()");
    assert.equal(
      await evaluate(page, "document.querySelector('#provider-referral-status').innerText.includes('accepted')"),
      true,
    );
  });

  await check("narrow mobile viewport does not introduce horizontal page overflow", async () => {
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 740,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await page.send("Page.navigate", { url: `${baseUrl}/prototype/ux/` });
    await waitFor(page, "document.readyState === 'complete'", "mobile reload");
    assert.equal(
      await evaluate(page, "document.documentElement.scrollWidth <= window.innerWidth + 1"),
      true,
    );
    assert.equal(await evaluate(page, "window.innerWidth"), 360);
  });

  console.log(`SafeBed rendered-browser smoke passed: ${passed}/${passed} checks.`);
} finally {
  page?.close();
  server.close();
  chrome.kill("SIGTERM");
  await rm(profileDir, { recursive: true, force: true });
}
