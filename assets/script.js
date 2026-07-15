(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Mobile nav ---------- */

  var hamburger = document.querySelector(".hamburger");
  var mainNav = document.querySelector(".main-nav");

  if (hamburger && mainNav) {
    hamburger.addEventListener("click", function () {
      var isOpen = mainNav.getAttribute("data-open") === "true";
      mainNav.setAttribute("data-open", String(!isOpen));
      hamburger.setAttribute("aria-expanded", String(!isOpen));
    });

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.setAttribute("data-open", "false");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- FAQ accordion ---------- */

  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    if (!question) return;
    question.addEventListener("click", function () {
      var isOpen = item.getAttribute("data-open") === "true";
      document.querySelectorAll(".faq-item").forEach(function (other) {
        if (other !== item) other.setAttribute("data-open", "false");
      });
      item.setAttribute("data-open", String(!isOpen));
    });
  });

  /* ---------- Reveal on scroll ---------- */

  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Compass scroll-linked rotation ---------- */

  var compass = document.querySelector(".compass-wrap svg");

  if (compass && !prefersReducedMotion) {
    var ticking = false;

    function updateCompass() {
      var scrollY = window.scrollY || window.pageYOffset;
      var angle = (scrollY * 0.15) % 360;
      compass.style.transform = "rotate(" + angle + "deg)";
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateCompass);
          ticking = true;
        }
      },
      { passive: true }
    );

    updateCompass();
  }
})();
