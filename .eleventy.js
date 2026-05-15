module.exports = function(eleventyConfig) {
  // Template formats
  eleventyConfig.setTemplateFormats(["njk", "md"]);

  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/favicon");
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/downloads");

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
