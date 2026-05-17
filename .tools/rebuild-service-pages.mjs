import fs from "node:fs";
import path from "node:path";

const root = "/Users/daibang/Projects/oz-timber-floor";

const pages = {
  "floor-levelling-sydney/index.html": {
    canonical: "https://oztimberfloor.com.au/floor-levelling-sydney/",
    title: "Floor Levelling Sydney | Subfloor Preparation Specialist",
    description:
      "Floor levelling Sydney for uneven concrete slabs, subfloor preparation and self-levelling compound before hybrid, laminate, engineered timber or vinyl flooring.",
    serviceName: "Floor levelling and subfloor preparation in Sydney",
    heroEyebrow: "Floor levelling Sydney",
    heroH1: "Floor levelling Sydney",
    heroLead:
      "Floor levelling helps prepare uneven floors before hybrid, laminate, engineered timber or other flooring is installed. Oz Timber Floor can review floor condition, preparation needs and installation suitability before work starts.",
    heroImage: "/assets/images/hero/sydney-timber-flooring-contractor.jpg",
    heroAlt: "Floor levelling and subfloor preparation before flooring installation in Sydney",
    badges: ["Subfloor preparation", "Installation planning", "Sydney-wide"],
    primaryCta: {
      label: "Request floor levelling quote",
      href: "/contact/?enquiry=service&topic=floor%20levelling%20Sydney&source=floor-levelling-sydney",
    },
    secondaryCta: {
      label: "Send photos or floor plan",
      href: "/contact/?enquiry=service&topic=floor%20levelling%20photos&source=floor-levelling-sydney",
    },
    decisionHeading: "What do you need help with?",
    decisionIntro:
      "These starting points help decide whether the site needs floor levelling, removal, installation planning or a combined quote.",
    decisionCards: [
      {
        title: "Uneven floor",
        text: "You can feel dips, humps, movement or height changes before installation.",
        href: "/contact/?enquiry=service&topic=uneven%20floor&source=floor-levelling-sydney",
        label: "Ask about levelling",
      },
      {
        title: "New flooring preparation",
        text: "Hybrid, laminate and timber floors need a suitable flat and stable base.",
        href: "/contact/?enquiry=service&topic=preparation%20review&source=floor-levelling-sydney",
        label: "Request preparation review",
      },
      {
        title: "Existing floor removal",
        text: "Old flooring may need removal before levelling or new installation.",
        href: "/timber-floor-removal-and-stripping-sydney/",
        label: "Ask about removal",
      },
      {
        title: "Supply + install",
        text: "If you need new flooring installed, levelling can be reviewed as part of the quote.",
        href: "/contact/?enquiry=supply-install&source=floor-levelling-sydney",
        label: "Request supply + install quote",
      },
    ],
    whatHeading: "When floor levelling may be needed",
    whatIntro:
      "Levelling usually becomes part of the conversation when the floor condition could affect board movement, finish quality or transitions.",
    whatCards: [
      ["Before hybrid flooring installation", "Floating hybrid floors still need a flat, stable base so joins are not stressed."],
      ["Before laminate flooring installation", "Laminate performs better when the substrate is even and transitions are planned early."],
      ["Before engineered timber installation", "Engineered timber often needs closer checks where adhesive method, moisture and heights matter."],
      ["After removing old flooring", "Once the old floor is lifted, hidden dips, cracks, residue or repairs become easier to assess."],
      ["When there are dips, humps or uneven joins", "Visible or felt height changes can affect installation and the way the finished floor feels underfoot."],
      ["When adjoining rooms or doorways have height issues", "Door clearances, trims and changes between surfaces often need planning before flooring goes down."],
    ],
    includeHeading: "What floor preparation may include",
    includeIntro:
      "The exact preparation depends on the substrate, the flooring being installed and what is uncovered on site.",
    includeCards: [
      ["Floor condition review", "Checking visible dips, humps, movement, cracks or uneven transitions before installation planning."],
      ["Subfloor preparation", "Preparing concrete slabs or timber substrates before new flooring is installed."],
      ["Levelling compound or patching", "Using suitable preparation methods where the product and site conditions allow."],
      ["Height and transition planning", "Checking doorways, trims, skirting or scotia and adjoining floor levels before work starts."],
      ["Removal coordination", "Reviewing whether existing flooring must be removed before preparation or installation."],
    ],
    siteHeading: "Site details that can affect the quote",
    siteIntro:
      "A few practical site details make it easier to judge whether levelling is likely and how it fits the rest of the project.",
    siteCards: [
      ["Floor area", "Approximate square metres helps frame the size of the preparation area."],
      ["Current flooring type", "Tiles, carpet, vinyl, timber or bare concrete can change the preparation path."],
      ["Concrete or timber substrate", "The base under the visible floor affects how preparation is reviewed."],
      ["Severity of unevenness", "Photos or a description of dips, humps or height changes helps start the conversation."],
      ["Moisture concerns", "Visible moisture, past leaks or slab concerns should be raised early."],
      ["Access, stairs, lifts and parking", "Access conditions can affect how preparation work is scheduled."],
      ["Whether new flooring is being installed", "The product category helps determine the level of substrate tolerance needed."],
      ["Timing and site readiness", "Occupied rooms, other trades and project timing can affect the order of work."],
    ],
    processHeading: "How the service enquiry works",
    processIntro:
      "A good levelling enquiry usually starts with photos, rough dimensions and the flooring outcome you are aiming for.",
    processSteps: [
      ["Send project details", "Share suburb, approximate area, current floor, photos of uneven areas and timing."],
      ["Review the site requirements", "Oz Timber Floor checks what type of preparation may be needed before flooring is installed."],
      ["Confirm scope", "Product choice, removal, floor flatness, access and transitions are reviewed together."],
      ["Quote or next step", "You receive the right preparation, removal or supply + install pathway for the project."],
    ],
    relatedHeading: "Related products and services",
    relatedIntro:
      "Levelling usually links straight into installation planning and the flooring category being considered.",
    relatedCards: [
      ["Hybrid flooring", "Compare practical floating-floor options that still need a suitable base.", "/hybrid-flooring-sydney/"],
      ["Laminate flooring", "Review dry-area timber-look flooring before finalising preparation needs.", "/laminate-flooring-sydney/"],
      ["Engineered timber", "Check premium timber options where substrate condition and method matter more.", "/engineered-timber-flooring-sydney/"],
      ["Timber flooring installation", "Plan installation once the floor condition and preparation path are clearer.", "/timber-flooring-installation-sydney/"],
      ["Floor removal", "Review whether the old floor should be removed before levelling starts.", "/timber-floor-removal-and-stripping-sydney/"],
      ["Projects", "See the kinds of flooring situations Oz Timber Floor helps solve before installation.", "/projects/"],
    ],
    proofHeading: "Common project examples",
    proofIntro:
      "These are common site situations rather than named completed projects, but they reflect the types of enquiries that often need floor preparation.",
    proofCards: [
      ["Floor levelling before hybrid flooring", "A preparation path for homes or apartments where dips, uneven joins or old flooring removal need to be reviewed first.", "/contact/?enquiry=supply-install&topic=levelling%20before%20hybrid&source=floor-levelling-sydney", "Request similar quote"],
      ["Subfloor preparation before engineered timber", "Useful where a premium timber finish depends on better substrate checks before installation.", "/contact/?enquiry=service&topic=engineered%20timber%20preparation&source=floor-levelling-sydney", "Ask about preparation"],
    ],
    faqHeading: "Questions about floor levelling",
    faqIntro:
      "These answers help customers decide whether floor levelling should be reviewed before installation or product ordering.",
    faqs: [
      ["Do I need floor levelling before hybrid flooring?", "It depends on floor flatness, product requirements and site condition. The floor should be checked before installation."],
      ["Can you quote floor levelling from photos?", "Photos can help start the review, but the final scope may still need site inspection or further measurement."],
      ["What affects floor levelling cost?", "Area, unevenness, substrate condition, access, removal and the flooring being installed can all affect the scope."],
      ["Can floor levelling be included with installation?", "Yes. Preparation can be reviewed as part of a supply + install enquiry."],
      ["Can you level over old flooring?", "It depends on the existing floor, adhesion, movement and product requirements. It should be reviewed before planning work."],
    ],
    finalHeading: "Need your floor checked before installation?",
    finalText:
      "Send your suburb, approximate floor area, current floor type and photos if available. Oz Timber Floor can help review whether levelling, preparation or installation planning is needed.",
    finalButtons: [
      ["Request floor levelling quote", "/contact/?enquiry=service&topic=floor%20levelling%20Sydney&source=floor-levelling-sydney"],
      ["Send photos / floor plan", "/contact/?enquiry=service&topic=floor%20levelling%20photos&source=floor-levelling-sydney"],
      ["Request supply + install quote", "/contact/?enquiry=supply-install&source=floor-levelling-sydney"],
    ],
  },
  "timber-flooring-installation-sydney/index.html": {
    canonical: "https://oztimberfloor.com.au/timber-flooring-installation-sydney/",
    title: "Timber Flooring Installation Sydney | Oz Timber Floor",
    description:
      "Timber flooring installation Sydney for engineered timber, solid timber, hybrid and laminate floors with subfloor preparation, trims and supply + install support.",
    serviceName: "Timber flooring installation in Sydney",
    heroEyebrow: "Timber flooring installation Sydney",
    heroH1: "Timber flooring installation Sydney",
    heroLead:
      "Oz Timber Floor helps plan timber, hybrid, laminate and vinyl installation with practical advice about the product, subfloor, trims, access and preparation before work begins.",
    heroImage: "/assets/images/hero/sydney-timber-flooring-contractor.jpg",
    heroAlt: "Timber flooring installation in a Sydney home",
    badges: ["Supply + install", "Preparation", "Sydney-wide"],
    primaryCta: { label: "Request supply + install quote", href: "/contact/?enquiry=supply-install&source=timber-flooring-installation-sydney" },
    secondaryCta: { label: "Send project details", href: "/contact/?enquiry=service&topic=installation%20details&source=timber-flooring-installation-sydney" },
    decisionHeading: "What do you need help with?",
    decisionIntro: "Start with the type of installation question you have so the right product and preparation pathway can be reviewed.",
    decisionCards: [
      { title: "Install new flooring", text: "For hybrid, laminate, engineered timber, solid timber or vinyl installation support.", href: "/contact/?enquiry=supply-install&source=timber-flooring-installation-sydney", label: "Request install quote" },
      { title: "Subfloor preparation", text: "Uneven floors, old adhesives or transitions may need checking before installation.", href: "/floor-levelling-sydney/", label: "Review preparation" },
      { title: "Apartment or strata project", text: "Access, acoustics, underlay and work hours should be checked early.", href: "/contact/?enquiry=service&topic=apartment%20installation&source=timber-flooring-installation-sydney", label: "Ask about apartments" },
      { title: "Supply-only enquiry", text: "If you already know the product, Oz can still help with stock and installation advice.", href: "/contact/?enquiry=supply-only&source=timber-flooring-installation-sydney", label: "Request supply price" },
    ],
    whatHeading: "When timber flooring installation is the right service",
    whatIntro: "Installation enquiries usually start when the flooring type is chosen or the site is close enough to begin planning the finished floor properly.",
    whatCards: [
      ["Hybrid flooring installation", "Useful for practical floating-floor projects in homes, apartments and rental upgrades."],
      ["Laminate flooring installation", "Common for dry internal rooms where speed, finish and cost awareness all matter."],
      ["Engineered timber installation", "Best when a premium timber finish needs closer review of method, heights and preparation."],
      ["Solid timber installation", "Relevant where the project suits a traditional timber floor and longer-term finish planning."],
      ["Apartment installation", "Helpful where lift access, strata rules or acoustic requirements affect the job."],
      ["Replacement flooring after removal", "Useful when the old floor is being removed and the new installation needs to be sequenced properly."],
    ],
    includeHeading: "What the installation service may include",
    includeIntro: "Installation usually combines product choice, preparation and finishing details rather than just putting boards down.",
    includeCards: [
      ["Product and method review", "Matching the flooring category to the room, use and subfloor condition."],
      ["Subfloor checks", "Reviewing flatness, stability, moisture concerns and whether levelling is needed."],
      ["Trims and transitions", "Planning doorways, adjoining floors, stairs, skirting or scotia and edge details."],
      ["Access and sequencing", "Checking parking, lifts, furniture, work hours and project timing before installation day."],
      ["Supply + install coordination", "Linking product availability, preparation and installation into one pathway."],
    ],
    siteHeading: "Site details that can affect the quote",
    siteIntro: "A few practical site details can change the best installation method and the amount of preparation needed.",
    siteCards: [
      ["Product type", "Hybrid, laminate, engineered timber, solid timber or vinyl all have different installation needs."],
      ["Floor area", "Approximate square metres helps with planning and supply."],
      ["Current floor condition", "Uneven surfaces, residue, old flooring or moisture concerns should be raised early."],
      ["Stairs", "Stairs and landings can affect the scope and finishing details."],
      ["Trims and transitions", "Changes between rooms and surfaces often need extra planning."],
      ["Skirting or scotia", "Edge detail preferences affect how the finished floor is presented."],
      ["Furniture and access", "Occupied rooms, lifts, parking and timing can shape the installation sequence."],
      ["Project timing", "Builder schedules, apartment rules or move-in dates can all affect planning."],
    ],
    processHeading: "How the installation enquiry works",
    processIntro: "A good installation enquiry gives enough detail to decide whether product, preparation or access should be reviewed first.",
    processSteps: [
      ["Send project details", "Include suburb, approximate area, current floor, preferred product and timing."],
      ["Review the site requirements", "Oz Timber Floor checks the product pathway, access and likely preparation needs."],
      ["Confirm scope", "Installation method, trims, transitions, removal or levelling are discussed together."],
      ["Quote or next step", "You receive the right supply-only, stock check or supply + install pathway."],
    ],
    relatedHeading: "Related products and services",
    relatedIntro: "Installation planning usually connects directly to flooring categories and any preparation needed before the finished floor goes down.",
    relatedCards: [
      ["Hybrid flooring", "Compare practical timber-look options often installed in homes and apartments.", "/hybrid-flooring-sydney/"],
      ["Laminate flooring", "Review dry-area timber-look options before locking in the installation path.", "/laminate-flooring-sydney/"],
      ["Engineered timber", "Explore premium timber finishes where method and preparation matter more.", "/engineered-timber-flooring-sydney/"],
      ["Solid timber", "Check traditional timber options for projects with longer-term finish planning.", "/solid-timber-flooring-sydney/"],
      ["Floor levelling", "Review subfloor preparation before installation if the base is not ready.", "/floor-levelling-sydney/"],
      ["Floor removal", "Plan whether the existing floor should be removed first.", "/timber-floor-removal-and-stripping-sydney/"],
    ],
    proofHeading: "Common project examples",
    proofIntro: "These are common installation pathways rather than named completed projects, but they show the types of work often discussed before quoting.",
    proofCards: [
      ["Apartment hybrid flooring installation", "A common pathway where product choice, underlay, access and timing need to be reviewed together.", "/contact/?enquiry=supply-install&topic=apartment%20hybrid%20installation&source=timber-flooring-installation-sydney", "Request similar quote"],
      ["Engineered timber installation after floor preparation", "Useful where a premium finish depends on levelling and transition planning before the boards arrive.", "/contact/?enquiry=supply-install&topic=engineered%20timber%20installation&source=timber-flooring-installation-sydney", "Ask about installation"],
    ],
    faqHeading: "Questions about timber flooring installation",
    faqIntro: "These answers help customers understand what usually needs to be confirmed before installation day.",
    faqs: [
      ["What types of flooring can Oz Timber Floor install?", "Oz can discuss engineered timber, solid timber, hybrid, laminate, vinyl and related preparation services depending on site conditions and product availability."],
      ["Should the floor be level before installation?", "Yes. The subfloor should be checked before installation. The required preparation depends on the flooring option, tolerance, substrate and existing floor condition."],
      ["Can you install flooring in apartments?", "Apartment projects may be possible, but acoustic requirements, lift access, strata rules, working hours and underlay specifications should be confirmed early."],
      ["Can I request supply-only instead of installation?", "Yes. Oz supports supply-only enquiries, stock checks and supply + install enquiries. Include the product range, quantity and suburb when you contact the team."],
    ],
    finalHeading: "Ready to plan your flooring installation?",
    finalText: "Send your suburb, approximate floor area, preferred product, current floor type and any access details. Oz Timber Floor can help confirm the right installation and preparation path before quoting.",
    finalButtons: [
      ["Request supply + install quote", "/contact/?enquiry=supply-install&source=timber-flooring-installation-sydney"],
      ["Browse flooring products", "/products/"],
      ["Send project details", "/contact/?enquiry=service&topic=installation%20details&source=timber-flooring-installation-sydney"],
    ],
  },
  "timber-floor-removal-and-stripping-sydney/index.html": {
    canonical: "https://oztimberfloor.com.au/timber-floor-removal-and-stripping-sydney/",
    title: "Timber Floor Removal and Stripping Sydney | Oz Timber Floor",
    description:
      "Timber floor removal and stripping Sydney for old flooring, adhesive residue, disposal planning and subfloor preparation before replacement floors.",
    serviceName: "Timber floor removal and stripping in Sydney",
    heroEyebrow: "Timber floor removal and stripping Sydney",
    heroH1: "Timber floor removal and stripping Sydney",
    heroLead:
      "Old flooring often needs to be removed before levelling, product selection or new installation can be planned properly. Oz Timber Floor can help review removal, substrate condition and the next flooring step together.",
    heroImage: "/assets/images/hero/sydney-timber-flooring-contractor.jpg",
    heroAlt: "Old timber flooring removal before a new floor is installed in Sydney",
    badges: ["Removal", "Preparation", "Replacement planning"],
    primaryCta: { label: "Request removal quote", href: "/contact/?enquiry=service&topic=floor%20removal%20Sydney&source=timber-floor-removal-and-stripping-sydney" },
    secondaryCta: { label: "Send project photos", href: "/contact/?enquiry=service&topic=floor%20removal%20photos&source=timber-floor-removal-and-stripping-sydney" },
    decisionHeading: "What do you need help with?",
    decisionIntro: "These are the common starting points when an old floor has to come up before the new one can go down.",
    decisionCards: [
      { title: "Remove old flooring", text: "For timber, laminate, vinyl, carpet or underlay that needs to be lifted first.", href: "/contact/?enquiry=service&topic=floor%20removal%20Sydney&source=timber-floor-removal-and-stripping-sydney", label: "Request removal quote" },
      { title: "Adhesive or residue issues", text: "Old adhesive build-up can affect levelling and replacement installation.", href: "/contact/?enquiry=service&topic=adhesive%20residue&source=timber-floor-removal-and-stripping-sydney", label: "Ask about stripping" },
      { title: "Preparing for new flooring", text: "Once the old floor is removed, the new product and substrate condition can be reviewed properly.", href: "/floor-levelling-sydney/", label: "Review preparation" },
      { title: "Supply + install", text: "If the floor is being replaced, removal can be planned as part of the full flooring pathway.", href: "/contact/?enquiry=supply-install&source=timber-floor-removal-and-stripping-sydney", label: "Request supply + install quote" },
    ],
    whatHeading: "When floor removal may be needed",
    whatIntro: "Removal is usually the first job when the existing floor is stopping a clean installation or hiding substrate issues underneath.",
    whatCards: [
      ["Before hybrid flooring replacement", "Useful when old surfaces need to come up before the new floating floor is planned."],
      ["Before laminate replacement", "Often needed where old carpet, vinyl or damaged boards are in the way."],
      ["Before engineered timber installation", "Premium timber installation often benefits from a clean substrate and clear height planning first."],
      ["After failed flooring or adhesive issues", "Old residue, loose materials or uneven build-up can make replacement harder if not removed."],
      ["When there are hidden slab concerns", "Removal helps reveal cracks, dips, repairs and moisture risks that were previously covered."],
      ["When disposal and access need planning", "Occupied homes, stairs, lifts and parking can affect the removal sequence."],
    ],
    includeHeading: "What the removal service may include",
    includeIntro: "Removal can involve more than lifting the old floor. The next stage usually depends on what is revealed underneath.",
    includeCards: [
      ["Existing floor removal", "Removing old timber, laminate, hybrid, vinyl, carpet or underlay where appropriate."],
      ["Adhesive and residue review", "Identifying build-up or contaminants that may affect preparation or the new floor."],
      ["Access and site protection", "Reviewing dust, noise, disposal, access and protection requirements before work starts."],
      ["Substrate inspection", "Checking what the slab or substrate is actually like once the old floor is removed."],
      ["Preparation for replacement", "Moving into levelling, patching or installation planning after removal is complete."],
    ],
    siteHeading: "Site details that can affect the quote",
    siteIntro: "A few practical details help decide how removal should be sequenced and what the likely next step will be.",
    siteCards: [
      ["Existing floor type", "Timber, vinyl, carpet, laminate and tiled-over areas can all affect removal expectations."],
      ["Adhesive and residue", "Heavy adhesive build-up can change the preparation needed afterwards."],
      ["Disposal needs", "Disposal planning can vary depending on the material and access."],
      ["Dust and noise", "Occupied rooms or managed sites may need closer planning around disruption."],
      ["Access", "Stairs, lifts, parking and site entry can affect the scope and timing."],
      ["Whether new flooring follows", "The replacement product can change how carefully the substrate needs to be prepared."],
      ["Furniture and occupancy", "Occupied spaces may need more staging or protection."],
      ["Timing", "Move-in dates, trades and renovation programs can all shape the order of work."],
    ],
    processHeading: "How the removal enquiry works",
    processIntro: "A good removal enquiry explains what the old floor is, what is replacing it and what the access looks like.",
    processSteps: [
      ["Send project details", "Share suburb, approximate area, existing floor type, photos and timing."],
      ["Review the site requirements", "Oz Timber Floor checks whether removal, stripping, levelling or installation should be discussed together."],
      ["Confirm scope", "Access, disposal, residue, substrate condition and the replacement flooring path are reviewed."],
      ["Quote or next step", "You receive the right removal, preparation or supply + install pathway."],
    ],
    relatedHeading: "Related products and services",
    relatedIntro: "Removal usually leads directly into preparation, product comparison and replacement installation.",
    relatedCards: [
      ["Timber flooring installation", "Plan the replacement floor once the old surface is removed.", "/timber-flooring-installation-sydney/"],
      ["Floor levelling", "Check whether the substrate needs more preparation after removal.", "/floor-levelling-sydney/"],
      ["Hybrid flooring", "Compare practical replacement options for many homes and apartments.", "/hybrid-flooring-sydney/"],
      ["Laminate flooring", "Review timber-look replacement options before locking in the new floor.", "/laminate-flooring-sydney/"],
      ["Contact", "Send photos and project details if you already know the floor needs to come up.", "/contact/?enquiry=service&topic=floor%20removal%20Sydney&source=timber-floor-removal-and-stripping-sydney"],
    ],
    proofHeading: "Common project examples",
    proofIntro: "These are common removal pathways rather than named completed jobs, but they reflect the kinds of replacement projects often discussed.",
    proofCards: [
      ["Old flooring removal before hybrid installation", "A common path where the existing floor, residue and subfloor need to be checked before a new floating floor is installed.", "/contact/?enquiry=supply-install&topic=removal%20before%20hybrid&source=timber-floor-removal-and-stripping-sydney", "Request similar quote"],
      ["Removal and levelling before timber replacement", "Useful where the old floor is hiding dips, adhesive build-up or height changes that need review first.", "/contact/?enquiry=service&topic=removal%20and%20levelling&source=timber-floor-removal-and-stripping-sydney", "Ask about preparation"],
    ],
    faqHeading: "Questions about floor removal and stripping",
    faqIntro: "These answers help customers understand what removal work can affect before the replacement floor is chosen or installed.",
    faqs: [
      ["Can removal and installation be handled together?", "Yes. It is often useful to discuss removal, levelling, product supply and installation together so timing and substrate preparation are clear."],
      ["Will removal show whether the floor needs levelling?", "Often, yes. Once the old floor and underlay are removed, dips, cracks, residue and height problems are easier to assess."],
      ["Can adhesive residue affect the new floor?", "Yes. Heavy adhesive residue, contaminants or uneven build-up can affect levelling and installation. It should be identified before the new floor is installed."],
      ["What information helps a removal enquiry?", "Send the suburb, approximate area, existing floor type, access details, whether furniture is present and the new flooring category being considered."],
    ],
    finalHeading: "Need old flooring removed before replacement?",
    finalText: "Send photos of the existing floor, approximate area, suburb, access details and the replacement flooring you are considering. Oz Timber Floor can help confirm the right removal and next-step pathway.",
    finalButtons: [
      ["Request removal quote", "/contact/?enquiry=service&topic=floor%20removal%20Sydney&source=timber-floor-removal-and-stripping-sydney"],
      ["Request supply + install quote", "/contact/?enquiry=supply-install&source=timber-floor-removal-and-stripping-sydney"],
      ["Send project photos", "/contact/?enquiry=service&topic=floor%20removal%20photos&source=timber-floor-removal-and-stripping-sydney"],
    ],
  },
  "timber-floor-sanding-and-polishing-sydney/index.html": {
    canonical: "https://oztimberfloor.com.au/timber-floor-sanding-and-polishing-sydney/",
    title: "Timber Floor Sanding and Polishing Sydney | Oz Timber Floor",
    description:
      "Timber floor sanding and polishing Sydney for worn timber floors, coating refreshes, restoration advice and replacement planning.",
    serviceName: "Timber floor sanding and polishing in Sydney",
    heroEyebrow: "Timber floor sanding and polishing Sydney",
    heroH1: "Timber floor sanding and polishing Sydney",
    heroLead:
      "Some timber floors are worth restoring. Oz Timber Floor can help review board condition, sanding suitability, finish expectations and whether restoration or replacement is the better path.",
    heroImage: "/assets/images/products/engineered/engineered-blackbutt-rustic.jpg",
    heroAlt: "Existing timber floor sanding and polishing in Sydney",
    badges: ["Timber restoration", "Finish review", "Sydney-wide"],
    primaryCta: { label: "Request sanding quote", href: "/contact/?enquiry=service&topic=sanding%20and%20polishing&source=timber-floor-sanding-and-polishing-sydney" },
    secondaryCta: { label: "Send photos", href: "/contact/?enquiry=service&topic=sanding%20photos&source=timber-floor-sanding-and-polishing-sydney" },
    decisionHeading: "What do you need help with?",
    decisionIntro: "Start with the condition of the floor so Oz Timber Floor can help judge whether sanding, repairs or replacement should be reviewed.",
    decisionCards: [
      { title: "Worn timber floor", text: "For scratched, dull or tired boards that may still be worth restoring.", href: "/contact/?enquiry=service&topic=timber%20restoration&source=timber-floor-sanding-and-polishing-sydney", label: "Ask about restoration" },
      { title: "Coating refresh", text: "Some floors may need finish advice, not full replacement.", href: "/contact/?enquiry=service&topic=coating%20refresh&source=timber-floor-sanding-and-polishing-sydney", label: "Request sanding quote" },
      { title: "Unsure whether to replace", text: "If the floor is badly worn, Oz can help review whether restoration is still practical.", href: "/timber-floor-removal-and-stripping-sydney/", label: "Compare replacement path" },
      { title: "Need new flooring instead", text: "If restoration is not the best fit, replacement flooring can be planned next.", href: "/contact/?enquiry=supply-install&source=timber-floor-sanding-and-polishing-sydney", label: "Request supply + install quote" },
    ],
    whatHeading: "When sanding and polishing may be worth reviewing",
    whatIntro: "This service is most useful when the existing timber floor still has enough life in it to justify restoration rather than replacement.",
    whatCards: [
      ["Worn timber floors", "General wear, dull coatings and surface scratching can often be reviewed for restoration."],
      ["Older solid timber floors", "Traditional timber floors may respond well when the boards are stable and thick enough."],
      ["Floors with cosmetic wear", "Surface marks may improve even if not every stain or repair disappears completely."],
      ["Projects comparing restore or replace", "Useful when the next step is not obvious and the timber floor needs an honest assessment first."],
      ["Partial repair discussions", "Some floors may need repair conversations alongside the finish review."],
      ["Homes wanting to keep original timber", "Relevant where keeping the existing timber character matters to the project."],
    ],
    includeHeading: "What the restoration service may include",
    includeIntro: "Sanding and polishing starts with judging the floor honestly, not promising that every damaged board can be brought back perfectly.",
    includeCards: [
      ["Floor condition review", "Assessing wear, board movement, staining, coating failure and visible repair areas."],
      ["Sanding suitability", "Reviewing whether the floor appears suitable for sanding based on usable timber and stability."],
      ["Finish and sheen direction", "Discussing the type of finish, sheen and maintenance expectations that suit the space."],
      ["Repair or replacement advice", "Explaining when partial repairs or full replacement may be more practical than restoration."],
      ["Preparation planning", "Reviewing furniture, access and how the space will be managed during the work."],
    ],
    siteHeading: "Site details that can affect the quote",
    siteIntro: "The best sanding advice usually comes from photos and a realistic description of what the current floor is like.",
    siteCards: [
      ["Timber condition", "Water damage, movement, deep gouges or repeated past sanding can change suitability."],
      ["Previous coatings", "Old coatings and finish build-up can affect the sanding and finish pathway."],
      ["Repairs", "Missing boards, patch repairs and visible damage should be mentioned early."],
      ["Staining or finish preference", "If you want a certain look, it helps to say so from the start."],
      ["Access", "Furniture, room use and access can affect how the work is planned."],
      ["Drying or curing time", "The space may need some allowance after coating depending on the finish path discussed."],
    ],
    processHeading: "How the service enquiry works",
    processIntro: "Photos and a plain description of the floor condition usually help more than polished terminology here.",
    processSteps: [
      ["Send project details", "Share suburb, approximate area, photos, timber type if known and what you want the floor to look like."],
      ["Review the site requirements", "Oz Timber Floor checks whether restoration, repairs or replacement should be discussed."],
      ["Confirm scope", "Board condition, finish expectations, access and preparation are reviewed together."],
      ["Quote or next step", "You receive the right restoration, repair or replacement pathway for the project."],
    ],
    relatedHeading: "Related products and services",
    relatedIntro: "Restoration decisions often connect to solid timber, removal and new installation if the floor is no longer a good restoration candidate.",
    relatedCards: [
      ["Solid timber flooring", "Review traditional timber flooring when comparing restore versus replace decisions.", "/solid-timber-flooring-sydney/"],
      ["Projects", "See the kinds of flooring situations Oz Timber Floor helps assess before work starts.", "/projects/"],
      ["Timber flooring installation", "Plan a new floor if restoration is not the better outcome.", "/timber-flooring-installation-sydney/"],
      ["Contact", "Send photos if you want a practical opinion on sanding versus replacement.", "/contact/?enquiry=service&topic=sanding%20and%20polishing&source=timber-floor-sanding-and-polishing-sydney"],
    ],
    proofHeading: "Common project examples",
    proofIntro: "These are common restoration situations rather than named completed projects, but they reflect the kinds of enquiries that often come through.",
    proofCards: [
      ["Timber floor restoration review", "A common path where an older timber floor needs to be assessed for sanding, repairs or replacement.", "/contact/?enquiry=service&topic=timber%20restoration%20review&source=timber-floor-sanding-and-polishing-sydney", "Request similar quote"],
      ["Restore or replace decision", "Useful where the timber floor has wear, stains or movement and the next step needs a realistic review.", "/contact/?enquiry=service&topic=restore%20or%20replace&source=timber-floor-sanding-and-polishing-sydney", "Ask about restoration"],
    ],
    faqHeading: "Questions about sanding and polishing",
    faqIntro: "These answers help customers judge whether an existing timber floor is worth restoring before planning the next step.",
    faqs: [
      ["Can every timber floor be sanded and polished?", "No. The boards need enough usable thickness and must be stable enough to sand. Severe water damage, deep staining, movement or repeated past sanding may make replacement more practical."],
      ["Will sanding remove all marks and stains?", "Not always. Surface wear often improves, but deep stains, pet damage, water marks and colour variation may remain or require board repairs."],
      ["Can you advise whether to restore or replace?", "Yes. Send photos, the age of the floor if known, the room area and the result you want. Oz can discuss whether sanding, partial repairs or replacement should be considered."],
      ["Do I need to move furniture before sanding?", "Access and furniture removal should be planned before work. Include photos and room details in the enquiry so the team can discuss preparation requirements."],
    ],
    finalHeading: "Want to restore an existing timber floor?",
    finalText: "Send photos, suburb, approximate area, timber type if known and whether the floor has deep scratches, stains, movement or old coating issues. Oz Timber Floor can help review the right next step.",
    finalButtons: [
      ["Request sanding quote", "/contact/?enquiry=service&topic=sanding%20and%20polishing&source=timber-floor-sanding-and-polishing-sydney"],
      ["Send photos", "/contact/?enquiry=service&topic=sanding%20photos&source=timber-floor-sanding-and-polishing-sydney"],
      ["View projects", "/projects/"],
    ],
  },
  "commercial-flooring-sydney/index.html": {
    canonical: "https://oztimberfloor.com.au/commercial-flooring-sydney/",
    title: "Commercial Flooring Installation Sydney | Timber, Hybrid & Vinyl",
    description:
      "Commercial flooring installation Sydney for engineered timber, hybrid and vinyl floors with staged installation, floor levelling, access planning and commercial handover support.",
    serviceName: "Commercial flooring installation Sydney",
    heroEyebrow: "Commercial flooring Sydney",
    heroH1: "Commercial flooring installation Sydney",
    heroLead:
      "Oz Timber Floor helps offices, retail, hospitality, medical suites and managed fit-out projects plan flooring supply, preparation, staging and installation with practical site coordination.",
    heroImage: "/assets/images/products/engineered/engineered-blackbutt-rustic.jpg",
    heroAlt: "Commercial flooring installation in a Sydney fit-out project",
    badges: ["Supply", "Install", "Managed sites"],
    primaryCta: { label: "Request commercial quote", href: "/contact/?enquiry=builder-commercial&source=commercial-flooring-sydney" },
    secondaryCta: { label: "Send project details", href: "/contact/?enquiry=service&topic=commercial%20project%20details&source=commercial-flooring-sydney" },
    decisionHeading: "What do you need help with?",
    decisionIntro: "Commercial flooring enquiries usually start with site type, access rules and the way the space needs to operate during or after the work.",
    decisionCards: [
      { title: "Office or medical suite", text: "For workspaces that need presentation, durability and a managed installation path.", href: "/office-flooring-sydney/", label: "View office flooring" },
      { title: "Staged installation", text: "For projects needing after-hours work, staged areas or tenancy coordination.", href: "/contact/?enquiry=builder-commercial&topic=staged%20installation&source=commercial-flooring-sydney", label: "Ask about staging" },
      { title: "Floor preparation", text: "Commercial flooring often depends on substrate review, levelling and access planning first.", href: "/floor-levelling-sydney/", label: "Review preparation" },
      { title: "Product comparison", text: "Hybrid, vinyl and engineered timber all suit different commercial briefs.", href: "/products/", label: "Browse flooring products" },
    ],
    whatHeading: "When commercial flooring support is useful",
    whatIntro: "This service fits sites where product choice, access and staging need to be coordinated instead of treated as separate problems.",
    whatCards: [
      ["Office and medical suite upgrades", "Useful where presentation, cleaning and daily staff or visitor use all matter."],
      ["Retail, hospitality and showroom floors", "Relevant where public traffic and fit-out finish both influence the flooring path."],
      ["Property manager and managed sites", "Helpful when access rules, timing and communication need one flooring contact."],
      ["Builder-managed fitouts", "Works well where staging, alternatives and handover timing should be kept aligned."],
      ["Commercial replacement flooring", "Useful when the old floor is being removed and the new one needs careful sequencing."],
      ["After-hours installation planning", "Relevant where the site needs to keep operating around the flooring program."],
    ],
    includeHeading: "What commercial flooring may include",
    includeIntro: "Commercial work often involves product advice, preparation and site coordination rather than installation in isolation.",
    includeCards: [
      ["Commercial flooring options", "Reviewing engineered timber, hybrid, vinyl or laminate options to suit the site brief."],
      ["Floor preparation", "Planning floor levelling, concrete grinding, removal or substrate preparation before installation."],
      ["Staged installation", "Working around after-hours windows, access restrictions and staged areas where needed."],
      ["Handover planning", "Keeping scope, product alternatives and practical handover notes clearer for all stakeholders."],
      ["Access coordination", "Considering deliveries, lifts, protection and building rules before work begins."],
    ],
    siteHeading: "Site details that can affect the quote",
    siteIntro: "Commercial flooring quotes usually depend on how the site operates, not just the square metres and flooring category.",
    siteCards: [
      ["Staging", "Some projects need staged installation to keep parts of the space operating."],
      ["Site readiness", "Substrate condition, existing floor removal and other trades can affect timing."],
      ["Handover timing", "Deadlines and occupancy dates can shape the installation program."],
      ["Access", "Lift bookings, work hours, parking and tenancy rules often matter more on commercial sites."],
      ["After-hours requirements", "Some sites need work outside trading or normal office hours."],
      ["Product suitability", "Traffic, cleaning, acoustic comfort and presentation all influence the flooring path."],
      ["Coordination with other trades", "Fit-out sequencing can affect when flooring should start and finish."],
    ],
    processHeading: "How the service enquiry works",
    processIntro: "A good commercial enquiry usually makes the site conditions and operating constraints visible from the start.",
    processSteps: [
      ["Send project details", "Share site type, suburb, approximate area, access rules, preferred product and timing."],
      ["Review the site requirements", "Oz Timber Floor checks product fit, preparation, staging and access considerations."],
      ["Confirm scope", "Removal, levelling, installation sequence and handover expectations are reviewed together."],
      ["Quote or next step", "You receive the right commercial supply, preparation or installation pathway."],
    ],
    relatedHeading: "Related products and services",
    relatedIntro: "Commercial flooring usually connects straight into office-specific planning, preparation and the product categories being compared.",
    relatedCards: [
      ["Office flooring", "Go deeper on workspaces, studios and managed office interiors.", "/office-flooring-sydney/"],
      ["Hybrid flooring", "Compare practical timber-look options often used in busy interiors.", "/hybrid-flooring-sydney/"],
      ["Vinyl flooring", "Review durable low-maintenance options for selected commercial spaces.", "/vinyl-flooring-sydney/"],
      ["Floor levelling", "Preparation often decides whether the commercial flooring path is realistic.", "/floor-levelling-sydney/"],
      ["Builder flooring contractor", "Useful where the site is builder-managed or staged through other trades.", "/builder-flooring-contractor-sydney/"],
    ],
    proofHeading: "Common project examples",
    proofIntro: "These are common commercial site pathways rather than named completed projects, but they reflect the types of enquiries often handled.",
    proofCards: [
      ["Office flooring with staged installation", "A commercial path where access, timing and product choice need to be balanced against business operations.", "/contact/?enquiry=builder-commercial&topic=office%20staged%20installation&source=commercial-flooring-sydney", "Request similar quote"],
      ["Preparation before commercial timber flooring", "Useful where levelling, substrate condition and handover timing need to be reviewed before a premium finish is installed.", "/contact/?enquiry=builder-commercial&topic=commercial%20floor%20preparation&source=commercial-flooring-sydney", "Ask about preparation"],
    ],
    faqHeading: "Questions about commercial flooring",
    faqIntro: "These answers help commercial clients prepare a clearer scope before site inspection or specification review.",
    faqs: [
      ["What types of commercial flooring does Oz Timber Floor install in Sydney?", "Oz Timber Floor can discuss engineered timber, hybrid, vinyl, laminate and selected timber flooring options for offices, retail, hospitality venues, medical suites, showrooms and builder-managed commercial projects."],
      ["Can commercial flooring be staged after hours?", "Often yes. Access planning, delivery timing, building rules, after-hours work windows and protection requirements should be discussed before finalising the program."],
      ["Does commercial flooring need floor levelling first?", "Many commercial projects do. Floor levelling, patching, concrete grinding or substrate preparation may be needed before the final flooring choice is installed."],
      ["What should be included in a commercial flooring enquiry?", "Include the project type, suburb, approximate area, preferred product, access rules, timing, site condition and whether supply-only or supply plus installation is required."],
    ],
    finalHeading: "Need flooring support for a managed project?",
    finalText: "Share the suburb, site type, approximate area, preferred product, access rules and whether the scope needs supply-only, floor levelling or full installation. Oz Timber Floor can help confirm the right commercial pathway.",
    finalButtons: [
      ["Request commercial quote", "/contact/?enquiry=builder-commercial&source=commercial-flooring-sydney"],
      ["Send project details", "/contact/?enquiry=service&topic=commercial%20project%20details&source=commercial-flooring-sydney"],
      ["Contact Oz Timber Floor", "/contact/"],
    ],
  },
  "office-flooring-sydney/index.html": {
    canonical: "https://oztimberfloor.com.au/office-flooring-sydney/",
    title: "Office Flooring Sydney | Oz Timber Floor",
    description:
      "Office flooring Sydney for durable timber, hybrid, laminate and vinyl floors with commercial scheduling and preparation support.",
    serviceName: "Office flooring for durable, professional Sydney workspaces",
    heroEyebrow: "Office flooring Sydney",
    heroH1: "Office flooring Sydney",
    heroLead:
      "Office floors need to look professional, handle daily use and be installed with minimal disruption to the business. Oz Timber Floor can help review product choice, preparation and staging before work starts.",
    heroImage: "/assets/images/products/hybrid/hybrid-natural-oak.jpg",
    heroAlt: "Office flooring options for a professional Sydney workspace",
    badges: ["Supply", "Install", "Office fit-outs"],
    primaryCta: { label: "Request office flooring quote", href: "/contact/?enquiry=supply-install&source=office-flooring-sydney" },
    secondaryCta: { label: "Send project details", href: "/contact/?enquiry=service&topic=office%20flooring%20details&source=office-flooring-sydney" },
    decisionHeading: "What do you need help with?",
    decisionIntro: "Office flooring enquiries often start with access, timing and the kind of workspace the floor has to serve.",
    decisionCards: [
      { title: "Occupied office upgrade", text: "For projects that need to work around staff, visitors or staged access.", href: "/contact/?enquiry=supply-install&topic=occupied%20office%20upgrade&source=office-flooring-sydney", label: "Ask about office upgrades" },
      { title: "Floor preparation", text: "Uneven subfloors, old finishes and transitions can affect the installation path.", href: "/floor-levelling-sydney/", label: "Review preparation" },
      { title: "Product comparison", text: "Hybrid, vinyl, laminate and engineered timber all suit different office briefs.", href: "/products/", label: "Browse flooring products" },
      { title: "Supply + install", text: "If you need the full office flooring pathway, Oz can review supply, preparation and installation together.", href: "/contact/?enquiry=supply-install&source=office-flooring-sydney", label: "Request supply + install quote" },
    ],
    whatHeading: "When office flooring support is useful",
    whatIntro: "This service fits office projects where product selection, preparation and business operations need to be kept in the same conversation.",
    whatCards: [
      ["Office fit-outs", "Useful for office interiors where presentation, access and timing all matter."],
      ["Studios and workspaces", "Relevant where the flooring needs to suit regular use without overcomplicating maintenance."],
      ["Medical suites", "Helpful for business spaces where finish, cleaning and coordination all matter."],
      ["Occupied workplace upgrades", "Useful when parts of the space need to stay operational during the project."],
      ["After-hours or staged work", "Relevant where installation must work around access windows and building rules."],
      ["Replacement flooring after wear", "Helpful when the old office floor needs to be removed or reviewed before the next step."],
    ],
    includeHeading: "What office flooring may include",
    includeIntro: "Office work often combines product advice, floor preparation and installation planning rather than a simple one-step install.",
    includeCards: [
      ["Product selection", "Reviewing hybrid, laminate, vinyl and selected engineered timber options for the workspace."],
      ["Floor preparation", "Checking the substrate, transitions and whether levelling should be reviewed first."],
      ["Installation timing", "Planning around staff access, after-hours work and staged areas."],
      ["Site coordination", "Working with office managers, fit-out teams and building requirements where needed."],
      ["Replacement planning", "Linking removal, preparation and installation where the old floor is no longer fit for purpose."],
    ],
    siteHeading: "Site details that can affect the quote",
    siteIntro: "Office flooring quotes depend on the way the workspace is used, not just the area and flooring type.",
    siteCards: [
      ["Traffic and cleaning", "Daily use and maintenance expectations can affect the best product choice."],
      ["Current floor condition", "Old adhesives, uneven areas and worn surfaces can change the preparation path."],
      ["Access and occupancy", "Lift bookings, work hours, occupancy and building rules often shape the sequence."],
      ["Staged timing", "Some office projects need the work broken into sections to keep operations moving."],
      ["Product suitability", "The right floor depends on visual finish, maintenance and how the space works day to day."],
      ["Subfloor readiness", "Levelling or removal may need to be reviewed before the final flooring choice is installed."],
    ],
    processHeading: "How the service enquiry works",
    processIntro: "A good office flooring enquiry usually includes the workspace type, timing and whether the office will stay occupied during the job.",
    processSteps: [
      ["Send project details", "Share suburb, approximate area, current floor, preferred product and timing."],
      ["Review the site requirements", "Oz Timber Floor checks product fit, preparation, access and staging needs."],
      ["Confirm scope", "Removal, levelling, installation timing and the business impact are reviewed together."],
      ["Quote or next step", "You receive the right office flooring supply, preparation or installation pathway."],
    ],
    relatedHeading: "Related products and services",
    relatedIntro: "Office flooring usually connects to commercial planning, product categories and floor preparation before the quote is finalised.",
    relatedCards: [
      ["Commercial flooring", "Review broader commercial flooring support for managed sites and fit-outs.", "/commercial-flooring-sydney/"],
      ["Hybrid flooring", "Compare practical timber-look options often considered for office interiors.", "/hybrid-flooring-sydney/"],
      ["Vinyl flooring", "Review practical low-maintenance options for selected office spaces.", "/vinyl-flooring-sydney/"],
      ["Floor levelling", "Preparation may need to be reviewed before the office flooring is installed.", "/floor-levelling-sydney/"],
    ],
    proofHeading: "Common project examples",
    proofIntro: "These are common office flooring pathways rather than named completed projects, but they reflect the kinds of enquiries often handled.",
    proofCards: [
      ["Occupied office flooring upgrade", "A common pathway where staging, access and product choice need to be balanced against day-to-day business use.", "/contact/?enquiry=supply-install&topic=occupied%20office%20upgrade&source=office-flooring-sydney", "Request similar quote"],
      ["Office flooring after preparation review", "Useful where uneven floors or old finishes need to be checked before a new office floor is installed.", "/contact/?enquiry=service&topic=office%20floor%20preparation&source=office-flooring-sydney", "Ask about preparation"],
    ],
    faqHeading: "Questions about office flooring",
    faqIntro: "These answers help office clients prepare a clearer enquiry before product selection or site review.",
    faqs: [
      ["What flooring works best for offices?", "That depends on traffic, cleaning expectations, acoustic needs, visual finish and whether the office is occupied during the work. Hybrid, vinyl, laminate and engineered timber can all suit different office projects."],
      ["Can office flooring be installed in stages?", "Often yes. Staged installation can help with occupied offices, after-hours work, lift access and keeping parts of the workspace operating during the project."],
      ["Does office flooring need floor levelling first?", "Many office projects do. Floor flatness, substrate condition, old adhesives and transition heights should be checked before final product selection and installation."],
      ["What should I include in an office flooring enquiry?", "Include the suburb, approximate area, current floor, preferred product, access rules, timing and whether you need supply-only or supply plus installation support."],
    ],
    finalHeading: "Need help with office flooring?",
    finalText: "Share the suburb, approximate area, current floor, preferred product and whether you need supply-only, installation, preparation or commercial scheduling support. Oz Timber Floor can help confirm the right office flooring path.",
    finalButtons: [
      ["Request office flooring quote", "/contact/?enquiry=supply-install&source=office-flooring-sydney"],
      ["Send project details", "/contact/?enquiry=service&topic=office%20flooring%20details&source=office-flooring-sydney"],
      ["Contact Oz Timber Floor", "/contact/"],
    ],
  },
  "builder-flooring-contractor-sydney/index.html": {
    canonical: "https://oztimberfloor.com.au/builder-flooring-contractor-sydney/",
    title: "Builder Flooring Contractor Sydney | Supply, Install & Levelling",
    description:
      "Builder flooring contractor Sydney for flooring supply, floor levelling, staged installation, commercial handover and product alternatives for build sites.",
    serviceName: "Flooring contractor support for Sydney builders and site managers",
    heroEyebrow: "Builder flooring contractor Sydney",
    heroH1: "Builder flooring contractor Sydney",
    heroLead:
      "Oz Timber Floor supports builders, site managers and fit-out teams with flooring supply, preparation, staging and installation planning that fits the site program and handover timing.",
    heroImage: "/assets/images/hero/sydney-timber-flooring-contractor.jpg",
    heroAlt: "Builder flooring contractor support on a Sydney site",
    badges: ["Supply", "Install", "Builder support"],
    primaryCta: { label: "Request builder flooring quote", href: "/contact/?enquiry=supply-install&source=builder-flooring-contractor-sydney" },
    secondaryCta: { label: "Send project details", href: "/contact/?enquiry=service&topic=builder%20project%20details&source=builder-flooring-contractor-sydney" },
    decisionHeading: "What do you need help with?",
    decisionIntro: "Builder-managed flooring projects usually start with product, timing and site-readiness questions rather than just a product shortlist.",
    decisionCards: [
      { title: "Builder-managed installation", text: "For projects that need one flooring contact across supply, preparation and install timing.", href: "/contact/?enquiry=supply-install&source=builder-flooring-contractor-sydney", label: "Request builder quote" },
      { title: "Subfloor preparation", text: "Levelling, removal and slab readiness often affect the flooring sequence.", href: "/floor-levelling-sydney/", label: "Review preparation" },
      { title: "Product alternatives", text: "If the specified product changes, Oz can help review close alternatives that still suit the site.", href: "/products/", label: "Browse flooring products" },
      { title: "Commercial fit-out support", text: "Some builder projects overlap with commercial staging, access and handover planning.", href: "/commercial-flooring-sydney/", label: "View commercial flooring" },
    ],
    whatHeading: "When builder flooring support is useful",
    whatIntro: "This service fits projects where the flooring package has to be coordinated around the wider site program, not treated as a separate late-stage trade.",
    whatCards: [
      ["Residential builds", "Useful for new homes, duplexes, extensions and renovation sites needing coordinated flooring supply and install."],
      ["Multi-stage projects", "Helpful where the flooring needs to follow other trades and staged handover areas."],
      ["Commercial fit-outs", "Relevant where builder-managed office, retail or hospitality work needs flooring coordination."],
      ["Product changes mid-program", "Useful when the original flooring specification changes and practical alternatives are needed."],
      ["Preparation-led projects", "Helpful where levelling, removal or substrate readiness affects whether flooring can start."],
      ["Handover-focused work", "Relevant when final finish, protection and timing need to stay aligned with the build schedule."],
    ],
    includeHeading: "What builder flooring support may include",
    includeIntro: "Builder flooring work usually involves timing, preparation and communication as much as the flooring itself.",
    includeCards: [
      ["Supply + install coordination", "Reviewing product supply, access and installation in one managed path."],
      ["Subfloor checks", "Checking whether floor levelling or preparation should be reviewed before final flooring."],
      ["Staged installation", "Planning around other trades, access windows and handover areas."],
      ["Product alternatives", "Discussing close substitutes where lead time, availability or site conditions change."],
      ["Documentation and scope clarity", "Keeping the flooring areas, assumptions and next steps clearer for site teams."],
    ],
    siteHeading: "Site details that can affect the quote",
    siteIntro: "Builder flooring quotes usually depend on the stage of the site and the amount of coordination needed, not just the floor area.",
    siteCards: [
      ["Staging", "Some projects need the flooring split across multiple areas or handover stages."],
      ["Site readiness", "Slab condition, other trades and substrate preparation can affect when flooring starts."],
      ["Handover timing", "Move-in dates, builder deadlines and practical completion all matter."],
      ["Access", "Parking, lifts, site rules and delivery access can change the sequence."],
      ["After-hours requirements", "Managed sites sometimes need the flooring program to work around restricted hours."],
      ["Product suitability", "The right flooring still depends on the use of the room and the substrate underneath."],
      ["Coordination with other trades", "Flooring often depends on joinery, painting, skirting, doors and other finishes being ready."],
    ],
    processHeading: "How the service enquiry works",
    processIntro: "A strong builder enquiry gives enough detail to review product, preparation and program together instead of separately.",
    processSteps: [
      ["Send project details", "Share suburb, site stage, floor areas, drawings if available, preferred product and timing."],
      ["Review the site requirements", "Oz Timber Floor checks supply, preparation, access and installation sequencing."],
      ["Confirm scope", "Product fit, alternatives, levelling, removal and handover timing are reviewed together."],
      ["Quote or next step", "You receive the right builder flooring supply, preparation or installation pathway."],
    ],
    relatedHeading: "Related products and services",
    relatedIntro: "Builder flooring projects usually connect straight into preparation, commercial planning and the product categories under consideration.",
    relatedCards: [
      ["Commercial flooring", "Useful where the site overlaps with commercial access or fit-out needs.", "/commercial-flooring-sydney/"],
      ["Floor levelling", "Preparation often decides whether the flooring stage can start on time.", "/floor-levelling-sydney/"],
      ["Timber flooring installation", "Review the installation path once the build stage and product are clearer.", "/timber-flooring-installation-sydney/"],
      ["Projects", "See the kinds of flooring situations Oz Timber Floor helps assess before quoting.", "/projects/"],
      ["Contact", "Send drawings, timing and site details if the flooring scope needs review now.", "/contact/?enquiry=service&topic=builder%20project%20details&source=builder-flooring-contractor-sydney"],
    ],
    proofHeading: "Common project examples",
    proofIntro: "These are common builder-managed flooring pathways rather than named completed projects, but they reflect the kinds of scopes often reviewed.",
    proofCards: [
      ["Builder-managed flooring handover", "A common path where supply, preparation and staged installation need to stay aligned with the wider site program.", "/contact/?enquiry=supply-install&topic=builder%20handover&source=builder-flooring-contractor-sydney", "Request similar quote"],
      ["Product alternative review", "Useful where the original flooring choice changes and a close substitute still needs to fit the program and site.", "/contact/?enquiry=service&topic=builder%20product%20alternative&source=builder-flooring-contractor-sydney", "Ask about alternatives"],
    ],
    faqHeading: "Questions about builder flooring contractor support",
    faqIntro: "These answers help site teams prepare a more useful flooring brief before drawings, products or timing are locked in.",
    faqs: [
      ["Can Oz Timber Floor work from builder drawings or schedules?", "Yes. Send drawings, room schedules, floor areas, preferred product and site timing so the flooring scope can be discussed clearly."],
      ["Can you help when the specified product is unavailable?", "Oz can discuss close alternatives based on category, colour direction, construction, lead time and whether the project needs supply-only or supply + install."],
      ["Do builder projects need floor levelling first?", "Many do. Slab flatness, moisture, old adhesives and transition heights should be checked before final flooring, especially for hybrid, laminate, vinyl and engineered timber."],
      ["What should a builder enquiry include?", "Include suburb, site stage, approximate square metres, floor plans if available, preferred product, access notes, required timing and whether preparation or removal is needed."],
    ],
    finalHeading: "Need flooring support for a managed project?",
    finalText: "Share the site location, project stage, floor areas, preferred product, timing and any known preparation requirements. Oz Timber Floor can help review the right builder flooring path before quoting.",
    finalButtons: [
      ["Request builder flooring quote", "/contact/?enquiry=supply-install&source=builder-flooring-contractor-sydney"],
      ["Send project details", "/contact/?enquiry=service&topic=builder%20project%20details&source=builder-flooring-contractor-sydney"],
      ["Contact Oz Timber Floor", "/contact/"],
    ],
  },
};

