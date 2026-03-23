(function ($) {
    "use strict";

    async function loadPartials() {

        async function loadFile(paths) {
            for (const path of paths) {
                try {
                    const res = await fetch(path);
                    if (res.ok) {
                        return await res.text();
                    }
                } catch (e) { }
            }
            return "";
        }

        try {

            // Load spinner trước để hiển thị ngay
            const spinner = await loadFile([
                "../spinner.html",
                "spinner.html"
            ]);

            if (spinner) {
                document.body.insertAdjacentHTML("afterbegin", spinner);
            }

            // Load header + footer song song
            const [header, footer] = await Promise.all([
                loadFile(["../header.html", "header.html"]),
                loadFile(["../footer.html", "footer.html"])
            ]);

            if (header) {
                document.body.insertAdjacentHTML("afterbegin", header);
            }

            if (footer) {
                document.body.insertAdjacentHTML("beforeend", footer);
            }

        } catch (err) {
            console.error("Partial load error:", err);
        }

        const currentLang = localStorage.getItem("lang") || "vi";
        loadLanguage(currentLang);

        // Ẩn spinner
        setTimeout(() => {
            const spinnerEl = document.getElementById("spinner");
            if (spinnerEl) spinnerEl.classList.remove("show");

            const overlay = document.querySelector(".spinner-overlay");
            if (overlay) overlay.classList.add("d-none");
        }, 400);
    }


    function setActiveMenu() {

        const current = window.location.pathname;

        document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {

            const href = link.getAttribute("href");
            if (!href) return;

            if (href.includes("brands") && current.includes("brands")) {
                link.classList.add("active");
            }

            if (current.endsWith(href)) {
                link.classList.add("active");
            }

        });
    }

    $(async function () {
        await loadPartials();   // load header/footer trước
        setActiveMenu();        // active menu
    });

})(jQuery);

function setActiveLang(lang) {
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const activeBtn = document.querySelector(`.lang-btn[data-lang="${lang}"]`);
    if (activeBtn) {
        activeBtn.classList.add("active");
    }
}

// click event
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("lang-btn")) {
        const lang = e.target.dataset.lang;
        loadLanguage(lang);
        setActiveLang(lang);
    }
});

let currentLang = localStorage.getItem("lang") || "vi";

console.log("currentLang:", currentLang);

async function loadLanguage(lang) {
    try {
        const res = await fetch(`assets/lang/${lang}.json`);
        const data = await res.json();

        window.langData = data;

        document.querySelectorAll("[data-i18n]").forEach(el => {
            if (el.dataset.i18nPlaceholder) {
                el.placeholder = getValue(data, el.dataset.i18nPlaceholder);
            }
            const keys = el.getAttribute("data-i18n").split(".");
            let text = data;

            keys.forEach(k => text = text?.[k]);

            if (text) {
                el.innerHTML = text;
            }
        });

        localStorage.setItem("lang", lang);
        setActiveLang(lang);

        if (products && products.length) {
            renderProducts(products);
            renderCategoryTitle();
            renderBreadcrumb();
        }

        if (product) {
            renderProduct(product);
            renderBreadcrumbDetail(product);
        }

    } catch (err) {
        console.error("Load language error:", err);
    }
}

// 👉 Lấy category từ URL
function renderCategoryTitle() {
    const el = document.getElementById("categoryTitle");
    const { category } = getParams();
    console.log("category", category)
    if (!category) {
        el.innerText = "All Products";
        return;
    }

    const decoded = decodeURIComponent(t(categoryMap[category]));
    if (el !== null) {
        el.innerHTML = `
            <span class="text-success">${decoded}</span> ${t('products')}
        `;
    }
}

const categoryMap = {
    "rotational_speed_sensors_products": "category.rotational.title",
    "stationary_stroboscopes_products": "category.stationary.title",
    "portable_stroboscopes_products": "category.portable.title",
    "digital_hand_tachometers_products": "category.hand.title",
    "others_products": "category.other.title",
    "assessories": "category.accessories.title",
};

