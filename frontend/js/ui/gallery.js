/**
 * Property image gallery with thumbnail selection.
 */
(function (global) {
  'use strict';

  let currentImages = [];
  let currentIndex = 0;

  function mount(images, initialIndex = 0) {
    currentImages = Array.isArray(images) && images.length ? images : [];
    currentIndex = Math.max(0, Math.min(initialIndex, currentImages.length - 1));
    render();
  }

  function render() {
    const main = document.getElementById('galleryMain');
    const thumbs = document.getElementById('galleryThumbs');
    if (!main || !thumbs) return;

    if (!currentImages.length) {
      main.innerHTML = '<div class="gallery-empty">No images available</div>';
      thumbs.innerHTML = '';
      return;
    }

    const active = currentImages[currentIndex];
    main.innerHTML = `
      <button type="button" class="gallery-main-btn" aria-label="Open image viewer">
        <img src="${active}" alt="Property image ${currentIndex + 1} of ${currentImages.length}" />
      </button>
      <span class="gallery-counter">${currentIndex + 1} / ${currentImages.length}</span>
    `;
    main.querySelector('.gallery-main-btn').addEventListener('click', () => {
      global.LightboxUI.open(currentImages, currentIndex, (newIndex) => {
        currentIndex = newIndex;
        render();
      });
    });

    thumbs.innerHTML = currentImages.map((src, i) => `
      <button type="button" class="gallery-thumb${i === currentIndex ? ' is-active' : ''}" data-index="${i}" aria-label="Show image ${i + 1}">
        <img src="${src}" alt="Thumbnail ${i + 1}" loading="lazy" />
      </button>
    `).join('');

    thumbs.querySelectorAll('.gallery-thumb').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentIndex = Number(btn.dataset.index);
        render();
      });
    });
  }

  global.GalleryUI = { mount };
})(window);
