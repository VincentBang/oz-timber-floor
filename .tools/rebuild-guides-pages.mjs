import fs from "node:fs";
import path from "node:path";

const root = "/Users/daibang/Projects/oz-timber-floor";

const hubSections = {
  hero: `
<section class="hero">
  <div class="shell hero-grid">
    <div>
      <p class="eyebrow">Flooring guides</p>
      <h1>Practical flooring guides for Sydney projects</h1>
      <p class="lead">Read practical advice on flooring types, preparation, installation, quotes and project planning before choosing a product or sending an enquiry.</p>
      <div class="button-row">
        <a class="button" href="#guide-topics">Choose a guide topic</a>
        <a class="button-secondary" href="/contact/?enquiry=product&source=guides">Ask Oz Timber Floor</a>
        <a class="button-secondary" href="/contact/?enquiry=supply-install&source=guides">Request supply + install quote</a>
      </div>
    </div>
    <div class="hero-media">
      <img src="/assets/images/hero/sydney-timber-flooring-contractor.jpg" alt="Practical flooring guides for Sydney projects">
      <div class="hero-badge"><span>Choose</span><span>Prepare</span><span>Install</span></div>
    </div>
  </div>
</section>`,
  quickDecision: `
<section class="section soft">
  <div class="shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Start here</p>
        <h2>What are you trying to decide?</h2>
      </div>
      <p>Use these guide paths to narrow the question first, then move into the right product, service or enquiry page.</p>
    </div>
    <div class="grid-4">
      <a class="category-card link-card" href="#choosing-flooring">
        <strong>Choosing flooring</strong>
        <p>Compare hybrid, laminate, engineered timber, solid timber and vinyl before choosing a product.</p>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
      <a class="category-card link-card" href="#floor-preparation">
        <strong>Floor preparation</strong>
        <p>Understand levelling, subfloor checks, moisture, trims and preparation before installation.</p>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
      <a class="category-card link-card" href="#installation-quotes">
        <strong>Installation and quotes</strong>
        <p>Learn what affects installation, quote scope, access, timing and site readiness.</p>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
      <a class="category-card link-card" href="#commercial-office">
        <strong>Commercial or apartment project</strong>
        <p>Review flooring choices where access, acoustic rules, staging or coordination matter.</p>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</section>`,
  startDecision: `
<section class="section">
  <div class="shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Start with your flooring decision</p>
        <h2>Move from research to the right next page</h2>
      </div>
      <p>If you are comparing products, preparation or installation, these pages help you move from reading into the right enquiry path.</p>
    </div>
    <div class="grid-3">
      <a class="category-card link-card" href="/products/">
        <strong>Compare flooring types</strong>
        <p>Start with hybrid, laminate, engineered timber, solid timber or vinyl before narrowing down the range.</p>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
      <a class="category-card link-card" href="/floor-levelling-sydney/">
        <strong>Plan floor preparation</strong>
        <p>Review levelling, removal and subfloor checks before installation or product ordering.</p>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
      <a class="category-card link-card" href="/contact/?enquiry=product&source=guides">
        <strong>Request installation advice</strong>
        <p>Send your product question, floor condition and suburb when you want help choosing the next step.</p>
        <span class="card-arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</section>`,
  guideTopics: `
<section class="section soft" id="guide-topics">
  <div class="shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Guide topics</p>
        <h2>Choose a guide topic</h2>
      </div>
      <p>Each topic cluster groups related questions, then links to the product or service pages that usually come next.</p>
    </div>
    <div class="stack">
      <section id="choosing-flooring">
        <div class="section-head">
          <div><p class="eyebrow">Choosing flooring</p><h3>Compare flooring types before you compare colours</h3></div>
          <p>Use these guides when you are still deciding between product categories or timber styles.</p>
        </div>
        <div class="grid-3">
          <a class="card link-card" href="/guides/why-a-hardwood-timber-floor-will-never-be-out-of-style/"><h3>Why a hardwood timber floor will never be out of style</h3><p>Understand why natural timber still shapes long-term flooring decisions.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/5-tell-tale-signs-engineered-timber-flooring-is-right-for-your-property/"><h3>Signs engineered timber flooring is right for your property</h3><p>Use this when real timber character and product stability are both part of the brief.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/3-reasons-why-modern-homes-use-engineered-oak-flooring-in-sydney/"><h3>Why modern homes use engineered oak flooring in Sydney</h3><p>See when engineered oak becomes the preferred finish in premium residential interiors.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/solid-timber-flooring-vs-engineered-flooring-which-one-is-right-for-you/"><h3>Solid timber flooring vs engineered flooring</h3><p>Compare long-term value, site fit and installation expectations before choosing one path.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/guide-to-choosing-the-right-vinyl-timber-flooring/"><h3>Guide to choosing vinyl timber flooring</h3><p>Review where vinyl timber-look flooring suits apartments, kitchens and practical spaces.</p><span class="card-arrow" aria-hidden="true">→</span></a>
        </div>
        <p><a class="card-link" href="/products/">Browse flooring categories</a></p>
      </section>
      <section id="floor-preparation">
        <div class="section-head">
          <div><p class="eyebrow">Floor preparation</p><h3>Understand the hidden work before installation</h3></div>
          <p>Preparation guides help customers judge whether levelling, removal or restoration questions should be resolved first.</p>
        </div>
        <div class="grid-3">
          <a class="card link-card" href="/guides/laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring/"><h3>Why floor levelling matters for timber flooring</h3><p>Learn why substrate condition can affect the final result before product ordering or installation.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/when-to-restore-replace-or-extend-existing-solid-timber-floors/"><h3>When to restore, replace or extend solid timber floors</h3><p>Useful when the existing timber floor might still be worth saving.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/hire-over-diy/"><h3>Why hiring a timber floor installer beats DIY</h3><p>Understand the risks that show up when floor preparation or installation details are missed.</p><span class="card-arrow" aria-hidden="true">→</span></a>
        </div>
        <p><a class="card-link" href="/floor-levelling-sydney/">View floor levelling Sydney</a></p>
      </section>
      <section id="installation-quotes">
        <div class="section-head">
          <div><p class="eyebrow">Installation and quote advice</p><h3>Know what to ask before you commit</h3></div>
          <p>These guides help customers ask better questions about scope, access, timing and the people doing the work.</p>
        </div>
        <div class="grid-3">
          <a class="card link-card" href="/guides/the-5-questions-to-ask-your-timber-floor-installer-in-sydney/"><h3>Questions to ask your timber floor installer in Sydney</h3><p>Use this before comparing installers or accepting a quote.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/your-guide-for-choosing-a-reliable-sydney-timber-flooring-provider/"><h3>Choosing a reliable Sydney timber flooring provider</h3><p>Helpful when you want a clearer sense of who should manage the product and installation path.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/3-services-timber-floor-installers-in-sydney-can-do-for-you/"><h3>Services timber floor installers in Sydney can handle</h3><p>See how installation, preparation, sanding and removal can fit into one flooring project.</p><span class="card-arrow" aria-hidden="true">→</span></a>
        </div>
        <p><a class="card-link" href="/timber-flooring-installation-sydney/">View timber flooring installation Sydney</a></p>
      </section>
      <section id="commercial-office">
        <div class="section-head">
          <div><p class="eyebrow">Commercial and office flooring</p><h3>Plan for access, traffic and coordination</h3></div>
          <p>These guides are useful when a project involves offices, managed sites, builders or staged work.</p>
        </div>
        <div class="grid-3">
          <a class="card link-card" href="/guides/choosing-office-flooring-durability-design-performance/"><h3>Choosing office flooring for durability, design and performance</h3><p>Compare office flooring priorities before moving into product or installation decisions.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/professional-commercial-flooring-installation-what-to-expect/"><h3>What to expect from commercial flooring installation</h3><p>Use this to understand staging, preparation and handover expectations on commercial work.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/commercial-timber-flooring-high-traffic-spaces-sydney/"><h3>Commercial timber flooring for high-traffic spaces</h3><p>Review how use, maintenance and presentation affect flooring decisions in busy sites.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/why-commercial-timber-flooring-is-the-right-choice-for-high-end-spaces/"><h3>Why commercial timber flooring suits high-end spaces</h3><p>Explore where a more premium timber finish becomes part of the site brief.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/commercial-timber-flooring-specialist-sydney-builders-designers/"><h3>What builders and designers need from a commercial timber flooring specialist</h3><p>Useful for fit-out teams and managed projects that need more than a simple product list.</p><span class="card-arrow" aria-hidden="true">→</span></a>
        </div>
        <p><a class="card-link" href="/commercial-flooring-sydney/">View commercial flooring Sydney</a></p>
      </section>
      <section id="timber-restoration">
        <div class="section-head">
          <div><p class="eyebrow">Timber restoration and long-term value</p><h3>Decide whether to restore, replace or invest long-term</h3></div>
          <p>These guides help customers think about timber flooring beyond the first installation decision.</p>
        </div>
        <div class="grid-3">
          <a class="card link-card" href="/guides/when-to-restore-replace-or-extend-existing-solid-timber-floors/"><h3>When to restore, replace or extend solid timber floors</h3><p>Compare the practical triggers for restoration versus replacement.</p><span class="card-arrow" aria-hidden="true">→</span></a>
          <a class="card link-card" href="/guides/why-hardwood-timber-flooring-is-a-good-investment/"><h3>Why hardwood timber flooring is a long-term investment</h3><p>Explore why natural timber can still make sense when the brief is long-term value.</p><span class="card-arrow" aria-hidden="true">→</span></a>
        </div>
        <p><a class="card-link" href="/timber-floor-sanding-and-polishing-sydney/">View sanding and polishing Sydney</a></p>
      </section>
    </div>
  </div>
</section>`,
  featured: `
<section class="section">
  <div class="shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Featured guides</p>
        <h2>Featured flooring guides</h2>
      </div>
      <p>Start with the guides that most often support product choice, preparation questions and high-value enquiry pages.</p>
    </div>
    <div class="grid-3">
      <article class="card"><p class="eyebrow">Floor preparation</p><h3>Why floor levelling matters for timber flooring</h3><p>Understand why floor flatness and preparation can affect the finished result before installation.</p><p><a class="card-link" href="/floor-levelling-sydney/">Floor levelling Sydney</a></p><a class="card-link" href="/guides/laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring/">Read guide</a></article>
      <article class="card"><p class="eyebrow">Apartment flooring</p><h3>How hybrid timber flooring performs in Sydney apartments</h3><p>Review acoustic, levelling, access and strata considerations before choosing hybrid flooring.</p><p><a class="card-link" href="/hybrid-flooring-sydney/">Hybrid flooring Sydney</a></p><a class="card-link" href="/guides/how-hybrid-timber-flooring-performs-in-sydney-apartments/">Read guide</a></article>
      <article class="card"><p class="eyebrow">Installation advice</p><h3>Questions to ask your timber floor installer in Sydney</h3><p>Use this guide before accepting a quote or comparing installation pathways.</p><p><a class="card-link" href="/timber-flooring-installation-sydney/">Timber flooring installation Sydney</a></p><a class="card-link" href="/guides/the-5-questions-to-ask-your-timber-floor-installer-in-sydney/">Read guide</a></article>
      <article class="card"><p class="eyebrow">Commercial flooring</p><h3>What to expect from commercial flooring installation</h3><p>Understand preparation, scheduling and handover expectations on managed sites.</p><p><a class="card-link" href="/commercial-flooring-sydney/">Commercial flooring Sydney</a></p><a class="card-link" href="/guides/professional-commercial-flooring-installation-what-to-expect/">Read guide</a></article>
      <article class="card"><p class="eyebrow">Flooring comparison</p><h3>Solid timber flooring vs engineered flooring</h3><p>Compare site fit, finish and long-term expectations before choosing one path.</p><p><a class="card-link" href="/engineered-timber-flooring-sydney/">Engineered timber flooring Sydney</a></p><a class="card-link" href="/guides/solid-timber-flooring-vs-engineered-flooring-which-one-is-right-for-you/">Read guide</a></article>
      <article class="card"><p class="eyebrow">Office projects</p><h3>Choosing office flooring for durability, design and performance</h3><p>Review office flooring decisions before moving into product selection or quoting.</p><p><a class="card-link" href="/office-flooring-sydney/">Office flooring Sydney</a></p><a class="card-link" href="/guides/choosing-office-flooring-durability-design-performance/">Read guide</a></article>
    </div>
  </div>
</section>`,
  pathways: `
<section class="section soft">
  <div class="shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Next step</p>
        <h2>From guide to next step</h2>
      </div>
      <p>Guides should help customers move into the right product, service, proof or enquiry page instead of stopping at research.</p>
    </div>
    <div class="grid-4">
      <article class="category-card"><strong>Need product help?</strong><p><a href="/products/">Products</a><br><a href="/hybrid-flooring-sydney/">Hybrid</a><br><a href="/laminate-flooring-sydney/">Laminate</a><br><a href="/engineered-timber-flooring-sydney/">Engineered timber</a><br><a href="/ranges/">All ranges</a></p></article>
      <article class="category-card"><strong>Need preparation help?</strong><p><a href="/floor-levelling-sydney/">Floor levelling</a><br><a href="/timber-floor-removal-and-stripping-sydney/">Floor removal</a><br><a href="/timber-flooring-installation-sydney/">Timber flooring installation</a></p></article>
      <article class="category-card"><strong>Need proof?</strong><p><a href="/projects/">Projects</a><br><a href="/commercial-flooring-sydney/">Commercial flooring</a><br><a href="/builder-flooring-contractor-sydney/">Builder flooring contractor</a></p></article>
      <article class="category-card"><strong>Ready to enquire?</strong><p><a href="/contact/">Contact</a><br><a href="/contact/?enquiry=supply-only">Request supply price</a><br><a href="/contact/?enquiry=supply-install&source=guides">Request supply + install quote</a></p></article>
    </div>
  </div>
</section>`,
  popularLinks: `
<section class="section">
  <div class="shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Popular pathways</p>
        <h2>Popular service and product links</h2>
      </div>
      <p>These are the pages readers most often need once the research stage turns into a product or service decision.</p>
    </div>
    <div class="grid-3">
      <a class="card link-card" href="/hybrid-flooring-sydney/"><h3>Hybrid flooring for apartments</h3><p>Start here if apartment access, acoustics or practical product choice are the main concerns.</p><span class="card-arrow" aria-hidden="true">→</span></a>
      <a class="card link-card" href="/floor-levelling-sydney/"><h3>Floor levelling before installation</h3><p>Review levelling and subfloor preparation before ordering or installing a new floor.</p><span class="card-arrow" aria-hidden="true">→</span></a>
      <a class="card link-card" href="/commercial-flooring-sydney/"><h3>Commercial and office flooring</h3><p>Use these pages when access, staging or business operations matter as much as the flooring choice.</p><span class="card-arrow" aria-hidden="true">→</span></a>
    </div>
  </div>
</section>`,
  cta: `
<section class="section soft">
  <div class="shell cta">
    <p class="eyebrow">Need help?</p>
    <h2>Need help choosing the right flooring path?</h2>
    <p>Send your suburb, approximate area, current floor, preferred product and any photos or floor plans. Oz Timber Floor can help point you toward the right product, preparation or installation pathway.</p>
    <div class="button-row">
      <a class="button" href="/contact/?enquiry=product&source=guides">Ask Oz Timber Floor</a>
      <a class="button-secondary" href="/contact/?enquiry=supply-install&source=guides">Request supply + install quote</a>
      <a class="button-secondary" href="/products/">Browse products</a>
    </div>
  </div>
</section>`
};

