/**
 * Gallery Modal Handler
 * Manages opening, closing, and navigation through vehicle image galleries
 */

class VehicleGallery {
  constructor() {
    this.currentGalleryId = null;
    this.currentImageIndex = 0;
    this.init();
  }

  init() {
    this.attachGalleryTriggers();
    this.attachThumbGalleryTriggers();
    this.attachCloseButtons();
    this.attachNavigationButtons();
    this.attachThumbnailButtons();
    this.attachKeyboardNavigation();
    this.attachBackdropClose();
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
    const imageUrl = thumbnail.querySelector('img').src;
    const imageAlt = thumbnail.querySelector('img').alt;

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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new VehicleGallery();
  });
} else {
  new VehicleGallery();
}
