/* Audited mobile layouts only. Original nodes are restored above 680px. */
(function () {
  "use strict";
  function init() {
    var page = document.body.getAttribute("data-mobile-page");
    var editorial = document.body.classList.contains("editorial");
    if (!page || !window.matchMedia) return;
    var media = window.matchMedia("(max-width: 680px)");
    var changes = [], generated = [], state = new Map(), mobile = null;
    var main = document.querySelector("main");
    var responsiveImages = Array.from(main.querySelectorAll("picture.mobile-responsive-image")).map(function (picture) {
      return { picture: picture, image: picture.querySelector("img") };
    });

    function make(tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    }
    function relocate(node, destination, before) {
      if (!node || !destination) return;
      var marker = document.createComment("mobile position");
      node.parentNode.insertBefore(marker, node);
      changes.push({ node: node, marker: marker });
      destination.insertBefore(node, before || null);
    }
    function disclosure(label, key) {
      var details = make("details", "mobile-disclosure");
      details.dataset.mobileKey = key;
      details.appendChild(make("summary", "", label));
      details.appendChild(make("div", "mobile-disclosure-panel"));
      return details;
    }
    function revealHash(hash) {
      if (!hash || hash === "#") return;
      var id;
      try { id = decodeURIComponent(hash.slice(1)); } catch (error) { return; }
      var target = document.getElementById(id);
      if (!target) return;
      for (var ancestor = target; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor.tagName === "DETAILS") ancestor.open = true;
      }
      var topic = target.querySelector(":scope > details.mobile-disclosure");
      if (topic) topic.open = true;
      requestAnimationFrame(function () { target.scrollIntoView({ block: "start", behavior: "auto" }); });
    }
    function prepareContact() {
      var form = document.querySelector("[data-contact-form]");
      var optional = document.querySelector(".mobile-project-details");
      if (form && optional) {
        optional.hidden = false;
        ["timing", "property_type", "current_flooring", "access_constraints"].forEach(function (name) {
          var field = form.querySelector('[data-field="' + name + '"]');
          if (field && !field.querySelector("[required]")) relocate(field, optional.querySelector(".mobile-disclosure-panel"));
        });
      }
      var image = !editorial && document.querySelector(".hero .hero-media");
      if (image) {
        var section = make("section", "section mobile-extra-media");
        section.dataset.mobileOrder = "3";
        var shell = make("div", "shell"), more = disclosure("View flooring inspiration", "contact-image");
        shell.appendChild(more); section.appendChild(shell); main.appendChild(section); generated.push(section);
        relocate(image, more.querySelector(".mobile-disclosure-panel"));
      }
    }
    function prepareRangeCards() {
      document.querySelectorAll("a.range-summary-card").forEach(function (card, i) {
        var descriptions = Array.from(card.children).filter(function (n) {
          return n.tagName === "P" && !n.matches(".catalogue-overline,.eyebrow");
        });
        if (!descriptions.length) return;
        var row = make("div", "mobile-range-item");
        card.parentNode.insertBefore(row, card); generated.push(row);
        relocate(card, row);
        var info = disclosure("Range information", "range-" + i); row.appendChild(info);
        var name = card.querySelector("h3");
        if (name) info.querySelector("summary").setAttribute("aria-label", "Range information for " + name.textContent.trim());
        descriptions.forEach(function (description) { relocate(description, info.querySelector(".mobile-disclosure-panel")); });
      });
      var copy = Array.from(main.querySelectorAll("p")).map(function (p) { return p.textContent.trim(); });
      var warning = copy.find(function (text) { return text === "Review substrate condition, flatness and moisture before ordering or installation."; });
      if (!warning && copy.some(function (text) { return text.includes("Ask about suitability for your space before ordering."); })) warning = "Ask about suitability for your space before ordering.";
      if (warning) {
        var note = make("p", "mobile-visible-caution", warning);
        document.querySelector(".hero .button-row").after(note); generated.push(note);
      }
    }
    function compactHeroActions() {
      var actions = document.querySelector(".hero .button-row");
      if (actions) {
        var links = Array.from(actions.children).filter(function (n) { return n.tagName === "A"; });
        if (links.length > 2) {
          var more = disclosure("More enquiry options", "hero-actions");
          more.classList.add("mobile-more-actions"); actions.appendChild(more); generated.push(more);
          links.slice(2).forEach(function (link) { relocate(link, more.querySelector(".mobile-disclosure-panel")); });
        }
      }
    }
    function prepareRange() {
      var hero = document.querySelector(".hero");
      var image = hero.querySelector(".hero-media"), badge = hero.querySelector(".hero-badge");
      if (badge) {
        badge.classList.add("mobile-range-chips");
        var actions = hero.querySelector(".button-row");
        relocate(badge, actions.parentNode, actions);
      }
      if (image) {
        var section = make("section", "section mobile-extra-media"); section.dataset.mobileOrder = "2";
        var shell = make("div", "shell"), preview = disclosure("View range image", "range-image");
        shell.appendChild(preview); section.appendChild(shell); main.appendChild(section); generated.push(section);
        relocate(image, preview.querySelector(".mobile-disclosure-panel"));
      }
    }
    function prepareProduct() {
      compactHeroActions();
      var primary = document.querySelector(".catalogue-gallery-item.primary");
      var title = document.querySelector(".product-hero h1");
      if (primary && title) {
        primary.classList.add("mobile-primary-image");
        relocate(primary, title.parentNode, title.nextSibling);
      }
      var gallery = document.querySelector(".product-hero .catalogue-gallery");
      if (gallery && gallery.children.length) {
        var photos = disclosure("More product photos", "product-photos");
        gallery.parentNode.insertBefore(photos, gallery); generated.push(photos);
        relocate(gallery, photos.querySelector(".mobile-disclosure-panel"));
      }
      var grid = document.querySelector(".catalogue-specs .spec-grid");
      if (grid) {
        var list = make("dl", "mobile-facts");
        Array.from(grid.children).forEach(function (item) {
          var label = item.querySelector("span,p"), value = item.querySelector("strong");
          if (!label || !value) return;
          var entry = make("div"), term = make("dt"), definition = make("dd");
          relocate(label, term); relocate(value, definition); entry.append(term, definition); list.appendChild(entry);
        });
        grid.parentNode.insertBefore(list, grid); generated.push(list);
        grid.hidden = true;
      }
    }
    function prepareService() {
      var paragraphs = Array.from(main.querySelectorAll("p"));
      var qualification = paragraphs.find(function (p) { return /structural/i.test(p.textContent) && /moisture/i.test(p.textContent); });
      if (qualification) {
        var visible = qualification.cloneNode(true);
        visible.classList.add("mobile-scope-caution");
        visible.dataset.mobileAdded = "";
        document.querySelector(".hero .button-row").after(visible); generated.push(visible);
      }
    }
    function updateLayout() {
      if (mobile === media.matches) return;
      var activeBefore = document.activeElement;
      var selection = activeBefore && typeof activeBefore.selectionStart === "number" ? [activeBefore.selectionStart, activeBefore.selectionEnd] : null;
      if (mobile) document.querySelectorAll("details.mobile-disclosure").forEach(function (d) { state.set(d.dataset.mobileKey, d.open); });
      mobile = media.matches;
      responsiveImages.forEach(function (entry) {
        if (!entry.image) return;
        if (mobile && entry.image.parentNode !== entry.picture) entry.picture.appendChild(entry.image);
        else if (!mobile && entry.image.parentNode === entry.picture) entry.picture.before(entry.image);
      });
      if (!mobile) {
        changes.reverse().forEach(function (change) { change.marker.replaceWith(change.node); }); changes = [];
        generated.forEach(function (node) { node.remove(); }); generated = [];
        document.querySelectorAll(".mobile-primary-image").forEach(function (n) { n.classList.remove("mobile-primary-image"); });
        document.querySelectorAll(".mobile-range-chips").forEach(function (n) { n.classList.remove("mobile-range-chips"); });
        document.querySelectorAll(".catalogue-specs .spec-grid").forEach(function (n) { n.hidden = false; });
        var optional = document.querySelector(".mobile-project-details"); if (optional) optional.hidden = true;
      } else {
        if (page === "contact") prepareContact();
        // Editorial catalogue controls filter/sort complete cards. Wrapping each
        // card separately would orphan its description and prevent grid sorting.
        if (page === "category" && !editorial) prepareRangeCards();
        if (page === "category" || page === "range") compactHeroActions();
        if (page === "range") {
          prepareRange();
          var caution = Array.from(main.querySelectorAll("p")).find(function (p) { return p.textContent.includes("vary from screen representations"); });
          var colours = document.querySelector("#colours .shell");
          var colourGrid = colours && colours.querySelector(".grid-3");
          if (caution && colourGrid) relocate(caution, colours, colourGrid);
        }
        if (page === "product" && !editorial) prepareProduct();
        if (page === "service") prepareService();
        // Match keyboard/reading order to the mobile visual order. CSS-only
        // reordering would make focus jump backwards through the catalogue.
        var sections = Array.from(main.children).filter(function (n) { return n.tagName === "SECTION"; });
        sections.sort(function (a, b) { return Number(a.dataset.mobileOrder || 10) - Number(b.dataset.mobileOrder || 10); });
        var fixedActions = main.querySelector(":scope > .mobile-sticky-cta, :scope > .mobile-context-dock");
        if (!editorial) sections.forEach(function (section) { relocate(section, main, fixedActions); });
      }
      document.querySelectorAll("details.mobile-disclosure").forEach(function (d, i) {
        if (!d.dataset.mobileKey) d.dataset.mobileKey = "panel-" + i;
        if (d.classList.contains("mobile-project-details") && !mobile) return;
        var focused = d.contains(activeBefore);
        d.open = !mobile || focused || Boolean(state.get(d.dataset.mobileKey));
      });
      if (mobile) document.querySelectorAll("details[data-mobile-faq]").forEach(function (d) { if (!d.contains(document.activeElement)) d.open = false; });
      revealHash(location.hash);
      if (activeBefore && activeBefore.isConnected && activeBefore.matches("input,select,textarea,button,a[href],summary") && document.activeElement !== activeBefore) {
        activeBefore.focus({ preventScroll: true });
        if (selection && activeBefore.setSelectionRange) activeBefore.setSelectionRange(selection[0], selection[1]);
      }
      document.dispatchEvent(new Event("oz:mobile-layout"));
    }
    document.addEventListener("click", function (event) {
      var link = event.target.closest("a[href]");
      if (!link) return;
      var target = new URL(link.href, location.href);
      if (target.origin === location.origin && target.pathname === location.pathname && target.hash) revealHash(target.hash);
    });
    document.addEventListener("focusin", function (event) {
      var summary = event.target.closest("summary");
      for (var n = event.target.parentElement; n; n = n.parentElement) if (n.tagName === "DETAILS" && (!summary || summary.parentElement !== n)) n.open = true;
    });
    window.addEventListener("hashchange", function () { revealHash(location.hash); });
    if (media.addEventListener) media.addEventListener("change", updateLayout); else media.addListener(updateLayout);
    updateLayout();

    var productDock = main.querySelector(".mobile-sticky-cta");
    if (productDock) {
      function protectProductDock() {
        var active = document.activeElement;
        var consent = document.querySelector(".analytics-consent-banner");
        var extra = media.matches && (Boolean(consent) || (active && active.matches("input,select,textarea,[contenteditable=true]")) || (window.visualViewport && window.visualViewport.height < document.documentElement.clientHeight - 120));
        productDock.classList.toggle("is-ux-obscured", Boolean(extra));
        var hidden = Boolean(extra) || productDock.classList.contains("is-suppressed");
        productDock.inert = hidden;
        productDock.setAttribute("aria-hidden", String(hidden));
        productDock.querySelectorAll("a").forEach(function (a) { if (hidden) a.setAttribute("tabindex", "-1"); else a.removeAttribute("tabindex"); });
      }
      ["scroll", "resize"].forEach(function (event) { window.addEventListener(event, protectProductDock, { passive: true }); });
      ["focusin", "focusout", "oz:mobile-menu-state"].forEach(function (event) { document.addEventListener(event, function () { requestAnimationFrame(protectProductDock); }); });
      if (window.visualViewport) window.visualViewport.addEventListener("resize", protectProductDock, { passive: true });
      new MutationObserver(protectProductDock).observe(document.body, { childList: true });
      protectProductDock();
    }

    // Extend actions only on the audited non-product pages; never duplicate the product bar.
    if (["home", "category", "range", "service"].indexOf(page) !== -1 && !main.querySelector(".mobile-sticky-cta")) {
      var phone = document.querySelector('.site-footer a[href^="tel:"]');
      var quote = document.querySelector('.hero .button-row a[href*="/contact/"][href*="enquiry="]');
      if (phone && quote) {
        var dock = make("nav", "mobile-context-dock"); dock.setAttribute("aria-label", "Quick enquiry actions");
        var call = make("a", "button-secondary", "Call"), enquiry = make("a", "button", page === "range" ? "Enquire" : "Get quote");
        call.href = phone.href; enquiry.href = quote.href; dock.append(call, enquiry); main.appendChild(dock);
        document.dispatchEvent(new CustomEvent("oz:mobile-links-ready", { detail: { links: [call, enquiry] } }));
        document.body.classList.add("has-mobile-context-dock");
        function visible(n) { if (!n) return false; var r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }
        function updateDock() {
          var typing = document.activeElement && document.activeElement.matches("input,select,textarea,[contenteditable=true]");
          var keyboard = window.visualViewport && window.visualViewport.height < document.documentElement.clientHeight - 120;
          var suppressed = !media.matches || typing || keyboard || document.body.classList.contains("mobile-nav-open") || visible(document.querySelector(".analytics-consent-banner")) || visible(document.querySelector(".hero .button-row")) || visible(document.querySelector("[data-contact-form]")) || visible(document.querySelector(".site-footer"));
          dock.hidden = Boolean(suppressed);
        }
        ["scroll", "resize"].forEach(function (event) { window.addEventListener(event, updateDock, { passive: true }); });
        ["focusin", "focusout", "oz:mobile-menu-state", "oz:mobile-layout"].forEach(function (event) { document.addEventListener(event, function () { requestAnimationFrame(updateDock); }); });
        if (window.visualViewport) window.visualViewport.addEventListener("resize", updateDock, { passive: true });
        new MutationObserver(updateDock).observe(document.body, { childList: true });
        updateDock();
      }
    }
    window.OZ_MOBILE_UX_READY = true;
  }
  // Deferred scripts run while readyState is "interactive". Wait for the
  // established site initializer to populate approved contact data first.
  if (document.readyState !== "complete") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