function replaceMain(file, newMain) {
  const html = fs.readFileSync(file, "utf8");
  const updated = html.replace(/<main>[\s\S]*?<\/main>/, newMain);
  fs.writeFileSync(file, updated);
}

const hubMain = `<main>${hubSections.hero}${hubSections.quickDecision}${hubSections.startDecision}${hubSections.guideTopics}${hubSections.featured}${hubSections.pathways}${hubSections.popularLinks}${hubSections.cta}</main>`;

replaceMain(path.join(root, "guides/index.html"), hubMain);
replaceMain(path.join(root, "guides.html"), hubMain);

console.log("Rebuilt guides hub only. Individual guide articles are managed separately.");
process.exit(0);

const articlePages = {
  "guides/laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring/index.html": {
    h1: "Why floor levelling matters for timber flooring",
    lead: "Floor levelling is the hidden work that protects the finished floor from movement, hollow spots and avoidable defects.",
    image: "/assets/images/hero/sydney-timber-flooring-contractor.jpg",
    alt: "Floor preparation before timber flooring installation",
    takeaway: "If the floor is not flat and stable enough for the product you want, the finished installation can be affected before the room is even in use.",
    content: `
      <h2>Why floor flatness matters before flooring goes down</h2>
      <p>Hybrid, laminate, engineered timber and vinyl all depend on a substrate that suits the product tolerance. Even when the boards look straightforward, dips, high spots, residue and uneven joins can affect how the floor feels and performs.</p>
      <h2>Preparation usually costs less than fixing avoidable problems later</h2>
      <p>Levelling is not about making every floor perfect on paper. It is about making the surface suitable for the flooring path you are actually choosing, with trims, heights and adjoining rooms considered early.</p>
      <h2>Removal, levelling and installation often belong in the same conversation</h2>
      <p>Old flooring can hide adhesive build-up, cracks and transition problems. That is why removal, levelling and installation planning are often easier to discuss together instead of as isolated jobs.</p>`,
    checklistTitle: "Quick checklist before you ask for a levelling quote",
    checklist: [
      "Suburb and approximate floor area",
      "Current floor type and whether it has already been removed",
      "Photos of uneven areas, transitions and doorways",
      "The flooring category you want to install next",
    ],
    watchTitle: "Common site conditions to watch",
    watchItems: [
      "Visible dips, humps or movement underfoot",
      "Old adhesive residue after floor removal",
      "Moisture concerns or slab repairs",
      "Height changes between adjoining rooms",
    ],
    related: [
      ["Floor levelling Sydney", "Review the service page when the substrate needs checking before installation.", "/floor-levelling-sydney/"],
      ["Timber flooring installation Sydney", "See how preparation connects to the installation pathway.", "/timber-flooring-installation-sydney/"],
      ["Hybrid flooring Sydney", "Compare a common product path that still depends on a suitable base.", "/hybrid-flooring-sydney/"],
    ],
    finalHeading: "Need your floor checked before installation?",
    finalText: "Send your suburb, approximate floor area, current floor type and photos if available. Oz Timber Floor can help review whether levelling, preparation or installation planning is needed.",
    finalButtons: [
      ["Ask about floor levelling", "/contact/?enquiry=service&topic=floor%20levelling&source=guide"],
      ["Request supply + install quote", "/contact/?enquiry=supply-install&source=guide"],
    ],
  },
  "guides/how-hybrid-timber-flooring-performs-in-sydney-apartments/index.html": {
    h1: "How hybrid timber flooring performs in Sydney apartments",
    lead: "Hybrid flooring can suit apartments when acoustic needs, levelling, strata rules and installation details are handled early.",
    image: "/assets/images/products/hybrid/hybrid-pacific-blackbutt.webp",
    alt: "Hybrid timber-look flooring for a Sydney apartment",
    takeaway: "Hybrid flooring can be a practical apartment choice, but the real decision usually depends on access, acoustic requirements, floor flatness and strata rules rather than the colour alone.",
    content: `
      <h2>Why apartments need more than a product shortlist</h2>
      <p>Apartment flooring decisions often involve lift access, work hours, building rules and underlay requirements as much as the product itself. A floor that looks right still needs to fit the building and the way the work will be carried out.</p>
      <h2>Hybrid flooring can work well where practicality matters</h2>
      <p>Hybrid flooring is often considered for apartments because customers want a timber-look finish with a practical day-to-day cleaning path. That does not remove the need for substrate checks, transitions and acoustic review.</p>
      <h2>Preparation still shapes the finished result</h2>
      <p>Even in apartments, floor flatness, old flooring removal and doorway transitions can affect the way hybrid flooring feels underfoot and how cleanly the install finishes.</p>`,
    checklistTitle: "What to gather before asking about hybrid flooring in an apartment",
    checklist: [
      "Suburb and apartment building type",
      "Approximate floor area and room layout",
      "Any known strata or acoustic requirements",
      "Photos of the current floor, transitions and access points",
    ],
    watchTitle: "Common apartment issues to watch",
    watchItems: [
      "Lift bookings, access windows and parking restrictions",
      "Acoustic underlay or strata requirements",
      "Uneven floors after old floor coverings are removed",
      "Timing around neighbours, tenants or move-in dates",
    ],
    related: [
      ["Hybrid flooring Sydney", "Compare hybrid ranges before narrowing down colours.", "/hybrid-flooring-sydney/"],
      ["Floor levelling Sydney", "Check preparation needs if the apartment floor is not ready.", "/floor-levelling-sydney/"],
      ["Products", "Browse categories and ranges before choosing the final product path.", "/products/"],
    ],
    finalHeading: "Need help choosing hybrid flooring for an apartment?",
    finalText: "Send your suburb, approximate area, current floor and any building or strata details. Oz Timber Floor can help review product fit, preparation and installation timing.",
    finalButtons: [
      ["Ask about apartment flooring", "/contact/?enquiry=product&topic=hybrid%20apartment&source=guide"],
      ["Request supply + install quote", "/contact/?enquiry=supply-install&source=guide"],
    ],
  },
  "guides/professional-commercial-flooring-installation-what-to-expect/index.html": {
    h1: "What to expect from commercial flooring installation",
    lead: "A professional commercial flooring installation should start with inspection, preparation, scheduling and clear handover expectations.",
    image: "/assets/images/products/engineered/engineered-blackbutt-rustic.jpg",
    alt: "Commercial flooring installation planning for a Sydney fit-out",
    takeaway: "Commercial flooring projects succeed when the flooring choice, site conditions, staging and access rules are reviewed together instead of one at a time.",
    content: `
      <h2>Commercial flooring usually starts with the site, not the sample board</h2>
      <p>Access rules, working hours, protection requirements and the way the space operates all influence the flooring path. That is why commercial flooring installation is often more about coordination than just selecting the floor itself.</p>
      <h2>Preparation and staging shape the install</h2>
      <p>Subfloor condition, removal, levelling and staged handover areas can all affect whether the installation runs cleanly. The strongest outcomes usually come from reviewing these items before the program is locked in.</p>
      <h2>Product choice should match use, maintenance and presentation</h2>
      <p>Commercial timber, hybrid and vinyl all suit different environments. The right choice depends on traffic, cleaning expectations, business image and the amount of disruption the site can tolerate.</p>`,
    checklistTitle: "What to include in a commercial flooring enquiry",
    checklist: [
      "Site type, suburb and approximate floor area",
      "Preferred product category or finish direction",
      "Access rules, work hours and any staging requirements",
      "Current floor condition and whether removal or levelling may be needed",
    ],
    watchTitle: "Common commercial conditions to watch",
    watchItems: [
      "After-hours or restricted access windows",
      "Lift bookings, deliveries and building protection",
      "Subfloor preparation before the final finish is installed",
      "Coordination with other trades and handover deadlines",
    ],
    related: [
      ["Commercial flooring Sydney", "See the main service page for managed-site flooring support.", "/commercial-flooring-sydney/"],
      ["Office flooring Sydney", "Review office-specific planning for occupied workspaces and fit-outs.", "/office-flooring-sydney/"],
      ["Projects", "Use the projects page for proof and typical site pathways.", "/projects/"],
    ],
    finalHeading: "Need help planning a commercial flooring project?",
    finalText: "Send the site type, suburb, approximate area, access rules and preferred product direction. Oz Timber Floor can help review the right preparation and installation path.",
    finalButtons: [
      ["Request commercial quote", "/contact/?enquiry=supply-install&topic=commercial%20flooring&source=guide"],
      ["Ask about staged installation", "/contact/?enquiry=service&topic=commercial%20staging&source=guide"],
    ],
  },
};

