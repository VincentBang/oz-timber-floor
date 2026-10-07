document.addEventListener("DOMContentLoaded", function () {
  if (window.OZ_TIMBER_FLOOR_SITE_READY) return;
  window.OZ_TIMBER_FLOOR_SITE_READY = true;

  var contact = window.OZ_TIMBER_FLOOR_CONTACT || {};
  var analytics = contact.analytics || {};
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var params = new URLSearchParams(window.location.search);
  var attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  var pendingQuoteKey = "oz-pending-quote-submit";
  var pendingQuoteMaxAge = 10 * 60 * 1000;

  function attributionValue(key) {
    var fromUrl = params.get(key);
    if (fromUrl) {
      try { window.sessionStorage.setItem("oz-attribution-" + key, fromUrl); } catch (error) {}
      return fromUrl;
    }
    try { return window.sessionStorage.getItem("oz-attribution-" + key) || ""; } catch (error) { return ""; }
  }

  attributionKeys.forEach(function (key) { attributionValue(key); });

  function initAnalytics() {
    if (!isAnalyticsProductionHost()) return;
    var measurementId = String(analytics.ga4MeasurementId || "").trim().toUpperCase();
    if (!/^G-[A-Z0-9]+$/.test(measurementId)) return;
    if (window.OZ_TIMBER_FLOOR_GA4_READY) return;
    window.OZ_TIMBER_FLOOR_GA4_READY = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    // Query strings and fragments can contain enquiry details. Never send them.
    var cleanReferrer = "";
    try { cleanReferrer = new URL(document.referrer).origin; } catch (error) {}
    window.gtag("config", measurementId, {
      page_location: window.location.origin + window.location.pathname,
      page_referrer: cleanReferrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    if (!document.querySelector('script[data-oz-ga4="true"]')) {
      var tag = document.createElement("script");
      tag.async = true;
      tag.setAttribute("data-oz-ga4", "true");
      tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
      document.head.appendChild(tag);
    }
  }

  function isAnalyticsProductionHost() {
    return window.location.origin === "https://oztimberfloor.com.au" || window.location.origin === "https://www.oztimberfloor.com.au";
  }

  function trackEvent(name, payload) {
    if (isAnalyticsProductionHost() && /^G-[A-Z0-9]+$/.test(String(analytics.ga4MeasurementId || "").trim().toUpperCase()) && typeof window.gtag === "function") {
      window.gtag("event", name, payload || {});
    }
  }

  function normalizeEnquiry(value) {
    var map = {
      "builder-commercial": "commercial",
      "office-commercial": "commercial",
      "commercial": "commercial",
      "floor-levelling": "service",
      "floor-removal": "service",
      "sanding-polishing": "service",
      "service": "service",
      "supply-install": "supply-install",
      "supply-only": "supply-only",
      "stock": "stock",
      "product": "product"
    };
    return map[value] || value || "stock";
  }

  function normalizeCategory(value, productName, rangeName, brandName, slug) {
    var text = [value, productName, rangeName, brandName, slug].join(" ").toLowerCase();
    if (text.indexOf("kronoswiss aquastop") !== -1) return "Laminate";
    if (/engineered/.test(text)) return "Engineered timber";
    if (/solid|hardwood/.test(text)) return "Solid timber";
    if (/laminate/.test(text)) return "Laminate";
    if (/vinyl/.test(text)) return "Vinyl";
    if (/hybrid/.test(text)) return "Hybrid";
    return value || "";
  }

  function humanEnquiry(value) {
    var labels = {
      "stock": "Check stock availability",
      "supply-only": "Request supply price",
      "supply-install": "Request supply + install quote",
      "product": "Ask about this product",
      "commercial": "Builder or commercial enquiry",
      "service": "Service or floor preparation enquiry"
    };
    return labels[value] || "Flooring enquiry";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setHidden(id, value) {
    var field = document.getElementById(id);
    if (field) field.value = value || "";
  }

  function analyticsPayload(extra) {
    var allowedEnquiries = ["stock", "supply-only", "supply-install", "product", "commercial", "service"];
    var currentEnquiry = (select && select.value) || enquiry || "";
    if (allowedEnquiries.indexOf(currentEnquiry) === -1) currentEnquiry = "";
    var allowedCategories = ["Hybrid", "Laminate", "Engineered timber", "Solid timber", "Vinyl"];
    var safeCategory = allowedCategories.indexOf(category) !== -1 ? category : "";
    var payload = {
      page_path: window.location.pathname,
      source_page: window.location.pathname,
      enquiry_type: currentEnquiry,
      category: safeCategory,
      has_product_context: Boolean(product || productSlug),
      has_range_context: Boolean(range),
      utm_source_present: Boolean(attributionValue("utm_source")),
      utm_medium_present: Boolean(attributionValue("utm_medium")),
      utm_campaign_present: Boolean(attributionValue("utm_campaign")),
      gclid_present: Boolean(attributionValue("gclid")),
      fbclid_present: Boolean(attributionValue("fbclid"))
    };
    return Object.assign(payload, extra || {});
  }

  function quoteContext(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
    var context = {
      enquiry_type: ["stock", "supply-only", "supply-install", "product", "commercial", "service"].indexOf(payload.enquiry_type) !== -1 ? payload.enquiry_type : "",
      category: ["Hybrid", "Laminate", "Engineered timber", "Solid timber", "Vinyl"].indexOf(payload.category) !== -1 ? payload.category : ""
    };
    ["has_product_context", "has_range_context", "utm_source_present", "utm_medium_present", "utm_campaign_present", "gclid_present", "fbclid_present"].forEach(function (key) {
      context[key] = payload[key] === true;
    });
    return context;
  }

  initAnalytics();

  if (/^\/thank-you\/?$/.test(window.location.pathname)) {
    var pendingQuote = null;
    try {
      var pendingQuoteJson = window.sessionStorage.getItem(pendingQuoteKey);
      window.sessionStorage.removeItem(pendingQuoteKey);
      pendingQuote = JSON.parse(pendingQuoteJson || "null");
    } catch (error) {}
    var quoteAge = pendingQuote && Date.now() - pendingQuote.timestamp;
    var confirmedContext = pendingQuote && quoteContext(pendingQuote.context);
    if (pendingQuote && pendingQuote.accepted === true && Number.isFinite(pendingQuote.timestamp) && quoteAge >= 0 && quoteAge <= pendingQuoteMaxAge && confirmedContext) {
      trackEvent("quote_submit", Object.assign(confirmedContext, {
        page_path: window.location.pathname,
        source_page: "/contact/",
        event_category: "lead",
        lead_event_state: "confirmed_thank_you",
        form_name: contact.formName || "oz-flooring-enquiry"
      }));
    }
  }

  var mobileNavQuery = window.matchMedia ? window.matchMedia("(max-width: 980px)") : null;
  var navScrollState = null;

  function resetNavSubmenus() {
    document.querySelectorAll(".nav-item.is-expanded").forEach(function (item) {
      item.classList.remove("is-expanded");
    });
    document.querySelectorAll(".nav-dropdown-toggle").forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });
  }

  function lockPageScroll() {
    if (navScrollState) return;
    var root = document.documentElement;
    var body = document.body;
    navScrollState = {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0,
      rootStyle: root.getAttribute("style"),
      bodyStyle: body.getAttribute("style")
    };
    root.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = "-" + navScrollState.y + "px";
    body.style.left = "-" + navScrollState.x + "px";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.classList.add("mobile-nav-scroll-locked");
  }

  function unlockPageScroll() {
    if (!navScrollState) return;
    var root = document.documentElement;
    var body = document.body;
    var restore = navScrollState;
    navScrollState = null;
    body.classList.remove("mobile-nav-scroll-locked");
    if (restore.rootStyle === null) root.removeAttribute("style");
    else root.setAttribute("style", restore.rootStyle);
    if (restore.bodyStyle === null) body.removeAttribute("style");
    else body.setAttribute("style", restore.bodyStyle);
    root.style.scrollBehavior = "auto";
    root.style.overflowAnchor = "none";
    window.scrollTo(restore.x, restore.y);
    window.requestAnimationFrame(function () {
      window.scrollTo(restore.x, restore.y);
      window.requestAnimationFrame(function () {
        window.scrollTo(restore.x, restore.y);
        if (restore.rootStyle === null) root.removeAttribute("style");
        else root.setAttribute("style", restore.rootStyle);
      });
    });
  }

  function mobileMenuFocusables() {
    if (!header) return [];
    return Array.from(header.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (element) {
        return !element.hidden && element.getClientRects().length > 0;
      });
  }

  function setMobileMenuOpen(shouldOpen, options) {
    if (!header || !toggle) return;
    var open = Boolean(shouldOpen) && (!mobileNavQuery || mobileNavQuery.matches);
    var wasOpen = header.classList.contains("is-open");
    if (open && !wasOpen) lockPageScroll();
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("mobile-nav-open", open);

    if (open) {
      if (!wasOpen) {
        window.requestAnimationFrame(function () {
          var firstLink = header.querySelector(".nav-links a[href]");
          if (firstLink) firstLink.focus({ preventScroll: true });
        });
      }
    } else {
      resetNavSubmenus();
      if (wasOpen && options && options.returnFocus) {
        toggle.focus({ preventScroll: true });
      }
      unlockPageScroll();
    }

    document.dispatchEvent(new CustomEvent("oz:mobile-menu-state", { detail: { open: open } }));
  }

  if (header && toggle) {
    toggle.addEventListener("click", function () {
      setMobileMenuOpen(!header.classList.contains("is-open"), { returnFocus: true });
    });

    document.addEventListener("click", function (event) {
      if (header.classList.contains("is-open") && !header.contains(event.target)) {
        setMobileMenuOpen(false, { returnFocus: true });
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!header.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false, { returnFocus: true });
        return;
      }
      if (event.key !== "Tab") return;
      var focusables = mobileMenuFocusables();
      if (!focusables.length) {
        event.preventDefault();
        toggle.focus({ preventScroll: true });
        return;
      }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    });

    if (mobileNavQuery) {
      var handleNavBreakpoint = function () {
        if (!mobileNavQuery.matches && header.classList.contains("is-open")) {
          setMobileMenuOpen(false, { returnFocus: false });
        }
      };
      if (typeof mobileNavQuery.addEventListener === "function") {
        mobileNavQuery.addEventListener("change", handleNavBreakpoint);
      } else if (typeof mobileNavQuery.addListener === "function") {
        mobileNavQuery.addListener(handleNavBreakpoint);
      }
    }
  }

  function initMobileHeaderCall() {
    if (!header || !contact.phoneHref || !contact.phoneDisplay) return;
    var actions = header.querySelector(".header-actions");
    if (!actions || actions.querySelector("[data-mobile-call]")) return;
    var call = document.createElement("a");
    call.className = "button-secondary mobile-nav-call";
    call.href = "tel:" + contact.phoneHref;
    call.textContent = "Call " + contact.phoneDisplay;
    call.setAttribute("data-mobile-call", "true");
    actions.appendChild(call);
  }

  initMobileHeaderCall();

  document.querySelectorAll(".nav-dropdown-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".nav-item");
      if (!item) return;
      var isOpen = !item.classList.contains("is-expanded");
      document.querySelectorAll(".nav-item.is-expanded").forEach(function (expandedItem) {
        if (expandedItem === item) return;
        expandedItem.classList.remove("is-expanded");
        var expandedControl = expandedItem.querySelector(".nav-dropdown-toggle");
        if (expandedControl) expandedControl.setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-expanded", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  document.querySelectorAll(".brand, .nav-dropdown a, .nav-links > a, .nav-parent, .header-actions a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (!header || !toggle) return;
      setMobileMenuOpen(false, { returnFocus: false });
    });
  });

  function initMobileActionDock() {
    var dock = document.querySelector("main > .mobile-sticky-cta");
    var productHero = document.querySelector(".product-hero");
    if (!dock || !productHero) return;
    var robots = document.querySelector('meta[name="robots"]');
    if (robots && /(?:^|,)\s*noindex\b/i.test(robots.getAttribute("content") || "")) {
      dock.hidden = true;
      return;
    }

    var mobileDockQuery = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
    var dockLinks = Array.from(dock.querySelectorAll("a[href]"));
    var originalTabIndexes = dockLinks.map(function (link) { return link.getAttribute("tabindex"); });
    var watchedElements = [
      productHero.querySelector(".button-row"),
      document.querySelector("main > .section:last-of-type .button-row"),
      document.querySelector(".site-footer")
    ].filter(Boolean);
    var visibility = new Map();

    function isInViewport(element) {
      var rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    }

    function setDockSuppressed(suppressed) {
      dock.classList.toggle("is-suppressed", suppressed);
      dock.setAttribute("aria-hidden", String(suppressed));
      if ("inert" in dock) dock.inert = suppressed;
      dockLinks.forEach(function (link, index) {
        if (suppressed) link.setAttribute("tabindex", "-1");
        else if (originalTabIndexes[index] === null) link.removeAttribute("tabindex");
        else link.setAttribute("tabindex", originalTabIndexes[index]);
      });
    }

    function updateDock() {
      watchedElements.forEach(function (element) {
        visibility.set(element, isInViewport(element));
      });
      var isMobile = !mobileDockQuery || mobileDockQuery.matches;
      var competingActionVisible = watchedElements.some(function (element) { return visibility.get(element); });
      setDockSuppressed(!isMobile || document.body.classList.contains("mobile-nav-open") || competingActionVisible);
    }

    document.body.classList.add("has-mobile-action-dock");
    updateDock();
    dock.setAttribute("data-dock-ready", "true");

    if ("IntersectionObserver" in window) {
      var dockObserver = new IntersectionObserver(updateDock, { threshold: [0, 0.05] });
      watchedElements.forEach(function (element) { dockObserver.observe(element); });
    } else {
      window.addEventListener("scroll", updateDock, { passive: true });
    }
    window.addEventListener("resize", updateDock, { passive: true });
    document.addEventListener("oz:mobile-menu-state", updateDock);
    if (mobileDockQuery) {
      if (typeof mobileDockQuery.addEventListener === "function") mobileDockQuery.addEventListener("change", updateDock);
      else if (typeof mobileDockQuery.addListener === "function") mobileDockQuery.addListener(updateDock);
    }
  }

  initMobileActionDock();

  document.querySelectorAll(".faq-item button").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".faq-item");
      if (item) item.toggleAttribute("open");
    });
  });

  function initRangeFilters() {
    if (window.OZ_RANGE_FILTERS_READY) return;
    var form = document.querySelector("[data-range-filter-form]");
    var input = document.querySelector("#rangeSearch");
    var clear = document.querySelector("[data-range-clear]");
    var status = document.querySelector("[data-range-filter-status]");
    var empty = document.querySelector("[data-range-empty]");
    var cards = Array.from(document.querySelectorAll("[data-range-card]"));
    var categoryButtons = Array.from(document.querySelectorAll("[data-range-category]"));
    if (!input || !cards.length) return;

    var activeCategory = "all";
    var total = cards.length;
    window.OZ_RANGE_FILTERS_READY = true;

    function matchesText(card, value) {
      if (!value) return true;
      var text = [
        card.getAttribute("data-search") || "",
        card.textContent || ""
      ].join(" ").toLowerCase();
      return text.indexOf(value) !== -1;
    }

    function matchesCategory(card) {
      if (activeCategory === "all") return true;
      return (card.getAttribute("data-category") || "") === activeCategory;
    }

    function updateSections() {
      document.querySelectorAll("#hybrid, #laminate, #engineered-timber, #solid-timber, #vinyl").forEach(function (section) {
        var visibleCards = section.querySelectorAll("[data-range-card]:not([hidden])");
        section.hidden = visibleCards.length === 0;
      });
    }

    function categoryLabel() {
      if (activeCategory === "all") return "all categories";
      return activeCategory.toLowerCase();
    }

    function applyFilters() {
      var value = input.value.trim().toLowerCase();
      var count = 0;
      cards.forEach(function (card) {
        var visible = matchesText(card, value) && matchesCategory(card);
        card.hidden = !visible;
        if (visible) count += 1;
      });

      categoryButtons.forEach(function (button) {
        var selected = button.getAttribute("data-range-category") === activeCategory;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });

      if (clear) clear.hidden = !(value || activeCategory !== "all");
      if (empty) empty.hidden = count !== 0;
      if (status) {
        status.textContent = value || activeCategory !== "all"
          ? "Showing " + count + " of " + total + " ranges in " + categoryLabel() + "."
          : "Showing all " + total + " ranges.";
      }
      updateSections();
    }

    function visibleCards() {
      return cards.filter(function (card) {
        return !card.hidden;
      });
    }

    function scrollToResults() {
      var first = visibleCards()[0];
      var target = first ? first.closest("section") : empty;
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        applyFilters();
        scrollToResults();
      });
    }

    input.addEventListener("input", applyFilters);

    if (clear) {
      clear.addEventListener("click", function () {
        input.value = "";
        activeCategory = "all";
        applyFilters();
        input.focus();
      });
    }

    categoryButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        activeCategory = button.getAttribute("data-range-category") || "all";
        applyFilters();
        scrollToResults();
      });
    });

    applyFilters();
  }

  initRangeFilters();

  var enquiry = normalizeEnquiry(params.get("enquiry"));
  var product = params.get("product") || "";
  var range = params.get("range") || "";
  var brand = params.get("brand") || "";
  var productSlug = params.get("productSlug") || params.get("product_slug") || "";
  var category = normalizeCategory(params.get("category") || "", product, range, brand, productSlug);

  var select = document.querySelector("#enquiryType");
  var productField = document.querySelector("#product");
  var categoryInterestField = document.querySelector("#categoryInterest");
  var serviceTypeField = document.querySelector("#serviceType");
  var message = document.querySelector("#message");
  var selectedEnquiry = document.querySelector("[data-selected-enquiry]");
  var formStart = document.querySelector("#contact-form-start");

  function fillTrackingFields() {
    setHidden("sourcePage", params.get("source") || window.location.pathname);
    setHidden("productSlug", productSlug);
    setHidden("brandField", brand);
    setHidden("rangeField", range);
    setHidden("category", category);
    setHidden("currentPageUrl", window.location.href);
    setHidden("referrerField", document.referrer || "");
    [
      ["utmSource", "utm_source"],
      ["utmMedium", "utm_medium"],
      ["utmCampaign", "utm_campaign"],
      ["utmTerm", "utm_term"],
      ["utmContent", "utm_content"],
      ["gclidField", "gclid"],
      ["fbclidField", "fbclid"]
    ].forEach(function (pair) {
      setHidden(pair[0], attributionValue(pair[1]));
    });
  }

  function updateSelectedCard() {
    if (!selectedEnquiry) return;
    if (!(product || range || category)) {
      selectedEnquiry.hidden = true;
      selectedEnquiry.innerHTML = "";
      return;
    }

    selectedEnquiry.hidden = false;
    selectedEnquiry.innerHTML = [
      "<div>",
      '<p class="selected-kicker">Selected enquiry</p>',
      product ? "<p><strong>Product:</strong> " + escapeHtml(product) + "</p>" : "",
      range ? "<p><strong>Range:</strong> " + escapeHtml(range) + "</p>" : "",
      category ? "<p><strong>Category:</strong> " + escapeHtml(category) + "</p>" : "",
      "<p><strong>Enquiry type:</strong> " + escapeHtml(humanEnquiry(select ? select.value : enquiry)) + "</p>",
      "</div>",
      '<div class="selected-actions"><button type="button" class="button-inline" data-change-enquiry>Change enquiry type</button><button type="button" class="button-inline ghost-inline" data-clear-product>Change product details</button></div>'
    ].join("");

    var change = selectedEnquiry.querySelector("[data-change-enquiry]");
    var clear = selectedEnquiry.querySelector("[data-clear-product]");

    if (change && select) {
      change.addEventListener("click", function () {
        select.focus();
      });
    }

    if (clear) {
      clear.addEventListener("click", function () {
        product = "";
        range = "";
        brand = "";
        category = "";
        productSlug = "";
        if (productField) productField.value = "";
        if (categoryInterestField) categoryInterestField.value = "";
        fillTrackingFields();
        updateSelectedCard();
        if (productField) productField.focus();
      });
    }
  }

  function fieldFor(key) {
    return document.querySelector('[data-field="' + key + '"]');
  }

  function labelFor(key) {
    var field = fieldFor(key);
    return field ? field.querySelector("label") : null;
  }

  function inputFor(key) {
    var field = fieldFor(key);
    return field ? field.querySelector("input, select, textarea") : null;
  }

  function toggleField(key, visible) {
    var field = fieldFor(key);
    if (!field) return;
    field.hidden = !visible;
  }

  function setVisibleFields() {
    var value = select ? select.value : enquiry;
    var visible = {
      product: value === "stock" || value === "supply-only" || value === "supply-install" || value === "product",
      suburb: true,
      category_interest: value === "product",
      area: value === "supply-only" || value === "supply-install" || value === "commercial" || value === "service",
      timing: value === "stock" || value === "supply-only" || value === "supply-install" || value === "commercial" || value === "service",
      property_type: value === "supply-install",
      service_type: value === "service",
      current_flooring: value === "supply-install" || value === "commercial" || value === "service",
      company_project: value === "commercial",
      access_constraints: value === "supply-install" || value === "commercial" || value === "service",
      message: true
    };

    Object.keys(visible).forEach(function (key) {
      toggleField(key, visible[key]);
    });

    var suburbLabel = labelFor("suburb");
    var suburbInput = inputFor("suburb");
    if (suburbLabel) {
      suburbLabel.textContent = value === "supply-only" ? "Delivery suburb" : value === "commercial" || value === "service" ? "Site suburb or location" : "Project suburb";
    }
    if (suburbInput) {
      suburbInput.placeholder = value === "commercial" ? "e.g. Sydney CBD, Alexandria, Parramatta" : "e.g. Cabramatta, Liverpool, Castle Hill";
    }

    var areaLabel = labelFor("area");
    if (areaLabel) {
      areaLabel.textContent = value === "commercial" ? "Approximate project area" : "Approximate area or quantity";
    }

    var timingLabel = labelFor("timing");
    if (timingLabel) {
      timingLabel.textContent = value === "commercial" ? "Timing or staging" : "Preferred timing";
    }

    var messageLabel = labelFor("message");
    var messageInput = inputFor("message");
    if (messageLabel) {
      messageLabel.textContent = value === "stock" ? "What should we confirm?" : "What should we know?";
    }
    if (messageInput) {
      if (value === "stock") {
        messageInput.placeholder = "Tell us the product, range or colour, plus any quantity, suburb or timing details that will help with the stock check.";
      } else if (value === "commercial") {
        messageInput.placeholder = "Tell us about the site, current floor, product direction, timing, staging, access, parking or after-hours requirements.";
      } else if (value === "service") {
        messageInput.placeholder = "Tell us about the current floor, site condition, service you need, timing, access or any floor preparation concerns.";
      } else {
        messageInput.placeholder = "Tell us about the current floor, product you are considering, supply-only or installed work, timing, stairs, access or site conditions.";
      }
    }

    if (categoryInterestField && category && !categoryInterestField.value) {
      categoryInterestField.value = category;
    }

    updateSelectedCard();
  }

  function applyEnquirySelection(nextValue, sourceValue, target) {
    if (!select) return;
    select.value = normalizeEnquiry(nextValue);
    enquiry = select.value;
    // Keep the originating product/service when the customer changes enquiry type.
    if (sourceValue && !params.get("source")) params.set("source", sourceValue);
    params.set("enquiry", enquiry);
    if (window.history && typeof window.history.replaceState === "function") {
      var nextUrl = window.location.pathname + "?" + params.toString() + (target || "");
      window.history.replaceState({}, "", nextUrl);
    }
    fillTrackingFields();
    setVisibleFields();
    if (target) {
      var destination = document.querySelector(target);
      if (destination) destination.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (select) {
    select.value = enquiry;
    if (!select.value) select.value = "stock";
    select.addEventListener("change", function () {
      enquiry = select.value;
      params.set("enquiry", enquiry);
      if (window.history && typeof window.history.replaceState === "function") {
        window.history.replaceState({}, "", window.location.pathname + "?" + params.toString());
      }
      fillTrackingFields();
      setVisibleFields();
      trackEnquiryIntent(enquiry);
    });
  }

  if (productField) {
    productField.value = product || range || "";
  }

  if (categoryInterestField && category) {
    categoryInterestField.value = category;
  }

  if (serviceTypeField && params.get("topic")) {
    var serviceTopic = params.get("topic");
    // Service CTAs use human-readable topics; select values are stable slugs.
    var serviceSource = params.get("source") || "";
    if (/levell|uneven floor/i.test(serviceTopic) || /floor-levelling/.test(serviceSource)) serviceTopic = "floor-levelling";
    serviceTypeField.value = serviceTopic;
  }

  fillTrackingFields();
  setVisibleFields();

  if (message && product && !message.value) {
    message.value = "I am enquiring about " + product + ". Please confirm " + (select && select.value === "stock" ? "stock availability and lead time." : "the best supply or installation options.");
  }

  document.querySelectorAll("[data-set-enquiry]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var nextValue = link.getAttribute("data-set-enquiry");
      var target = link.getAttribute("data-scroll-target") || "#contact-form-start";
      applyEnquirySelection(nextValue, "contact", target);
      trackEnquiryIntent(normalizeEnquiry(nextValue));
      if (formStart) {
        var focusTarget = select || productField || formStart;
        if (focusTarget && typeof focusTarget.focus === "function") {
          focusTarget.focus({ preventScroll: true });
        }
      }
    });
  });

  function contactBlock() {
    var lines = [];
    if (contact.showroom) lines.push("Showroom: " + contact.showroom);
    if (contact.phoneDisplay) lines.push("Phone: " + contact.phoneDisplay);
    if (contact.secondaryPhoneDisplay) lines.push("Second phone: " + contact.secondaryPhoneDisplay);
    if (contact.email) lines.push("Email: " + contact.email);
    return lines.join("\n");
  }

  document.querySelectorAll("[data-contact-block]").forEach(function (target) {
    if (target.querySelector("a") || target.children.length || target.textContent.trim()) return;
    target.textContent = contactBlock();
  });

  document.querySelectorAll("[data-contact-actions]").forEach(function (target) {
    var actions = [];
    if (contact.phoneHref && contact.phoneDisplay) {
      actions.push('<a class="button" href="tel:' + contact.phoneHref + '">Call ' + contact.phoneDisplay + "</a>");
    }
    if (contact.secondaryPhoneHref && contact.secondaryPhoneDisplay) {
      actions.push('<a class="button-secondary" href="tel:' + contact.secondaryPhoneHref + '">Call ' + contact.secondaryPhoneDisplay + "</a>");
    }
    if (contact.email) {
      actions.push('<a class="button-secondary" href="mailto:' + contact.email + '?subject=Oz%20Timber%20Floor%20enquiry">Email ' + contact.email + "</a>");
    }
    target.innerHTML = actions.join("");
  });

  function buildFooterContact() {
    var footerContact = document.createElement("address");
    footerContact.className = "footer-contact";
    footerContact.setAttribute("data-footer-contact", "true");

    function appendFooterContactLink(href, label) {
      if (!href || !label) return;
      var link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      footerContact.appendChild(link);
    }

    appendFooterContactLink(contact.phoneHref ? "tel:" + contact.phoneHref : "", contact.phoneDisplay);
    appendFooterContactLink(contact.secondaryPhoneHref ? "tel:" + contact.secondaryPhoneHref : "", contact.secondaryPhoneDisplay);
    appendFooterContactLink(contact.email ? "mailto:" + contact.email : "", contact.email);
    if (contact.showroom) {
      var showroom = document.createElement("span");
      showroom.textContent = contact.showroom;
      footerContact.appendChild(showroom);
    }
    return footerContact;
  }

  document.querySelectorAll(".site-footer").forEach(function (footer) {
    var sections = footer.querySelectorAll(".footer-grid > div");
    if (sections.length < 4) return;
    if (!sections[0].querySelector("[data-footer-contact]")) {
      var footerContact = buildFooterContact();
      var legacyContact = sections[0].querySelector("[data-contact-block]");
      if (legacyContact) legacyContact.replaceWith(footerContact);
      else sections[0].appendChild(footerContact);
    }
    var enquiryLinks = sections[3].querySelector(".footer-links");
    if (!enquiryLinks) return;
    var wanted = [
      { href: "/projects/", label: "Projects" },
      { href: "/guides/", label: "Guides" },
      { href: "/privacy/", label: "Privacy Policy" },
      { href: "/terms/", label: "Terms" }
    ];
    var existing = new Set(Array.from(enquiryLinks.querySelectorAll("a")).map(function (link) {
      return link.getAttribute("href");
    }));
    wanted.forEach(function (item) {
      if (existing.has(item.href)) return;
      var link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.label;
      enquiryLinks.appendChild(link);
    });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener("click", function () {
      trackEvent("phone_click", analyticsPayload({ event_category: "lead" }));
    });
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener("click", function () {
      trackEvent("email_click", analyticsPayload({ event_category: "lead" }));
    });
  });

  function trackEnquiryIntent(value) {
    var payload = analyticsPayload({ event_category: "lead", enquiry_type: value });
    if (value === "stock") trackEvent("stock_check", payload);
    if (value === "supply-only") trackEvent("supply_only_enquiry", payload);
    if (value === "supply-install") trackEvent("supply_install_enquiry", payload);
  }

  document.querySelectorAll('a[href*="/contact/"]').forEach(function (link) {
    link.addEventListener("click", function () {
      var href = link.getAttribute("href") || "";
      var intent = "";
      try {
        var destination = new URL(href, window.location.origin);
        if (destination.origin === window.location.origin && destination.searchParams.get("enquiry")) {
          intent = normalizeEnquiry(destination.searchParams.get("enquiry"));
        }
      } catch (error) {}
      if (intent) trackEnquiryIntent(intent);
    });
  });

  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    form.addEventListener("focusin", function () {
      if (form.getAttribute("data-analytics-started") === "true") return;
      form.setAttribute("data-analytics-started", "true");
      trackEvent("quote_start", analyticsPayload({ event_category: "lead" }));
    });
    var submitting = false;
    form.addEventListener("submit", function (event) {
      if (submitting) { event.preventDefault(); return; }
      try { window.sessionStorage.removeItem(pendingQuoteKey); } catch (error) {}
      // Keep the existing native POST as a fallback. A submit attempt alone is
      // never evidence that Netlify accepted an enquiry.
      if (!window.fetch || !window.FormData) return;
      event.preventDefault();
      var action = new URL(form.getAttribute("action"), window.location.href);
      if (action.origin !== window.location.origin) return;
      fillTrackingFields();
      var body = new URLSearchParams(new window.FormData(form));
      var submitButton = form.querySelector('button[type="submit"]');
      var originalText = submitButton && submitButton.textContent;
      var priorError = form.querySelector("[data-submit-error]");
      if (priorError) priorError.remove();
      submitting = true;
      form.setAttribute("aria-busy", "true");
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Sending enquiry…"; }
      window.fetch(action.href, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      }).then(function (response) {
        if (!response.ok || new URL(response.url).origin !== action.origin) throw new Error("Enquiry acceptance not confirmed");
        try {
          window.sessionStorage.setItem(pendingQuoteKey, JSON.stringify({
            accepted: true,
            timestamp: Date.now(),
            context: quoteContext(analyticsPayload())
          }));
        } catch (error) {}
        window.location.assign(action.href);
      }).catch(function () {
        try { window.sessionStorage.removeItem(pendingQuoteKey); } catch (error) {}
        submitting = false;
        form.removeAttribute("aria-busy");
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; }
        var message = document.createElement("p");
        message.className = "form-span";
        message.setAttribute("data-submit-error", "true");
        message.setAttribute("role", "alert");
        message.tabIndex = -1;
        message.textContent = "We could not confirm your enquiry was received. Please contact us using the phone or email details on this page before resending.";
        form.appendChild(message);
        message.focus();
      });
    });
  });

  if (contact.formName) {
    document.querySelectorAll('input[name="form-name"]').forEach(function (input) {
      input.value = contact.formName;
    });
  }

  if (contact.businessName) {
    var schemaId = "https://oztimberfloor.com.au/#business";
    var schema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": schemaId,
      "name": contact.businessName,
      "url": "https://oztimberfloor.com.au/",
      "telephone": [contact.phoneHref, contact.secondaryPhoneHref].filter(Boolean),
      "email": contact.email || undefined,
      "logo": contact.logoUrl ? {
        "@type": "ImageObject",
        "url": contact.logoUrl
      } : undefined,
      "address": contact.address ? Object.assign({
        "@type": "PostalAddress",
      }, contact.address) : undefined,
      "areaServed": contact.areaServed ? {
        "@type": "City",
        "name": contact.areaServed
      } : undefined
    };
    var schemaUpdated = false;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (schemaTag) {
      if (schemaUpdated) return;
      try {
        var data = JSON.parse(schemaTag.textContent || "{}");
        var entities = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
        var business = entities.find(function (entity) {
          return entity && entity["@id"] === schemaId;
        });
        if (!business) return;
        Object.assign(business, schema);
        delete business["@context"];
        schemaTag.textContent = JSON.stringify(data);
        schemaUpdated = true;
      } catch (error) {}
    });
    if (!schemaUpdated) {
      var schemaTag = document.createElement("script");
      schemaTag.type = "application/ld+json";
      schemaTag.textContent = JSON.stringify(schema);
      document.head.appendChild(schemaTag);
    }
  }
});
