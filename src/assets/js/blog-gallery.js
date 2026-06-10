/**
 * Gallery lightbox for blog post section galleries
 * Opens full-size images in a modal when thumbnails are clicked
 */
(function() {
  // Create modal HTML
  const modal = document.createElement('div');
  modal.id = 'gallery-modal';
  modal.className = 'hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center';
  modal.innerHTML = `
    <button 
      id="gallery-close" 
      class="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors" 
      aria-label="Close gallery">
      <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
    <button 
      id="gallery-prev" 
      class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
      aria-label="Previous image">
      <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    <div class="max-w-4xl max-h-screen flex flex-col items-center">
      <img id="gallery-image" src="" alt="" class="max-w-full max-h-[80vh] object-contain rounded">
      <p id="gallery-caption" class="text-white text-center mt-4 text-sm max-w-2xl"></p>
    </div>
    <button 
      id="gallery-next" 
      class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
      aria-label="Next image">
      <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  `;
  document.body.appendChild(modal);

  const closeBtn = document.getElementById('gallery-close');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  const modalImage = document.getElementById('gallery-image');
  const modalCaption = document.getElementById('gallery-caption');

  let currentGallery = [];
  let currentIndex = 0;

  // Find all gallery triggers
  function initGalleries() {
    const triggers = document.querySelectorAll('.gallery-thumb-trigger');
    
    triggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const src = this.dataset.galleryImage;
        const alt = this.dataset.galleryAlt;
        
        // Get all images from the same gallery section
        const section = this.closest('.gallery-section');
        if (section) {
          currentGallery = Array.from(section.querySelectorAll('.gallery-thumb-trigger')).map(t => ({
            src: t.dataset.galleryImage,
            alt: t.dataset.galleryAlt
          }));
          currentIndex = currentGallery.findIndex(img => img.src === src);
        } else {
          currentGallery = [{ src, alt }];
          currentIndex = 0;
        }
        
        showImage(currentIndex);
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  function showImage(index) {
    if (index < 0 || index >= currentGallery.length) return;
    
    currentIndex = index;
    const img = currentGallery[index];
    modalImage.src = img.src;
    modalImage.alt = img.alt;
    modalCaption.textContent = img.alt;
    
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === currentGallery.length - 1;
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // Event listeners
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });
  
  prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
  nextBtn.addEventListener('click', () => showImage(currentIndex + 1));

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleries);
  } else {
    initGalleries();
  }
})();
