(function () {
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.querySelector(".nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  var search = document.getElementById("productSearch");
  var grid = document.getElementById("productGrid");
  var empty = document.getElementById("emptyProducts");

  if (search && grid) {
    search.addEventListener("input", function () {
      var query = search.value.trim().toLowerCase();
      var visible = 0;
      grid.querySelectorAll(".product-card").forEach(function (card) {
        var haystack = card.getAttribute("data-search") || card.textContent.toLowerCase();
        var match = !query || haystack.indexOf(query) !== -1;
        card.style.display = match ? "" : "none";
        if (match) visible += 1;
      });
      if (empty) empty.style.display = visible ? "none" : "block";
    });
  }

  var mainImage = document.getElementById("mainProductImage");
  if (mainImage) {
    document.querySelectorAll(".thumb").forEach(function (button) {
      button.addEventListener("click", function () {
        var image = button.getAttribute("data-image");
        if (image) mainImage.setAttribute("src", image);
      });
    });
  }
})();
