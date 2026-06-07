const { chromium } = require("playwright");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function assertTruthy(value, label) {
  if (!value) {
    throw new Error(`${label}: expected truthy value`);
  }
}

async function collectMetrics(page) {
  return page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent.trim(),
    cards: document.querySelectorAll(".catalog-card").length,
    partRows: document.querySelectorAll(".part-row").length,
    visiblePartRows: document.querySelectorAll(".part-row:not([hidden])").length,
    hasSta: document.body.textContent.includes("STA25SLM"),
    hasQat: document.body.textContent.includes("QAT80"),
    hasQtg: document.body.textContent.includes("QTG50"),
    hasUsb: document.body.textContent.includes("USB Tower Lights"),
    hasEthernet: document.body.textContent.includes("ETN Tower Lights"),
    hasEx: document.body.textContent.includes("QST50-Ex"),
    hasAccentedText: document.body.textContent.includes("Đèn tháp LED siêu mỏng 25mm"),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
}

async function readPartStatus(page) {
  return page.evaluate(() => ({
    status: document.querySelector("#partCount")?.textContent.trim(),
    visible: document.querySelectorAll(".part-row:not([hidden])").length,
  }));
}

async function readCatalogStatus(page) {
  return page.evaluate(() => ({
    status: document.querySelector("#catalogCount")?.textContent.trim(),
    visible: document.querySelectorAll(".catalog-card:not([hidden])").length,
  }));
}

async function main() {
  const url = pathToFileURL("D:\\20. Các website\\Qlight\\Qlight\\san-pham\\den-thap-tin-hieu\\index.html").href;
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, executablePath });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(url, { waitUntil: "load" });
  const desktop = await collectMetrics(page);

  await page.fill("#partSearch", "QAT80");
  await page.waitForTimeout(150);
  const qatSearch = await readPartStatus(page);

  await page.fill("#partSearch", "USB");
  await page.waitForTimeout(150);
  const usbPartSearch = await readPartStatus(page);

  await page.fill("#catalogSearch", "");
  await page.click('[data-filter="Đèn tháp USB/Ethernet"]');
  await page.waitForTimeout(150);
  const usbCatalogFilter = await readCatalogStatus(page);

  await page.click('[data-filter="Đèn tháp chống cháy nổ"]');
  await page.waitForTimeout(150);
  const exCatalogFilter = await readCatalogStatus(page);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: "load" });
  const mobileMetrics = await collectMetrics(mobile);

  await browser.close();

  assertEqual(desktop.cards, 29, "desktop catalog cards");
  assertEqual(desktop.partRows, 1510, "desktop part rows");
  assertEqual(desktop.visiblePartRows, 80, "desktop visible part rows");
  assertTruthy(desktop.h1?.includes("Đèn tháp tín hiệu Qlight"), "desktop h1");
  assertTruthy(desktop.hasSta, "STA data");
  assertTruthy(desktop.hasQat, "QAT data");
  assertTruthy(desktop.hasQtg, "QTG data");
  assertTruthy(desktop.hasUsb, "USB data");
  assertTruthy(desktop.hasEthernet, "Ethernet data");
  assertTruthy(desktop.hasEx, "ExProof data");
  assertTruthy(desktop.hasAccentedText, "Vietnamese display text");
  assertEqual(desktop.overflow, 0, "desktop horizontal overflow");
  assertEqual(mobileMetrics.overflow, 0, "mobile horizontal overflow");
  assertEqual(qatSearch.visible, 16, "QAT80 search visible rows");
  assertTruthy(qatSearch.status?.includes("16 / 16"), "QAT80 search status");
  assertEqual(usbPartSearch.visible, 76, "USB/Ethernet search visible rows");
  assertTruthy(usbPartSearch.status?.includes("76 / 76"), "USB/Ethernet search status");
  assertEqual(usbCatalogFilter.visible, 2, "USB/Ethernet catalog filter");
  assertEqual(exCatalogFilter.visible, 3, "ExProof catalog filter");

  console.log(JSON.stringify({
    desktop,
    qatSearch,
    usbPartSearch,
    usbCatalogFilter,
    exCatalogFilter,
    mobile: mobileMetrics,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
