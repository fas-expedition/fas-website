/**
 * Gallery Modal Handler
 * Manages opening, closing, and navigation through vehicle image galleries
 */

class VehicleGallery {
  constructor() {
    this.currentGalleryId = null;
    this.currentImageIndex = 0;
    this.initialized = false;
    this.init();
  }

  init() {
    // Only initialize once
    if (this.initialized) return;
    
    // Wait for all images to load before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.attachAll());
    } else {
      // If DOM is already loaded, use a small timeout to ensure all elements are ready
      setTimeout(() => this.attachAll(), 0);
    }
  }

  attachAll() {
    if (this.initialized) return;
    
    try {
      this.attachGalleryTriggers();
      this.attachThumbGalleryTriggers();
      this.attachCloseButtons();
      this.attachNavigationButtons();
      this.attachThumbnailButtons();
      this.attachKeyboardNavigation();
      this.attachBackdropClose();
      
      this.initialized = true;
      console.log('Gallery initialized successfully');
    } catch (error) {
      console.error('Error initializing gallery:', error);
      // Try again in 500ms
      setTimeout(() => this.attachAll(), 500);
    }
  }

  attachGalleryTriggers() {
    document.querySelectorAll('[data-gallery-trigger]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const galleryId = trigger.dataset.galleryTrigger;
        this.openGallery(galleryId);
      });
    });
  }

  attachThumbGalleryTriggers() {
    document.querySelectorAll('[data-thumb-gallery]').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.preventDefault();
        const galleryId = thumb.dataset.thumbGallery;
        const imageIndex = parseInt(thumb.dataset.thumbIndex);
        this.openGallery(galleryId, imageIndex);
      });
    });
  }

  attachCloseButtons() {
    document.querySelectorAll('.gallery-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const galleryId = btn.dataset.galleryId;
        this.closeGallery(galleryId);
      });
    });
  }

  attachNavigationButtons() {
    document.querySelectorAll('.gallery-prev').forEach(btn => {
      btn.addEventListener('click', () => {
        const galleryId = btn.dataset.galleryId;
        this.previousImage(galleryId);
      });
    });

    document.querySelectorAll('.gallery-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const galleryId = btn.dataset.galleryId;
        this.nextImage(galleryId);
      });
    });
  }

  attachThumbnailButtons() {
    document.querySelectorAll('.gallery-thumbnail').forEach(btn => {
      btn.addEventListener('click', () => {
        const galleryId = btn.dataset.galleryId;
        const index = parseInt(btn.dataset.index);
        this.showImage(galleryId, index);
      });
    });
  }

  attachKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (!this.currentGalleryId) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.previousImage(this.currentGalleryId);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.nextImage(this.currentGalleryId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeGallery(this.currentGalleryId);
      }
    });
  }

  attachBackdropClose() {
    document.querySelectorAll('.gallery-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          const galleryId = modal.id.replace('gallery-', '');
          this.closeGallery(galleryId);
        }
      });
    });
  }

  openGallery(galleryId, startIndex = 0) {
    const modal = document.getElementById(`gallery-${galleryId}`);
    if (!modal) return;

    this.currentGalleryId = galleryId;
    this.currentImageIndex = startIndex;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Show specified image
    this.showImage(galleryId, startIndex);
  }

  closeGallery(galleryId) {
    const modal = document.getElementById(`gallery-${galleryId}`);
    if (!modal) return;

    modal.classList.add('hidden');
    document.body.style.overflow = '';
    this.currentGalleryId = null;
  }

  showImage(galleryId, index) {
    const thumbnails = document.querySelectorAll(`#gallery-thumbnails-${galleryId} .gallery-thumbnail`);
    if (thumbnails.length === 0) return;

    // Wrap index
    this.currentImageIndex = (index + thumbnails.length) % thumbnails.length;

    // Get image data from the thumbnail
    const thumbnail = thumbnails[this.currentImageIndex];
    const img = thumbnail.querySelector('img');
    const imageAlt = img.alt;

    // Pick the largest available image from srcset so the modal shows full resolution.
    // img.src only returns the currently-displayed (small) thumbnail URL.
    const imageUrl = getLargestSrcsetUrl(img) || img.src;

    // Update main image
    const mainImage = document.getElementById(`gallery-image-${galleryId}`);
    mainImage.src = imageUrl;
    mainImage.alt = imageAlt;

    // Update thumbnail selection
    thumbnails.forEach((thumb, i) => {
      if (i === this.currentImageIndex) {
        thumb.classList.add('border-white');
        thumb.classList.remove('border-transparent');
      } else {
        thumb.classList.remove('border-white');
        thumb.classList.add('border-transparent');
      }
    });

    // Update counter
    const counter = document.getElementById(`gallery-counter-${galleryId}`);
    if (counter) {
      counter.textContent = `${this.currentImageIndex + 1} / ${thumbnails.length}`;
    }
  }

  previousImage(galleryId) {
    this.showImage(galleryId, this.currentImageIndex - 1);
  }

  nextImage(galleryId) {
    this.showImage(galleryId, this.currentImageIndex + 1);
  }
}

// Initialize when DOM is ready
let galleryInstance = null;

function initializeGallery() {
  if (!galleryInstance || !galleryInstance.initialized) {
    galleryInstance = new VehicleGallery();
  }
  return galleryInstance;
}

/**
 * Parse an img element's srcset and return the URL of the largest (widest) entry.
 * Falls back to null if srcset is absent or unparseable.
 */
function getLargestSrcsetUrl(img) {
  const srcset = img.getAttribute('srcset');
  if (!srcset) return null;

  const entries = srcset.split(',')
    .map(s => s.trim().split(/\s+/))
    .filter(parts => parts.length >= 2)
    .map(parts => ({ url: parts[0], width: parseInt(parts[1]) || 0 }));

  if (entries.length === 0) return null;

  entries.sort((a, b) => b.width - a.width);
  return entries[0].url;
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGallery);
  // Also try on other events
  document.addEventListener('load', initializeGallery);
  window.addEventListener('load', initializeGallery);
} else {
  initializeGallery();
}

// Expose to global scope for debugging and re-initialization
window.VehicleGalleryManager = {
  instance: null,
  init() {
    return initializeGallery();
  },
  reinit() {
    if (galleryInstance) {
      galleryInstance.initialized = false;
    }
    return initializeGallery();
  }
};
