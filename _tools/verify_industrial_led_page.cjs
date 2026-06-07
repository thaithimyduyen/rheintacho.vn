const { chromium } = require("playwright");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

async function main() {
  const url = pathToFileURL("D:\\20. Các website\\Qlight\\Qlight\\san-pham\\den-led-cong-nghiep\\index.html").href;
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, executablePath });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(url, { waitUntil: "load" });
  const desktop = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent.trim(),
    cards: document.querySelectorAll(".catalog-card").length,
    partRows: document.querySelectorAll(".part-row").length,
    visiblePartRows: document.querySelectorAll(".part-row:not([hidden])").length,
    hasQlex: document.body.textContent.includes("QLEX"),
    hasAtex: document.body.textContent.includes("ATEX"),
    hasIp69k: document.body.textContent.includes("IP69K"),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  await page.fill("#partSearch", "QLEX");
  await page.waitForTimeout(150);
  const qlexSearch = await page.evaluate(() => ({
    status: document.querySelector("#partCount")?.textContent.trim(),
    visible: document.querySelectorAll(".part-row:not([hidden])").length,
  }));

  await page.fill("#catalogSearch", "chống cháy nổ");
  await page.waitForTimeout(150);
  const catalogSearch = await page.evaluate(() => ({
    status: document.querySelector("#catalogCount")?.textContent.trim(),
    visible: document.querySelectorAll(".catalog-card:not([hidden])").length,
  }));

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: "load" });
  const mobileMetrics = await mobile.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cards: document.querySelectorAll(".catalog-card").length,
    partRows: document.querySelectorAll(".part-row").length,
  }));

  await browser.close();
  console.log(JSON.stringify({ desktop, qlexSearch, catalogSearch, mobile: mobileMetrics }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
