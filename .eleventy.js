const fs = require('fs');
const path = require('path');

function validateVehicleData(filename, data) {
  const errors = [];
  const prefix = `[vehicle-detail-pages] Error in ${filename}`;

  // pageTitle
  if (!data.pageTitle || typeof data.pageTitle !== 'string') {
    errors.push(`${prefix}: pageTitle is required and must be a string`);
  } else if (data.pageTitle.length > 60) {
    errors.push(`${prefix}: pageTitle must be ≤60 characters (got ${data.pageTitle.length})`);
  }

  // pageDescription
  if (!data.pageDescription || typeof data.pageDescription !== 'string') {
    errors.push(`${prefix}: pageDescription is required and must be a string`);
  } else if (data.pageDescription.length > 160) {
    errors.push(`${prefix}: pageDescription must be ≤160 characters (got ${data.pageDescription.length})`);
  }

  // altSlug
  if (!data.altSlug || typeof data.altSlug.de !== 'string' || typeof data.altSlug.en !== 'string') {
    errors.push(`${prefix}: altSlug.de and altSlug.en are required strings`);
  }

  // hero
  if (!data.hero) {
    errors.push(`${prefix}: hero is required`);
  } else {
    if (data.hero.title && data.hero.title.length > 80) {
      errors.push(`${prefix}: hero.title must be ≤80 characters (got ${data.hero.title.length})`);
    }
    if (data.hero.subtitle && data.hero.subtitle.length > 150) {
      errors.push(`${prefix}: hero.subtitle must be ≤150 characters (got ${data.hero.subtitle.length})`);
    }
    if (!data.hero.image || !data.hero.image.startsWith('/assets/')) {
      errors.push(`${prefix}: hero.image must start with /assets/`);
    }
  }

  // specs
  const requiredSpecs = ['power', 'gvw', 'range', 'cabin'];
  if (!data.specs) {
    errors.push(`${prefix}: specs is required`);
  } else {
    for (const key of requiredSpecs) {
      if (!data.specs[key]) {
        errors.push(`${prefix}: specs.${key} is required`);
      }
    }
  }

  // configurations
  if (!Array.isArray(data.configurations) || data.configurations.length < 1 || data.configurations.length > 20) {
    errors.push(`${prefix}: configurations must be an array with 1–20 items`);
  }

  // features
  if (!Array.isArray(data.features) || data.features.length < 1 || data.features.length > 12) {
    errors.push(`${prefix}: features must be an array with 1–12 items`);
  } else {
    data.features.forEach((feature, i) => {
      if (!feature.icon || !feature.title || !feature.description) {
        errors.push(`${prefix}: features[${i}] must have icon, title, and description`);
      }
    });
  }

  // cta
  if (!data.cta) {
    errors.push(`${prefix}: cta is required`);
  } else if (!data.cta.buttonUrl || !data.cta.buttonUrl.startsWith('/')) {
    errors.push(`${prefix}: cta.buttonUrl must start with /`);
  }

  return errors;
}

module.exports = function(eleventyConfig) {
  // Template formats
  eleventyConfig.setTemplateFormats(["njk", "md"]);

  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/favicon");
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/downloads");

  // Passthrough copy for JavaScript modules
  eleventyConfig.addPassthroughCopy("src/assets/js");

  // Passthrough copy for CMS admin panel
  eleventyConfig.addPassthroughCopy("src/admin");

  // Build-time validation of vehicle detail page data
  eleventyConfig.on('eleventy.before', () => {
    const vehicleFiles = ['4x4.json', '6x6.json', '8x8.json'];
    const dataDir = path.join(__dirname, 'src/_data/de/pages');
    const allErrors = [];

    for (const filename of vehicleFiles) {
      const filePath = path.join(dataDir, filename);
      if (!fs.existsSync(filePath)) {
        allErrors.push(`[vehicle-detail-pages] Error in ${filename}: file not found`);
        continue;
      }
      let data;
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(raw);
      } catch (e) {
        if (e instanceof SyntaxError) {
          allErrors.push(`[vehicle-detail-pages] Error in ${filename}: invalid JSON - ${e.message}`);
        } else {
          allErrors.push(`[vehicle-detail-pages] Error in ${filename}: ${e.message}`);
        }
        continue;
      }
      const errors = validateVehicleData(filename, data);
      allErrors.push(...errors);
    }

    if (allErrors.length > 0) {
      throw new Error('Vehicle data validation failed:\n' + allErrors.join('\n'));
    }
  });

  // Translation filter: {{ "nav.home" | t(translations) }}
  eleventyConfig.addFilter("t", function(key, translations) {
    return translations[key] || key;
  });

  // Alternate locale filter
  eleventyConfig.addFilter("altLocale", function(locale) {
    return locale === "de" ? "en" : "de";
  });

  // Computed data for translations and pageContent
  eleventyConfig.addGlobalData("eleventyComputed", {
    translations: (data) => data[data.locale]?.translations,
    pageContent: (data) => data[data.locale]?.pages,
    pageTitle: (data) => {
      if (data.pageTitle) return data.pageTitle;
      // Derive from page content based on input path
      const pages = data[data.locale]?.pages;
      if (!pages || !data.page?.inputPath) return data.pageTitle;
      const inputPath = data.page.inputPath;
      const match = inputPath.match(/\/pages\/(?:de|en)\/(.+)\.njk$/);
      if (!match) return data.pageTitle;
      const slug = match[1] === 'index' ? 'home' : match[1];
      // Normalize slug to match JSON keys (e.g., 'modulare-systeme' -> 'modular-systems')
      const pageData = pages[slug] || pages[slug.replace(/-/g, '')];
      return pageData?.pageTitle || data.pageTitle;
    },
    pageDescription: (data) => {
      if (data.pageDescription) return data.pageDescription;
      const pages = data[data.locale]?.pages;
      if (!pages || !data.page?.inputPath) return data.pageDescription;
      const inputPath = data.page.inputPath;
      const match = inputPath.match(/\/pages\/(?:de|en)\/(.+)\.njk$/);
      if (!match) return data.pageDescription;
      const slug = match[1] === 'index' ? 'home' : match[1];
      const pageData = pages[slug] || pages[slug.replace(/-/g, '')];
      return pageData?.pageDescription || data.pageDescription;
    },
    altSlug: (data) => {
      if (data.altSlug) return data.altSlug;
      const pages = data[data.locale]?.pages;
      if (!pages || !data.page?.inputPath) return data.altSlug;
      const inputPath = data.page.inputPath;
      const match = inputPath.match(/\/pages\/(?:de|en)\/(.+)\.njk$/);
      if (!match) return data.altSlug;
      const slug = match[1] === 'index' ? 'home' : match[1];
      const pageData = pages[slug] || pages[slug.replace(/-/g, '')];
      return pageData?.altSlug || data.altSlug;
    },
    permalink: (data) => {
      // Only compute permalink for pages in the pages/ directory
      if (!data.page || !data.page.inputPath) return data.permalink;
      const inputPath = data.page.inputPath;
      if (!inputPath.includes('/pages/')) return data.permalink;
      // Strip the pages/{locale}/ prefix and map to /{locale}/{slug}/
      const match = inputPath.match(/\/pages\/(de|en)\/(.+)\.njk$/);
      if (!match) return data.permalink;
      const locale = match[1];
      const slug = match[2];
      if (slug === 'index') return `/${locale}/`;
      return `/${locale}/${slug}/`;
    }
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