function faqSchema(faqs) {
  return {
    "@type": "FAQPage",
    "@id": "",
    mainEntity: faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function buildLdJson(page, data) {
  const pageName = data.title;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://oztimberfloor.com.au/#business",
        name: "Oz Timber Floor",
        url: "https://oztimberfloor.com.au/",
        areaServed: { "@type": "City", name: "Sydney" },
        description:
          "Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist.",
      },
      {
        "@type": "WebPage",
        "@id": `${data.canonical}#webpage`,
        url: data.canonical,
        name: pageName,
        description: data.description,
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://oztimberfloor.com.au/#website",
          name: "Oz Timber Floor",
          url: "https://oztimberfloor.com.au/",
        },
        about: { "@id": "https://oztimberfloor.com.au/#business" },
      },
      {
        "@type": "Service",
        "@id": `${data.canonical}#service`,
        name: data.serviceName,
        description: data.description,
        provider: { "@id": "https://oztimberfloor.com.au/#business" },
        areaServed: { "@type": "City", name: "Sydney" },
        url: data.canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://oztimberfloor.com.au/" },
          { "@type": "ListItem", position: 2, name: "Services", item: "https://oztimberfloor.com.au/services/" },
          { "@type": "ListItem", position: 3, name: data.serviceName, item: data.canonical },
        ],
      },
      {
        ...faqSchema(data.faqs),
        "@id": `${data.canonical}#faq`,
      },
    ],
  };
}

