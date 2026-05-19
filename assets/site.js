document.addEventListener("DOMContentLoaded", function () {
  var contact = window.OZ_TIMBER_FLOOR_CONTACT || {};
  var analytics = contact.analytics || {};
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var params = new URLSearchParams(window.location.search);

  function initAnalytics() {
    if (!analytics.ga4MeasurementId) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", analytics.ga4MeasurementId);
    var tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(analytics.ga4MeasurementId);
    document.head.appendChild(tag);
  }

  function trackEvent(name, payload) {
    if (typeof window.gtag === "function") {
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

  initAnalytics();

  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll(".nav-dropdown-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".nav-item");
      if (!item) return;
      var isOpen = item.classList.toggle("is-expanded");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  document.querySelectorAll(".nav-dropdown a, .nav-links > a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (!header || !toggle) return;
      header.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.querySelectorAll(".nav-item.is-expanded").forEach(function (item) {
        item.classList.remove("is-expanded");
        var control = item.querySelector(".nav-dropdown-toggle");
        if (control) control.setAttribute("aria-expanded", "false");
      });
    });
  });

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
      setHidden(pair[0], params.get(pair[1]) || "");
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
    if (sourceValue) params.set("source", sourceValue);
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
      setVisibleFields();
    });
  }

  if (productField) {
    productField.value = product || range || "";
  }

  if (categoryInterestField && category) {
    categoryInterestField.value = category;
  }

  if (serviceTypeField && params.get("topic")) {
    serviceTypeField.value = params.get("topic");
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

  document.querySelectorAll(".site-footer").forEach(function (footer) {
    var sections = footer.querySelectorAll(".footer-grid > div");
    if (sections.length < 4) return;
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
      trackEvent("phone_call_click", {
        event_category: "lead",
        link_url: link.getAttribute("href"),
        page_path: window.location.pathname
      });
    });
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener("click", function () {
      trackEvent("email_click", {
        event_category: "lead",
        link_url: link.getAttribute("href"),
        page_path: window.location.pathname
      });
    });
  });

  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    form.addEventListener("submit", function () {
      var formData = new FormData(form);
      trackEvent("generate_lead", {
        event_category: "lead",
        form_name: formData.get("form-name") || form.getAttribute("name") || "oz-flooring-enquiry",
        enquiry_type: formData.get("enquiry_type") || "",
        source_page: formData.get("source_page") || window.location.pathname,
        product: formData.get("product") || "",
        product_slug: formData.get("product_slug") || "",
        brand: formData.get("brand") || "",
        range: formData.get("range") || "",
        category: formData.get("category") || "",
        suburb: formData.get("suburb") || ""
      });
    });
  });

  if (contact.formName) {
    document.querySelectorAll('input[name="form-name"]').forEach(function (input) {
      input.value = contact.formName;
    });
  }

  if (contact.businessName) {
    var schema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://oztimberfloor.com.au/#business-contact",
      "name": contact.businessName,
      "url": "https://oztimberfloor.com.au/",
      "telephone": [contact.phoneDisplay, contact.secondaryPhoneDisplay].filter(Boolean),
      "email": contact.email || undefined,
      "address": contact.showroom ? {
        "@type": "PostalAddress",
        "streetAddress": contact.showroom,
        "addressCountry": "AU"
      } : undefined,
      "areaServed": contact.areaServed ? {
        "@type": "City",
        "name": contact.areaServed
      } : undefined
    };
    var schemaTag = document.createElement("script");
    schemaTag.type = "application/ld+json";
    schemaTag.textContent = JSON.stringify(schema);
    document.head.appendChild(schemaTag);
  }
});
