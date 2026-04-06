(function ($) {
    "use strict";

    async function loadPartials() {
        const lang = getLang();
        async function loadComponent(id, name) {
            try {
                const path = `/assets/components/${lang}/${name}.html`;
                const res = await fetch(path);
                if (!res.ok) throw new Error("Fetch failed: " + path);

                const html = await res.text();
                const el = document.getElementById(id);

                if (el) {
                    el.innerHTML = html;
                } else {
                    console.warn(`Missing #${id} in HTML`);
                }

            } catch (err) {
                console.error("Load component error:", err);
            }
        }

        try {
            // load spinner
            const res = await fetch("/assets/components/spinner.html");
            if (res.ok) {
                const spinner = await res.text();
                document.body.insertAdjacentHTML("afterbegin", spinner);
            }

            // ⚠️ QUAN TRỌNG: phải await
            await loadComponent("header", "header");
            await loadComponent("footer", "footer");

        } catch (err) {
            console.error("Partial load error:", err);
        }

        setActiveLang(lang);
        // hide spinner
        setTimeout(() => {
            document.getElementById("spinner")?.classList.remove("show");
            document.querySelector(".spinner-overlay")?.classList.add("d-none");
        }, 400);
    }

    document.querySelectorAll('.nav-item.dropdown > .nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            if (window.innerWidth >= 992) {
                window.location.href = this.href;
            }
        });
    });

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

function getLang() {
    const path = window.location.pathname;
    if (path.startsWith("/vi")) return "vi";
    return "en";
}

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
    if (!e.target.classList.contains("lang-btn")) return;

    const newLang = e.target.dataset.lang;

    // tìm link hreflang tương ứng
    const link = document.querySelector(`link[hreflang="${newLang}"]`);

    if (link && link.href) {
        window.location.href = link.href;
    } else {
        console.warn("No hreflang found for:", newLang);
    }
});



function setupSearch() {

    const searchInput = document.getElementById("searchInput");
    const lang = localStorage.getItem("lang") || "vi";

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
                    (p.name && p.name?.[lang].toLowerCase().includes(keyword)) ||
                    (p.category && p.category?.[lang].toLowerCase().includes(keyword))
                );
            });

            renderProducts(filtered);

        }, 300);

    });
}
