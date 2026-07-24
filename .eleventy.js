const fs = require('fs');
const path = require('path');
const Image = require("@11ty/eleventy-img");
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");

// Configure eleventy-img cache
Image.concurrency = 10;
const isFastBuild = process.env.FAST_BUILD === "1";
const imageWidths = isFastBuild ? [640, 1280] : [320, 640, 1024, 1280, 1600, 1920];
const transformFormats = isFastBuild ? ["webp", "jpeg"] : ["avif", "webp", "jpeg"];

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
  // Image Transform Plugin: Automatically optimize all <img> and <picture> tags
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: transformFormats,
    widths: imageWidths,
    defaultAttributes: {
      loading: "lazy",
      decoding: "async",
    },
  });

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

  // Responsive Image Shortcode using eleventy-img
  eleventyConfig.addNunjucksAsyncShortcode("respImage", async function(src, alt, sizes = "100vw") {
    try {
      // Handle both absolute paths (/assets/...) and relative paths
      const inputPath = src.startsWith('/assets/') 
        ? path.join(__dirname, 'src', src) 
        : src;

      // Skip if file doesn't exist (e.g., coming-soon.svg placeholder)
      if (!fs.existsSync(inputPath)) {
        // Return fallback img tag
        return `<img src="${src}" alt="${alt}" class="w-full h-auto object-cover" loading="lazy">`;
      }

      const metadata = await Image(inputPath, {
        widths: imageWidths,
        formats: ["webp", "jpeg"],
        outputDir: "./_site/assets/images/optimized",
        filenameFormat: function(id, src, width, format, options) {
          const ext = path.extname(src);
          const name = path.basename(src, ext);
          return `${name}-${width}w.${format}`;
        }
      });

      const imageAttributes = {
        alt: alt,
        sizes: sizes,
        loading: "lazy",
        decoding: "async",
      };

      return Image.generateHTML(metadata, imageAttributes);
    } catch (error) {
      console.error(`Error processing image ${src}:`, error);
      // Fallback to original image
      return `<img src="${src}" alt="${alt}" class="w-full h-auto object-cover" loading="lazy">`;
    }
  });

  // Filter for generating srcset strings for use in custom picture elements
  eleventyConfig.addFilter("imageSrcset", async function(src, format = "jpeg") {
    try {
      const inputPath = src.startsWith('/assets/') 
        ? path.join(__dirname, 'src', src) 
        : src;

      if (!fs.existsSync(inputPath)) {
        return src;
      }

      const metadata = await Image(inputPath, {
        widths: imageWidths,
        formats: [format],
        outputDir: "./_site/assets/images/optimized",
        filenameFormat: function(id, src, width, format, options) {
          const ext = path.extname(src);
          const name = path.basename(src, ext);
          return `${name}-${width}w.${format}`;
        }
      });

      const srcset = metadata[format]
        ?.map(img => `${img.url} ${img.width}w`)
        .join(", ") || src;

      return srcset;
    } catch (error) {
      console.error(`Error generating srcset for ${src}:`, error);
      return src;
    }
  });

  // Blog date filter: formats ISO date as "DD. MMMM YYYY" in German
  const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  eleventyConfig.addFilter("blogDate", function(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getUTCDate();
    const month = MONTHS_DE[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day}. ${month} ${year}`;
  });

  // Add section galleries to blog post content
  const addSectionGalleries = require('./src/_includes/filters/add-section-galleries.js');
  eleventyConfig.addFilter("addSectionGalleries", addSectionGalleries);

  // Markdown: open external links in new tab
  const markdownIt = require('markdown-it');
  const md = markdownIt({ html: true, linkify: true });
  const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const href = tokens[idx].attrGet('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    }
    return defaultRender(tokens, idx, options, env, self);
  };
  eleventyConfig.setLibrary("md", md);

  // Blog collection: published posts sorted by date descending (German)
  eleventyConfig.addCollection("publishedBlog", function(collectionApi) {
    return collectionApi.getFilteredByTag("blog_de")
      .filter(post => post.data.status === "published")
      .sort((a, b) => new Date(b.data.publishDate) - new Date(a.data.publishDate));
  });

  // Blog collection: published posts sorted by date descending (English)
  eleventyConfig.addCollection("publishedBlogEn", function(collectionApi) {
    return collectionApi.getFilteredByTag("blog_en")
      .filter(post => post.data.status === "published")
      .sort((a, b) => new Date(b.data.publishDate) - new Date(a.data.publishDate));
  });

  // Blog categories: distinct categories from published posts (German)
  eleventyConfig.addCollection("blogCategories", function(collectionApi) {
    const posts = collectionApi.getFilteredByTag("blog_de")
      .filter(post => post.data.status === "published");
    const categories = new Set();
    posts.forEach(p => {
      // Support both old single category and new multiple categories
      if (p.data.categories && Array.isArray(p.data.categories)) {
        p.data.categories.forEach(cat => categories.add(cat));
      } else if (p.data.category) {
        categories.add(p.data.category);
      }
    });
    return Array.from(categories).sort();
  });

  // Blog categories: distinct categories from published posts (English)
  eleventyConfig.addCollection("blogCategoriesEn", function(collectionApi) {
    const posts = collectionApi.getFilteredByTag("blog_en")
      .filter(post => post.data.status === "published");
    const categories = new Set();
    posts.forEach(p => {
      // Support both old single category and new multiple categories
      if (p.data.categories && Array.isArray(p.data.categories)) {
        p.data.categories.forEach(cat => categories.add(cat));
      } else if (p.data.category) {
        categories.add(p.data.category);
      }
    });
    return Array.from(categories).sort();
  });

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
