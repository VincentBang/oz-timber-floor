/* Progressive enhancement: all navigation is visible without JavaScript. */
(() => {
  "use strict";
  document.querySelectorAll('[data-oz-footer="v2"]').forEach(footer => {
    if (footer.dataset.footerReady === 'true') return;
    footer.dataset.footerReady = 'true';
    const mobile = window.matchMedia('(max-width: 760px)');
    const groups = [...footer.querySelectorAll('[data-footer-group]')].map(group => ({
      title: group.querySelector('[data-footer-title]'),
      button: group.querySelector('[data-footer-toggle]'),
      panel: group.querySelector('[data-footer-panel]'),
      expanded: false
    })).filter(group => group.title && group.button && group.panel);
    function render(group) {
      const toggleFocused = document.activeElement === group.button;
      if (mobile.matches && group.panel.contains(document.activeElement)) group.expanded = true;
      const expanded = !mobile.matches || group.expanded;
      group.title.hidden = mobile.matches;
      group.button.hidden = !mobile.matches;
      group.button.setAttribute('aria-expanded', String(expanded));
      group.button.querySelector('.ozf__toggle-icon').textContent = expanded ? '−' : '+';
      group.panel.hidden = !expanded;
      if (!mobile.matches && toggleFocused) group.panel.querySelector('a')?.focus({preventScroll:true});
    }
    groups.forEach(group => {
      group.button.addEventListener('click', () => {
        group.expanded = !group.expanded;
        render(group);
      });
      render(group);
    });
    const update = () => groups.forEach(render);
    if (mobile.addEventListener) mobile.addEventListener('change', update);
    else mobile.addListener(update);
    // Use real fixed-control geometry rather than a guessed mobile-dock height.
    let scheduled = false;
    function clearance() {
      scheduled = false;
      let pixels = 0;
      document.querySelectorAll('.mobile-sticky-cta,.mobile-context-dock,.analytics-consent-banner,.flooring-assistant-launcher,.oz-assistant-launcher').forEach(control => {
        const style = getComputedStyle(control), rect = control.getBoundingClientRect();
        if (control.hidden || control.getAttribute('aria-hidden') === 'true' || style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || !rect.width || !rect.height || rect.top >= innerHeight || rect.bottom <= 0) return;
        pixels = Math.max(pixels, Math.ceil(innerHeight - rect.top + 16));
      });
      const value = pixels + 'px';
      if (footer.style.getPropertyValue('--ozf-overlay-clearance') !== value) footer.style.setProperty('--ozf-overlay-clearance', value);
    }
    function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(clearance); } }
    ['scroll','resize','focusin','focusout'].forEach(event => window.addEventListener(event,schedule,{passive:true}));
    if (window.visualViewport) window.visualViewport.addEventListener('resize',schedule);
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});
    clearance();
  });
})();
