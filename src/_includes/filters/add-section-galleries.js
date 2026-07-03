/**
 * Add galleries to blog post content after matching headlines and their first paragraph
 * Matches headline text, finds the next paragraph, then inserts gallery HTML after it
 */
module.exports = function(content, sectionGalleries) {
  if (!sectionGalleries || !Array.isArray(sectionGalleries) || sectionGalleries.length === 0) {
    return content;
  }

  let result = content;

  // Process each gallery
  sectionGalleries.forEach(section => {
    if (!section.sectionTitle || !section.images || section.images.length === 0) {
      return;
    }

    // Find h2 or h3 with the section title (exact match, case-insensitive)
    // Then find the next </p> tag after that headline
    const escapedTitle = section.sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern: match h2/h3, then capture everything until the next closing </p> tag
    const headingPattern = new RegExp(
      `(<(h[2-3])>\\s*${escapedTitle}\\s*</\\2>(?:[^<]|<(?!/p>))*</p>)`,
      'i'
    );

    // Build gallery HTML
    const galleryHtml = `$1
    <div class="gallery-section mt-8 mb-12 py-8 border-t border-b border-zinc-800">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" style="grid-auto-rows: 1fr;">
        ${section.images.map(img => `
        <div class="overflow-hidden rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors" style="aspect-ratio: 1 / 1;">
          <button 
            class="gallery-thumb-trigger w-full h-full hover:opacity-70 transition-opacity cursor-pointer bg-zinc-900"
            data-gallery-image="${img.src}"
            data-gallery-alt="${img.alt}"
            aria-label="Bild vergrößern"
            style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
            <picture style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
              <img 
                src="${img.src}" 
                alt="${img.alt}" 
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;">
            </picture>
          </button>
        </div>
        `).join('')}
      </div>
    </div>`;

    // Replace first occurrence
    result = result.replace(headingPattern, galleryHtml);
  });

  return result;
};
