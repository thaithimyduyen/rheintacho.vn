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
    hasWireless: document.body.textContent.includes("Wireless RF"),
    hasUsb: document.body.textContent.includes("USB DC5V"),
    hasEthernet: document.body.textContent.includes("Ethernet TCP/IP"),
    hasWiz32: document.body.textContent.includes("WIZ32"),
    hasGw768: document.body.textContent.includes("GW768"),
    hasCpkCan: document.body.textContent.includes("CPK-CAN"),
    hasSt56Etn: document.body.textContent.includes("ST56EL-ETN"),
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
  const url = pathToFileURL("D:\\20. Các website\\Qlight\\Qlight\\san-pham\\den-thap-tin-hieu-smart-factory\\index.html").href;
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, executablePath });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(url, { waitUntil: "load" });
  const desktop = await collectPageMetrics(page);

  await page.fill("#partSearch", "ST56EL-ETN");
  await page.waitForTimeout(150);
  const st56Search = await readPartStatus(page);

  await page.fill("#partSearch", "GW768");
  await page.waitForTimeout(150);
  const gw768Search = await readPartStatus(page);

  await page.fill("#catalogSearch", "");
  await page.click('[data-filter="Đèn tháp USB"]');
  await page.waitForTimeout(150);
  const usbFilter = await readCatalogStatus(page);

  await page.click('[data-filter="Đèn tháp Ethernet"]');
  await page.waitForTimeout(150);
  const ethernetFilter = await readCatalogStatus(page);

  await page.click('[data-filter="Gateway/Dongle Wireless"]');
  await page.waitForTimeout(150);
  const gatewayFilter = await readCatalogStatus(page);

  await page.click('[data-filter="Signal Phone CAN/RS485"]');
  await page.waitForTimeout(150);
  const signalPhoneFilter = await readCatalogStatus(page);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: "load" });
  const mobileMetrics = await collectPageMetrics(mobile);

  await browser.close();

  assertEqual(desktop.cards, 49, "desktop catalog cards");
  assertEqual(desktop.partRows, 109, "desktop part rows");
  assertEqual(desktop.visiblePartRows, 80, "desktop visible part rows");
  assertTruthy(desktop.h1?.includes("Đèn tháp tín hiệu Smart Factory Qlight"), "desktop h1");
  assertTruthy(desktop.hasWireless, "Wireless data");
  assertTruthy(desktop.hasUsb, "USB data");
  assertTruthy(desktop.hasEthernet, "Ethernet data");
  assertTruthy(desktop.hasWiz32, "WIZ32 data");
  assertTruthy(desktop.hasGw768, "GW768 data");
  assertTruthy(desktop.hasCpkCan, "CPK-CAN data");
  assertTruthy(desktop.hasSt56Etn, "ST56 Ethernet data");
  assertEqual(desktop.overflow, 0, "desktop horizontal overflow");
  assertEqual(mobileMetrics.overflow, 0, "mobile horizontal overflow");
  assertEqual(st56Search.visible, 5, "ST56EL-ETN search visible rows");
  assertTruthy(st56Search.status?.includes("5 / 5"), "ST56EL-ETN search status");
  assertEqual(gw768Search.visible, 1, "GW768 search visible rows");
  assertTruthy(gw768Search.status?.includes("1 / 1"), "GW768 search status");
  assertEqual(usbFilter.visible, 25, "USB catalog filter");
  assertEqual(ethernetFilter.visible, 15, "Ethernet catalog filter");
  assertEqual(gatewayFilter.visible, 2, "Gateway catalog filter");
  assertEqual(signalPhoneFilter.visible, 2, "Signal Phone catalog filter");

  console.log(JSON.stringify({
    desktop,
    st56Search,
    gw768Search,
    usbFilter,
    ethernetFilter,
    gatewayFilter,
    signalPhoneFilter,
    mobile: mobileMetrics,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
