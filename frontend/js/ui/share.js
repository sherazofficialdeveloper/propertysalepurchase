/**
 * Share Property button: uses Web Share API when available,
 * otherwise copies the current URL to the clipboard.
 */
(function (global) {
  'use strict';

  async function share(property) {
    const url = location.href;
    const title = property ? property.title : document.title;
    const text = property ? `${property.title} — ${property.location}` : 'Check this property';

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Property link copied');
    } catch (err) {
      if (err && err.name === 'AbortError') return; // user cancelled
      // Final fallback
      try {
        await navigator.clipboard.writeText(url);
        toast('Property link copied');
      } catch (_) {
        toast('Unable to copy link');
      }
    }
  }

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 250);
    }, 1800);
  }

  global.ShareUI = { share, toast };
})(window);
