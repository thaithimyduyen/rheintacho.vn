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

async function collect(page) {
  return page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll(".hero-slide"));
    const productImages = Array.from(document.querySelectorAll(".product-card-media img"));
    const galleryImages = Array.from(document.querySelectorAll(".visual-gallery-card img"));
    const allImages = [...slides, ...productImages, ...galleryImages];
    return {
      title: document.title,
      slideCount: slides.length,
      loadedSlides: slides.filter((img) => img.complete && img.naturalWidth > 0).length,
      productImageCount: productImages.length,
      loadedProductImages: productImages.filter((img) => img.complete && img.naturalWidth > 0).length,
      galleryImageCount: galleryImages.length,
      loadedGalleryImages: galleryImages.filter((img) => img.complete && img.naturalWidth > 0).length,
      imageSources: slides.map((img) => img.getAttribute("src")),
      altTexts: allImages.map((img) => img.getAttribute("alt")),
      slideshowCount: document.querySelectorAll(".hero-slideshow").length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

async function loadLazyImages(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const lazyTargets = Array.from(document.querySelectorAll(".product-card-media img, .visual-gallery-card img"));
    for (const target of lazyTargets) {
      target.scrollIntoView({ block: "center" });
      await wait(180);
    }
    await Promise.allSettled(
      lazyTargets.map((img) => (typeof img.decode === "function" ? img.decode() : Promise.resolve()))
    );
    window.scrollTo(0, 0);
    await wait(180);
  });
}

async function main() {
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, executablePath });

  const home = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await home.goto(pathToFileURL("D:\\20. Các website\\Qlight\\Qlight\\index.html").href, { waitUntil: "load" });
  await loadLazyImages(home);
  const homeMetrics = await collect(home);

  const product = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await product.goto(pathToFileURL("D:\\20. Các website\\Qlight\\Qlight\\san-pham\\den-thap-tin-hieu\\index.html").href, { waitUntil: "load" });
  await loadLazyImages(product);
  const productMetrics = await collect(product);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(pathToFileURL("D:\\20. Các website\\Qlight\\Qlight\\san-pham\\den-thap-tin-hieu\\index.html").href, { waitUntil: "load" });
  await loadLazyImages(mobile);
  const mobileMetrics = await collect(mobile);

  await browser.close();

  assertEqual(homeMetrics.slideCount, 3, "home hero slide count");
  assertEqual(homeMetrics.loadedSlides, 3, "home loaded slides");
  assertEqual(homeMetrics.productImageCount, 6, "home product image count");
  assertEqual(homeMetrics.loadedProductImages, 6, "home loaded product images");
  assertTruthy(homeMetrics.altTexts.every(Boolean), "home alt text");
  assertEqual(homeMetrics.overflow, 0, "home horizontal overflow");

  assertEqual(productMetrics.slideCount, 3, "product hero slide count");
  assertEqual(productMetrics.loadedSlides, 3, "product loaded slides");
  assertEqual(productMetrics.galleryImageCount, 6, "product gallery image count");
  assertEqual(productMetrics.loadedGalleryImages, 6, "product loaded gallery images");
  assertTruthy(productMetrics.altTexts.every(Boolean), "product alt text");
  assertEqual(productMetrics.overflow, 0, "product horizontal overflow");
  assertEqual(mobileMetrics.overflow, 0, "mobile product horizontal overflow");

  console.log(JSON.stringify({ home: homeMetrics, product: productMetrics, mobile: mobileMetrics }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