function sectionHead(eyebrow, heading, intro = "") {
  return `<div class="section-head"><div><p class="eyebrow">${eyebrow}</p><h2>${heading}</h2></div>${intro ? `<p>${intro}</p>` : ""}</div>`;
}

function cardGrid(cards, className = "grid-4", mapper) {
  return `<div class="${className}">${cards.map(mapper).join("")}</div>`;
}

function buildMain(data) {
  const decisionCards = cardGrid(
    data.decisionCards,
    "grid-4",
    (card) =>
      `<article class="category-card"><strong>${card.title}</strong><p>${card.text}</p><a class="card-link" href="${card.href}">${card.label}</a></article>`
  );

  const whatCards = cardGrid(
    data.whatCards,
    "grid-3",
    ([title, text]) =>
      `<article class="card"><h3>${title}</h3><p>${text}</p></article>`
  );

  const includeCards = cardGrid(
    data.includeCards,
    "scope-grid",
    ([title, text], index) => {
      const labels = ["Review", "Prepare", "Plan", "Confirm", "Support"];
      return `<article class="scope-card"><span class="insight-label">${labels[index % labels.length]}</span><h3>${title}</h3><p>${text}</p></article>`;
    }
  );

  const siteCards = cardGrid(
    data.siteCards,
    "caution-grid",
    ([title, text], index) => {
      const labels = ["Check", "Review", "Plan", "Confirm", "Access", "Timing", "Match", "Prepare"];
      return `<article class="caution-card"><span class="insight-label">${labels[index % labels.length]}</span><h3>${title}</h3><p>${text}</p></article>`;
    }
  );

  const processCards = `<div class="process-steps">${data.processSteps
    .map(
      ([title, text], index) =>
        `<article class="process-step"><span class="insight-label">${index + 1}</span><h3>${title}</h3><p>${text}</p></article>`
    )
    .join("")}</div>`;

  const relatedCards = cardGrid(
    data.relatedCards,
    data.relatedCards.length > 4 ? "grid-3" : "grid-4",
    ([title, text, href]) =>
      `<article class="card"><h3>${title}</h3><p>${text}</p><a class="card-link" href="${href}">${href.includes("/contact") ? "Contact Oz Timber Floor" : `View ${title.toLowerCase()}`}</a></article>`
  );

  const proofCards = cardGrid(
    data.proofCards,
    "grid-2",
    ([title, text, href, label]) =>
      `<article class="card"><h3>${title}</h3><p>${text}</p><a class="card-link" href="${href}">${label}</a></article>`
  );

  const faqItems = `<div class="faq-list">${data.faqs
    .map(
      ([q, a]) =>
        `<details class="faq-item"><summary>${q}</summary><div><p>${a}</p></div></details>`
    )
    .join("")}</div>`;

  const finalButtons = `<div class="button-row">${data.finalButtons
    .map(([label, href], index) => {
      const cls = index === 0 ? "button-light" : "button-light";
      return `<a class="${cls}" href="${href}">${label}</a>`;
    })
    .join("")}</div>`;

  return `<main><section class="hero"><div class="shell hero-grid"><div><p class="eyebrow">${data.heroEyebrow}</p><h1>${data.heroH1}</h1><p class="lead">${data.heroLead}</p><div class="button-row"><a class="button" href="${data.primaryCta.href}">${data.primaryCta.label}</a><a class="button-secondary" href="${data.secondaryCta.href}">${data.secondaryCta.label}</a></div></div><div class="hero-media"><img src="${data.heroImage}" alt="${data.heroAlt}"><div class="hero-badge">${data.badges
    .map((badge) => `<span>${badge}</span>`)
    .join("")}</div></div></div></section><section class="section soft"><div class="shell">${sectionHead(
    "Start here",
    data.decisionHeading,
    data.decisionIntro
  )}${decisionCards}</div></section><section class="section"><div class="shell">${sectionHead(
    "Service overview",
    data.whatHeading,
    data.whatIntro
  )}${whatCards}</div></section><section class="section soft"><div class="shell">${sectionHead(
    "Scope",
    data.includeHeading,
    data.includeIntro
  )}${includeCards}</div></section><section class="section"><div class="shell">${sectionHead(
    "Site checks",
    data.siteHeading,
    data.siteIntro
  )}${siteCards}</div></section><section class="section soft"><div class="shell">${sectionHead(
    "Process",
    data.processHeading,
    data.processIntro
  )}${processCards}</div></section><section class="section"><div class="shell">${sectionHead(
    "Related pages",
    data.relatedHeading,
    data.relatedIntro
  )}${relatedCards}</div></section><section class="section soft"><div class="shell">${sectionHead(
    "Proof",
    data.proofHeading,
    data.proofIntro
  )}${proofCards}</div></section><section class="section" id="faqs"><div class="shell">${sectionHead(
    "FAQ",
    data.faqHeading,
    data.faqIntro
  )}${faqItems}</div></section><section class="section"><div class="shell cta"><p class="eyebrow">Talk to Oz Timber Floor</p><h2>${data.finalHeading}</h2><p>${data.finalText}</p>${finalButtons}</div></section></main>`;
}

for (const [file, data] of Object.entries(pages)) {
  const fullPath = path.join(root, file);
  const html = fs.readFileSync(fullPath, "utf8");
  const headerMatch = html.match(/<body>([\s\S]*?)<main>/);
  const footerMatch = html.match(/<\/main>([\s\S]*?)<\/body>/);
  if (!headerMatch || !footerMatch) {
    throw new Error(`Could not extract header/footer for ${file}`);
  }

  let rebuilt = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(buildLdJson(file, data))}</script>`);
  rebuilt = rebuilt.replace(/<main>[\s\S]*?<\/main>/, buildMain(data));
  fs.writeFileSync(fullPath, rebuilt);
}

console.log(`Rebuilt ${Object.keys(pages).length} service pages.`);
