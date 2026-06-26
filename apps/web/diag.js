const { chromium } = require("playwright");
const path = require("path");

const SHOTS = path.join(__dirname, "shots");
require("fs").mkdirSync(SHOTS, { recursive: true });

const TEST_IMG = path.join(__dirname, "test-produce.jpg");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const network = [];

  page.on("console", (m) => {
    console.log(`[browser][${m.type()}] ${m.text()}`);
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("request", (r) => {
    if (r.url().includes("localhost:8000")) {
      console.log(`[req] ${r.method()} ${r.url()}`);
      network.push({ type: "req", method: r.method(), url: r.url() });
    }
  });
  page.on("response", async (r) => {
    if (r.url().includes("localhost:8000")) {
      let body = "";
      try { body = await r.text(); } catch {}
      console.log(`[res] ${r.status()} ${r.url()} → ${body.slice(0, 200)}`);
      network.push({ type: "res", status: r.status(), url: r.url(), body: body.slice(0, 200) });
    }
  });
  page.on("requestfailed", (r) => {
    console.log(`[fail] ${r.method()} ${r.url()} → ${r.failure()?.errorText}`);
  });

  // Step 1: load scan page
  console.log("--- nav /scan");
  await page.goto("http://localhost:3000/scan", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('button[aria-label="Capture"]', { timeout: 20000 });
  await page.screenshot({ path: path.join(SHOTS, "d01-scan.png") });
  console.log("--- scan page loaded OK");

  // Step 2: locate file input and set files
  console.log("--- locating file input");
  const fileInput = page.locator('input[type="file"]').first();
  const inputCount = await page.locator('input[type="file"]').count();
  console.log(`--- found ${inputCount} file input(s)`);

  // Wait for input to be attached to DOM
  await fileInput.waitFor({ state: "attached", timeout: 5000 });
  console.log("--- file input attached");

  // Check input attributes
  const capture = await fileInput.getAttribute("capture");
  const accept = await fileInput.getAttribute("accept");
  console.log(`--- input: accept="${accept}" capture="${capture}"`);

  // Set files
  console.log("--- setting file");
  await fileInput.setInputFiles(TEST_IMG);
  console.log("--- file set, waiting for API call...");

  // Wait for the scan API call
  try {
    await page.waitForResponse(
      (r) => r.url().includes("/scans") && r.request().method() === "POST",
      { timeout: 10000 }
    );
    console.log("--- POST /scans response received");
  } catch (e) {
    console.log("--- TIMEOUT waiting for POST /scans:", e.message);
    await page.screenshot({ path: path.join(SHOTS, "d02-no-api-call.png") });

    // Check current page state
    const html = await page.content();
    console.log("--- page HTML snippet:", html.slice(0, 500));
  }

  await page.screenshot({ path: path.join(SHOTS, "d02-after-upload.png") });

  // Wait for navigation
  console.log("--- waiting for /scan/{id} navigation (20s)...");
  try {
    await page.waitForURL(/\/scan\/\d+/, { timeout: 20000 });
    console.log("--- navigated to:", page.url());
    await page.screenshot({ path: path.join(SHOTS, "d03-result.png") });
  } catch (e) {
    console.log("--- navigation failed:", e.message);
    console.log("--- current URL:", page.url());
    await page.screenshot({ path: path.join(SHOTS, "d03-fail.png") });
  }

  console.log("--- CONSOLE_ERRORS:", JSON.stringify(consoleErrors));
  console.log("--- NETWORK:", JSON.stringify(network, null, 2));

  await browser.close();
})();
