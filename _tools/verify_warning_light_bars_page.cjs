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

async function collectPageMetrics(page) {
  return page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent.trim(),
    cards: document.querySelectorAll(".catalog-card").length,
    partRows: document.querySelectorAll(".part-row").length,
    visiblePartRows: document.querySelectorAll(".part-row:not([hidden])").length,
    hasQlv: document.body.textContent.includes("QLV-1250"),
    hasElml: document.body.textContent.includes("ELML-5"),
    hasElmSol: document.body.textContent.includes("ELM-SOL"),
    hasSamp100: document.body.textContent.includes("SAMP-100"),
    hasSm100nd: document.body.textContent.includes("SM-100ND"),
    hasIp56: document.body.textContent.includes("IP56"),
    has135db: document.body.textContent.includes("135dB"),
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
  const url = pathToFileURL("D:\\20. Các website\\Qlight\\Qlight\\san-pham\\den-canh-bao-dang-thanh\\index.html").href;
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, executablePath });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(url, { waitUntil: "load" });
  const desktop = await collectPageMetrics(page);

  await page.fill("#partSearch", "ELML-5");
  await page.waitForTimeout(150);
  const elml5Search = await readPartStatus(page);

  await page.fill("#partSearch", "QLV-1250");
  await page.waitForTimeout(150);
  const qlv1250Search = await readPartStatus(page);

  await page.fill("#catalogSearch", "");
  await page.click('[data-filter="Đèn bar xe ưu tiên"]');
  await page.waitForTimeout(150);
  const priorityBarFilter = await readCatalogStatus(page);

  await page.click('[data-filter="Đèn bar an toàn đường bộ"]');
  await page.waitForTimeout(150);
  const roadSafetyFilter = await readCatalogStatus(page);

  await page.click('[data-filter="AMP và còi đi kèm"]');
  await page.waitForTimeout(150);
  const ampHornFilter = await readCatalogStatus(page);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: "load" });
  const mobileMetrics = await collectPageMetrics(mobile);

  await browser.close();

  assertEqual(desktop.cards, 7, "desktop catalog cards");
  assertEqual(desktop.partRows, 89, "desktop part rows");
  assertEqual(desktop.visiblePartRows, 80, "desktop visible part rows");
  assertTruthy(desktop.h1?.includes("Đèn cảnh báo dạng thanh Qlight"), "desktop h1");
  assertTruthy(desktop.hasQlv, "QLV data");
  assertTruthy(desktop.hasElml, "ELML data");
  assertTruthy(desktop.hasElmSol, "ELM-SOL data");
  assertTruthy(desktop.hasSamp100, "SAMP-100 data");
  assertTruthy(desktop.hasSm100nd, "SM-100ND data");
  assertTruthy(desktop.hasIp56, "IP56 data");
  assertTruthy(desktop.has135db, "135dB data");
  assertEqual(desktop.overflow, 0, "desktop horizontal overflow");
  assertEqual(mobileMetrics.overflow, 0, "mobile horizontal overflow");
  assertEqual(elml5Search.visible, 12, "ELML-5 search visible rows");
  assertTruthy(elml5Search.status?.includes("12 / 12"), "ELML-5 search status");
  assertEqual(qlv1250Search.visible, 8, "QLV-1250 search visible rows");
  assertTruthy(qlv1250Search.status?.includes("8 / 8"), "QLV-1250 search status");
  assertEqual(priorityBarFilter.visible, 2, "priority light bar catalog filter");
  assertEqual(roadSafetyFilter.visible, 2, "road safety catalog filter");
  assertEqual(ampHornFilter.visible, 3, "amp and horn catalog filter");

  console.log(JSON.stringify({
    desktop,
    elml5Search,
    qlv1250Search,
    priorityBarFilter,
    roadSafetyFilter,
    ampHornFilter,
    mobile: mobileMetrics,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
