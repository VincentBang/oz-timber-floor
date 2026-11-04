(function () {
  function closeMenu(header, button, nav, restoreFocus) {
    header.classList.remove("mobile-nav-open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open menu");
    if(innerWidth<=980)nav.setAttribute("aria-hidden", "true");else nav.removeAttribute("aria-hidden");
    if (restoreFocus) {
      button.focus();
    }
  }

  function openMenu(header, button, nav) {
    header.classList.add("mobile-nav-open");
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Close menu");
    nav.setAttribute("aria-hidden", "false");
    const firstLink = nav.querySelector("a");
    if (firstLink) {
      firstLink.focus();
    }
  }

  function initMobileNav() {
    const header = document.querySelector(".site-header");
    const button = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".nav-links");

    if (!header || !button || !nav) {
      return;
    }

    closeMenu(header, button, nav, false);

    button.addEventListener("click", function () {
      const isOpen = header.classList.contains("mobile-nav-open");
      if (isOpen) {
        closeMenu(header, button, nav, false);
      } else {
        openMenu(header, button, nav);
      }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(header, button, nav, false);
      });
    });

    document.addEventListener("click", function (event) {
      if (window.innerWidth > 980) {
        return;
      }
      if (!header.contains(event.target)) {
        closeMenu(header, button, nav, false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("mobile-nav-open")) {
        closeMenu(header, button, nav, true);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) {
        header.classList.remove("mobile-nav-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open menu");
        nav.removeAttribute("aria-hidden");
        return;
      }
      if (!header.classList.contains("mobile-nav-open")) {
        nav.setAttribute("aria-hidden", "true");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileNav);
  } else {
    initMobileNav();
  }
})();
