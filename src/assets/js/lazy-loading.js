/**
 * Lazy Loading Enhancement
 * Adds loading="lazy" attribute to all images that don't have it
 * Also implements IntersectionObserver for better browser support
 */

(function() {
  'use strict';

  // Add loading="lazy" to all images that don't have it
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });

  // Fallback for browsers that don't support native lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Load data-src if available, otherwise use src
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // Mark as loaded
          img.classList.add('loaded');
          
          // Stop observing this image
          observer.unobserve(img);
        }
      });
    });

    // Observe all images
    document.querySelectorAll('img').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Ensure images have proper alt text for accessibility
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  imagesWithoutAlt.forEach(img => {
    // Try to generate alt text from nearby context
    const parent = img.closest('figure');
    if (parent) {
      const figcaption = parent.querySelector('figcaption');
      if (figcaption) {
        img.setAttribute('alt', figcaption.textContent);
      }
    }
    
    // Fallback: use filename
    if (!img.getAttribute('alt')) {
      const src = img.getAttribute('src') || '';
      const filename = src.split('/').pop().split('?')[0].split('.')[0];
      img.setAttribute('alt', filename.replace(/[-_]/g, ' '));
    }
  });
})();
