/**
 * Simple accessible accordion.
 * Usage: <button class="faq-q" aria-expanded="false" aria-controls="faq-1">...</button>
 *        <div class="faq-a" id="faq-1" hidden>...</div>
 * Behavior: only one open at a time (single-open accordion).
 */
(function (global) {
  'use strict';

  function init(rootSelector) {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const buttons = root.querySelectorAll('.faq-q');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('aria-controls');
        const target = document.getElementById(targetId);
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Close all
        buttons.forEach((b) => {
          b.setAttribute('aria-expanded', 'false');
          const t = document.getElementById(b.getAttribute('aria-controls'));
          if (t) t.hidden = true;
        });

        // Toggle current
        if (!isOpen && target) {
          btn.setAttribute('aria-expanded', 'true');
          target.hidden = false;
        }
      });
    });
  }

  global.AccordionUI = { init };
})(window);