function rebuildArticle(file, data) {
  const full = path.join(root, file);
  const html = fs.readFileSync(full, "utf8");
  const main = `<main>
  <section class="hero">
    <div class="shell hero-grid">
      <div>
        <p class="eyebrow">Flooring guide</p>
        <h1>${data.h1}</h1>
        <p class="lead">${data.lead}</p>
        <div class="button-row">
          <a class="button" href="/contact/?enquiry=product&source=guide">Ask Oz Timber Floor</a>
          <a class="button-secondary" href="/guides/">More guides</a>
        </div>
      </div>
      <div class="hero-media">
        <img src="${data.image}" alt="${data.alt}">
        <div class="hero-badge"><span>Choose</span><span>Prepare</span><span>Install</span></div>
      </div>
    </div>
  </section>
  <section class="section soft">
    <div class="shell">
      <div class="section-head">
        <div><p class="eyebrow">Key takeaway</p><h2>Start with the practical question</h2></div>
        <p>${data.takeaway}</p>
      </div>
      <div class="text-block">${data.content}</div>
    </div>
  </section>
  <section class="section">
    <div class="shell">
      <div class="section-head">
        <div><p class="eyebrow">Checklist</p><h2>${data.checklistTitle}</h2></div>
      </div>
      <div class="grid-4">
        ${data.checklist
          .map(
            (item, i) =>
              `<article class="category-card"><strong>Check ${i + 1}</strong><p>${item}</p></article>`
          )
          .join("")}
      </div>
    </div>
  </section>
  <section class="section soft">
    <div class="shell">
      <div class="section-head">
        <div><p class="eyebrow">Watch for</p><h2>${data.watchTitle}</h2></div>
      </div>
      <div class="caution-grid">
        ${data.watchItems
          .map(
            (item) =>
              `<article class="caution-card"><span class="insight-label">Review</span><p>${item}</p></article>`
          )
          .join("")}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="shell">
      <div class="section-head">
        <div><p class="eyebrow">Next pages</p><h2>Related service and product pathways</h2></div>
        <p>These links help move the guide into the right product, service or enquiry page.</p>
      </div>
      <div class="grid-3">
        ${data.related
          .map(
            ([title, text, href]) =>
              `<a class="card link-card" href="${href}"><h3>${title}</h3><p>${text}</p><span class="card-arrow" aria-hidden="true">→</span></a>`
          )
          .join("")}
      </div>
    </div>
  </section>
  <section class="section soft">
    <div class="shell cta">
      <p class="eyebrow">Talk to Oz Timber Floor</p>
      <h2>${data.finalHeading}</h2>
      <p>${data.finalText}</p>
      <div class="button-row">
        ${data.finalButtons
          .map(([label, href], i) => `<a class="${i === 0 ? "button" : "button-secondary"}" href="${href}">${label}</a>`)
          .join("")}
      </div>
    </div>
  </section>
</main>`;
  fs.writeFileSync(full, html.replace(/<main>[\s\S]*?<\/main>/, main));
}

for (const file of Object.keys(articlePages)) {
  rebuildArticle(file, articlePages[file]);
}

console.log("Rebuilt guides hub and selected guide articles.");