function t(key) {
    const keys = key.split(".");
    let text = window.langData;

    keys.forEach(k => {
        text = text?.[k];
    });

    return text || key; // fallback nếu thiếu key
}

let products = [];

async function loadProducts() {
    const { category } = getParams()
    renderCategoryTitle(); // 👈 THÊM DÒNG NÀY
    renderBreadcrumb();

    try {
        const res = await fetch(`./assets/data/${category}.json`);
        const data = await res.json();

        products = Object.entries(data);
        console.log("products", products)

        init();
    } catch (err) {
        console.error("Load JSON error:", err);
    }
}

function setupSearch() {

    const searchInput = document.getElementById("searchInput");

    let timeout; // 👈 đặt ở đây

    searchInput.addEventListener("input", function () {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            const keyword = this.value.toLowerCase();

            if (!keyword) {
                renderProducts(products);
                return;
            }

            const filtered = products.filter(([key, p]) => {
                return (
                    p.name.toLowerCase().includes(keyword) ||
                    (p.category && p.category.toLowerCase().includes(keyword))
                );
            });

            renderProducts(filtered);

        }, 300);

    });
}

function renderBreadcrumb() {
    const el = document.getElementById("breadcrumb");
    const { category } = getParams();

    let html = `
        <li class="breadcrumb-item">
            <a href="index.html">${t('home')}</a>
        </li>
        <li class="breadcrumb-item">
            <a href="categories.html">${t('categories')}</a>
        </li>
    `;

    if (category) {
        const decoded = decodeURIComponent(t(categoryMap[category]));

        html += `
            <li class="breadcrumb-item active" aria-current="page">
                ${decoded}
            </li>
        `;
    }

    el.innerHTML = html;
}

function init() {
    renderProducts(products);
    setupSearch();
}

