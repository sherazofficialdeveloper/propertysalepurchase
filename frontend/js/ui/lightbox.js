/**
 * Simple, accessible lightbox for property images.
 * Keyboard: Esc close, ArrowLeft prev, ArrowRight next.
 */
(function (global) {
  'use strict';

  let images = [];
  let index = 0;
  let onChange = null;
  let root = null;

  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.className = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Property image viewer');
    root.hidden = true;
    root.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Close viewer">&times;</button>
      <button type="button" class="lightbox-prev" aria-label="Previous image">&#8249;</button>
      <button type="button" class="lightbox-next" aria-label="Next image">&#8250;</button>
      <div class="lightbox-stage">
        <img alt="" />
      </div>
      <div class="lightbox-counter" aria-live="polite">0 / 0</div>
    `;
    document.body.appendChild(root);

    root.querySelector('.lightbox-close').addEventListener('click', close);
    root.querySelector('.lightbox-prev').addEventListener('click', () => step(-1));
    root.querySelector('.lightbox-next').addEventListener('click', () => step(1));
    root.addEventListener('click', (e) => { if (e.target === root) close(); });
    document.addEventListener('keydown', onKey);
    return root;
  }

  function onKey(e) {
    if (!root || root.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  }

  function draw() {
    const img = root.querySelector('img');
    const counter = root.querySelector('.lightbox-counter');
    img.src = images[index];
    img.alt = `Property image ${index + 1} of ${images.length}`;
    counter.textContent = `${index + 1} / ${images.length}`;
    root.querySelector('.lightbox-prev').disabled = images.length <= 1;
    root.querySelector('.lightbox-next').disabled = images.length <= 1;
  }

  function step(dir) {
    if (images.length <= 1) return;
    index = (index + dir + images.length) % images.length;
    draw();
    if (onChange) onChange(index);
  }

  function open(list, startIndex, cb) {
    if (!list || !list.length) return;
    images = list.slice();
    index = Math.max(0, Math.min(startIndex || 0, images.length - 1));
    onChange = cb || null;
    ensureRoot();
    draw();
    root.hidden = false;
    document.body.classList.add('no-scroll');
    root.querySelector('.lightbox-close').focus();
  }

  function close() {
    if (!root) return;
    root.hidden = true;
    document.body.classList.remove('no-scroll');
    onChange = null;
  }

  global.LightboxUI = { open, close };
})(window);
