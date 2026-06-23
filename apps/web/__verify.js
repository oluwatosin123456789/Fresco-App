const { chromium } = require("playwright");
const path = require("path");

const SHOTS = path.join(__dirname, "shots");
require("fs").mkdirSync(SHOTS, { recursive: true });

const consoleErrors = [];
const failedRequests = [];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    permissions: [],
  });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });

  let step = "start";
  try {
    step = "nav /scan";
    await page.goto("http://localhost:3000/scan", { waitUntil: "networkidle" });
    await page.waitForSelector('button[aria-label="Capture"]', { timeout: 15000 });
    await page.screenshot({ path: path.join(SHOTS, "01-scan.png") });

    step = "upload photo";
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(
      "C:\\Users\\SOJ\\AppData\\Local\\Temp\\claude\\c--Users-SOJ-Documents-Fresco\\bbfd5179-aef1-4bc2-a455-bfcf7ffff983\\scratchpad\\test-produce.jpg"
    );

    step = "analyzing overlay";
    await page.waitForSelector("text=READING FRESHNESS", { timeout: 5000 }).catch(() => {});
    await page.screenshot({ path: path.join(SHOTS, "02-analyzing.png") });

    step = "result screen";
    await page.waitForURL(/\/scan\/\d+/, { timeout: 10000 });
    await page.waitForSelector("text=/100 SCORE", { timeout: 10000 });
    await page.screenshot({ path: path.join(SHOTS, "03-result.png") });

    step = "save to pantry";
    await page.click("text=Save to Pantry");
    await page.waitForSelector("text=Saved to Pantry", { timeout: 5000 });
    await page.screenshot({ path: path.join(SHOTS, "04-saved.png") });

    step = "nav /pantry";
    await page.goto("http://localhost:3000/pantry", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Pantry", { timeout: 10000 });
    await page.screenshot({ path: path.join(SHOTS, "05-pantry.png") });

    step = "nav /cook";
    await page.goto("http://localhost:3000/cook", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Cook it up", { timeout: 10000 });
    await page.screenshot({ path: path.join(SHOTS, "06-cook.png") });

    step = "mark item used";
    await page.goto("http://localhost:3000/pantry", { waitUntil: "networkidle" });
    await page.click('button[aria-label="Mark used"]');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS, "07-pantry-after-used.png") });

    step = "nav /saved";
    await page.goto("http://localhost:3000/saved", { waitUntil: "networkidle" });
    await page.waitForSelector("text=You saved", { timeout: 10000 });
    await page.screenshot({ path: path.join(SHOTS, "08-saved-tracker.png") });

    step = "nav /trader";
    await page.goto("http://localhost:3000/trader", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Batch grade", { timeout: 10000 });
    const traderInput = await page.locator('input[type="file"]').first();
    await traderInput.setInputFiles([
      "C:\\Users\\SOJ\\AppData\\Local\\Temp\\claude\\c--Users-SOJ-Documents-Fresco\\bbfd5179-aef1-4bc2-a455-bfcf7ffff983\\scratchpad\\test-produce.jpg",
      "C:\\Users\\SOJ\\AppData\\Local\\Temp\\claude\\c--Users-SOJ-Documents-Fresco\\bbfd5179-aef1-4bc2-a455-bfcf7ffff983\\scratchpad\\test-produce.jpg",
    ]);
    await page.waitForSelector("text=QUALITY DISTRIBUTION", { timeout: 10000 });
    await page.screenshot({ path: path.join(SHOTS, "09-trader.png") });

    step = "pantry header PRO link";
    await page.goto("http://localhost:3000/pantry", { waitUntil: "networkidle" });
    await page.waitForSelector("text=PRO", { timeout: 5000 });

    console.log("ALL_STEPS_OK");
  } catch (err) {
    console.log("FAILED_AT_STEP:", step);
    console.log("ERROR:", err.message);
    await page.screenshot({ path: path.join(SHOTS, `FAIL-${step.replace(/[^a-z0-9]/gi, "_")}.png`) }).catch(() => {});
  }

  console.log("---CONSOLE_ERRORS---");
  console.log(JSON.stringify(consoleErrors, null, 2));
  console.log("---FAILED_REQUESTS---");
  console.log(JSON.stringify(failedRequests, null, 2));

  await browser.close();
})();