function renderProducts(productsData) {
    const productList = document.getElementById("productList");
    const { category } = getParams();
    const lang = localStorage.getItem("lang") || "vi";
    productList.innerHTML = "";

    if (!productsData || productsData.length === 0) {
        productList.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="bi bi-search" style="font-size:40px;"></i>
            <p class="mt-3 text-muted">${t("not_found")}</p>
        </div>
        `;
        return;
    }

    Object.values(productsData).forEach(([key, p]) => {
        console.log("product", p)

        const col = document.createElement("div"); // ⚠️ phải tạo col ở đây
        col.className = "col-md-4 mb-4";

        col.innerHTML = `
            <div class="card h-100 shadow-sm"
                 onclick="goDetail('${key}', '${category}')"
                 style="cursor:pointer;">

                <img src="./assets/images/${p.images[0]}" class="card-img-top">

                <div class="card-body">
                    <span class="badge bg-success mb-2">${p.category?.[lang] || p?.category || ''}</span>
                    <span class="badge bg-success mb-2">${p.main_category?.[lang] || p?.main_category || ''}</span>
                    <h5>${p.name?.[lang] || p?.name || ''}</h5>
                </div>

                <div class="card-footer bg-white border-0">
                    <a href="#" onclick="event.stopPropagation(); goDetail('${key}', '${category}')"
                       class="text-success text-decoration-none">
                        ${t("view")}
                    </a>
                </div>
            </div>
        `;

        productList.appendChild(col);
    });
}


function goDetail(id, category) {
    window.location.href = `product-detail.html?category=${category}&id=${id}`;
}


// ===== GET PARAM =====
function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        category: params.get("category"),
        id: params.get("id")
    };
}

let product = null;
// ===== LOAD DATA =====
async function loadProductDetail() {
    const { category, id } = getParams();
    const lang = localStorage.getItem("lang") || "vi";

    try {
        const res = await fetch(`./assets/data/${category}.json`);
        const data = await res.json();

        product = data[id];
        loadLanguage(lang);

        if (!product) {
            document.getElementById("productDetail").innerHTML = `<p>${t("not_found")}</p>`;
            return;
        }


    } catch (err) {
        console.error(err);
    }
}


function renderBreadcrumbDetail(product) {
    const el = document.getElementById("breadcrumb");
    const { category } = getParams();
    const lang = localStorage.getItem("lang") || "vi";

    el.innerHTML = `
        <li class="breadcrumb-item">
            <a href="index.html">${t('home')}</a>
        </li>
        <li class="breadcrumb-item">
            <a href="categories.html">${t('categories')}</a>
        </li>
        <li class="breadcrumb-item">
            <a href="products.html?category=${encodeURIComponent(category)}">
                ${t(categoryMap[category])}
            </a>
        </li>
        <li class="breadcrumb-item active">
            ${product.name?.[lang] || product?.name || ''}
        </li>
    `;
}

// ===== RENDER =====
function renderProduct(p) {
    console.log("detail-product", p)

    const container = document.getElementById("productDetail");
    const lang = localStorage.getItem("lang") || "vi";

    // 🔹 images grid
    const imagesHTML = `
    <div class="row justify-content-center">
        ${p.images.map(img => `
            <div class="col-md-4 mb-3 text-center">
                <img src="./assets/images/${img}" 
                     class="img-fluid rounded shadow-sm">
            </div>
        `).join("")}
        </div>
    `;

    // 🔹 applications
    const renderListSection = (title, list) => {
        if (!list || list.length === 0) return "";

        return `
        <div class="col-md-6 mb-4">
            <h4>${title}</h4>
            <ul>
                ${list.map(i => `<li>${i}</li>`).join("")}
            </ul>
        </div>
    `;
    };

    const renderTechTable = (data) => {
        if (!data || Object.keys(data).length === 0) return "";

        const rows = Object.entries(data).map(([k, v]) => `
        <tr>
            <th>${k}</th>
            <td>${v}</td>
        </tr>
    `).join("");

        return `
        <div class="mb-5">
            <h4>${t('technical_data')}</h4>
            <table class="table table-bordered">
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
    };

    // 🔹 docs
    const renderDocs = (docs) => {
        if (!docs || docs.length === 0) return "";

        const list = docs.map(doc => `
        <li class="mb-2">
            <a href="./assets/files/${doc}" target="_blank" 
               class="text-success text-decoration-none">
                ${doc} →
            </a>
        </li>
    `).join("");

        return `
        <div class="mb-5">
            <h4>${t('documents')}</h4>
            <ul class="list-unstyled">
                ${list}
            </ul>
        </div>
    `;
    };

    const applicationsHTML = renderListSection(t("applications"), p.applications?.[lang] || p.applications);
    const featuresHTML = renderListSection(t("features"), p.features?.[lang] || p.features);
    const techHTML = renderTechTable(p.technical_data?.[lang] || p.technical_data);
    const docsHTML = renderDocs(p.docs);

    container.innerHTML = `
        <div class="row mb-4">
            <!-- INFO -->
            <div class="col-md-12">
                <span class="badge bg-success mb-2">${p.category?.[lang]}</span>
                <span class="badge bg-success mb-2">${p?.main_category?.[lang] || ''}</span>
                <h2 class="fw-bold">${p.name?.[lang]}</h2>

                <div class="mt-3">
                    ${p.description?.[lang] || ""}
                </div>

                ${p?.scope_of_delivery?.[lang] && p?.scope_of_delivery?.[lang].trim() ? `
                    <h4 class="fw-bold">${t('scope_of_delivery')}</h4>
                    ${p?.scope_of_delivery?.[lang]}
                ` : ""}
            </div>

        </div>

        <!-- IMAGE GRID -->
        <div class="row mb-5">
            ${imagesHTML}
        </div>

        <div class="row">
            ${applicationsHTML}
            ${featuresHTML}
        </div>
        ${techHTML}

        ${docsHTML}
    `;
}

const { id } = getParams();

if (id) {
    loadProductDetail();
} else {
    loadProducts();
}


