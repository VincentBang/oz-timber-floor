document.addEventListener("DOMContentLoaded", function () {
  var contact = window.OZ_TIMBER_FLOOR_CONTACT || {};
  var analytics = contact.analytics || {};
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");

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

  function trackEvent(name, params) {
    params = params || {};
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  }

  initAnalytics();

  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll(".faq-item button").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".faq-item");
      if (item) item.toggleAttribute("open");
    });
  });

  var params = new URLSearchParams(window.location.search);
  var enquiry = params.get("enquiry");
  var topic = params.get("topic");
  var product = params.get("product");
  var category = params.get("category");
  var select = document.querySelector("#enquiryType");
  var sourcePage = document.querySelector("#sourcePage");
  var productField = document.querySelector("#product");
  var categoryField = document.querySelector("#category");
  var message = document.querySelector("#message");

  if (select && enquiry) {
    select.value = enquiry;
  }

  if (sourcePage) {
    sourcePage.value = params.get("source") || window.location.pathname;
  }

  if (productField && product) {
    productField.value = product;
  }

  if (categoryField && category) {
    categoryField.value = category;
  }

  if (message && (topic || product || category)) {
    var parts = [];
    if (topic) parts.push("Topic: " + topic);
    if (product) parts.push("Product: " + product);
    if (category) parts.push("Category: " + category);
    message.value = parts.join("\n") + "\n\n";
  }

  function contactBlock() {
    var lines = [];
    if (contact.showroom) lines.push("Showroom: " + contact.showroom);
    if (contact.phoneDisplay) lines.push("Phone: " + contact.phoneDisplay);
    if (contact.secondaryPhoneDisplay) lines.push("Second phone: " + contact.secondaryPhoneDisplay);
    if (contact.email) lines.push("Email: " + contact.email);
    return lines.join("\n");
  }

  document.querySelectorAll("[data-contact-block]").forEach(function (target) {
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
        product_category: formData.get("category") || "",
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
