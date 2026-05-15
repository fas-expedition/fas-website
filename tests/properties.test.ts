import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getAllHtmlFiles, loadHtml } from './helpers';

const htmlFiles = getAllHtmlFiles();

/**
 * Property 1: All pages live under a locale prefix
 * **Validates: Requirements 3.1**
 */
describe('Property 1: All pages live under a locale prefix', () => {
  it('for any generated HTML file, the path within _site/ begins with de/ or en/', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const relativePath = filePath.replace('_site/', '');
          expect(
            relativePath.startsWith('de/') || relativePath.startsWith('en/')
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Locale switcher links to the equivalent page in the alternate locale
 * **Validates: Requirements 3.4**
 */
describe('Property 2: Locale switcher links to equivalent page', () => {
  it('for any page, the inactive locale switcher link points to /{altLocale}/{altSlug}', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $ = loadHtml(filePath);
          const locale = filePath.replace('_site/', '').split('/')[0];
          const altLocale = locale === 'de' ? 'en' : 'de';

          // Find the language switcher container and get the alternate locale link
          const switcherLinks = $('div.hidden.lg\\:flex a').filter((_i, el) => {
            const text = $(el).text().trim();
            return text === 'DE' || text === 'EN';
          });

          // The inactive link is the one for the alternate locale
          const altLink = switcherLinks.filter((_i, el) => {
            return $(el).text().trim() === altLocale.toUpperCase();
          });

          expect(altLink.length).toBeGreaterThan(0);
          const href = altLink.attr('href');
          expect(href).toBeDefined();
          expect(href!.startsWith(`/${altLocale}/`)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: HTML lang attribute matches the page locale
 * **Validates: Requirements 3.5**
 */
describe('Property 3: HTML lang attribute matches page locale', () => {
  it('for any generated page, lang attribute matches directory-derived locale', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $ = loadHtml(filePath);
          const lang = $('html').attr('lang');
          const locale = filePath.replace('_site/', '').split('/')[0];
          expect(lang).toBe(locale);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Logo links to the locale-specific home page
 * **Validates: Requirements 5.3**
 */
describe('Property 4: Logo links to locale-specific home', () => {
  it('for any page, the nav logo link href equals /{locale}/', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $ = loadHtml(filePath);
          const locale = filePath.replace('_site/', '').split('/')[0];

          // The logo is the first <a> inside <nav> with the FAS logo image
          const logoLink = $('nav a.flex-shrink-0');
          expect(logoLink.length).toBeGreaterThan(0);
          expect(logoLink.attr('href')).toBe(`/${locale}/`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Every page includes navigation and footer
 * **Validates: Requirements 5.9, 6.6, 15.3**
 */
describe('Property 5: Every page includes navigation and footer', () => {
  it('for any generated page, both <nav> and <footer> elements are present', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $ = loadHtml(filePath);
          expect($('nav').length).toBeGreaterThan(0);
          expect($('footer').length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Locale content differentiation
 * **Validates: Requirements 7.6, 8.5, 9.5, 10.6**
 */
describe('Property 6: Locale content differentiation', () => {
  // Define known page pairs (DE path -> EN path)
  const pagePairs: Array<{ de: string; en: string }> = [];

  const deFiles = htmlFiles.filter((f) => f.replace('_site/', '').startsWith('de/'));
  const enFiles = htmlFiles.filter((f) => f.replace('_site/', '').startsWith('en/'));

  // Map DE slugs to EN slugs
  const slugMap: Record<string, string> = {
    'expeditionsmobile': 'expedition-vehicles',
    'modulare-systeme': 'modular-systems',
    'konfigurator': 'configurator',
  };

  for (const deFile of deFiles) {
    const deRelative = deFile.replace('_site/de/', '');
    let enRelative = deRelative;

    // Map known slug differences
    for (const [deSlug, enSlug] of Object.entries(slugMap)) {
      enRelative = enRelative.replace(deSlug, enSlug);
    }

    const enFile = `_site/en/${enRelative}`;
    if (enFiles.includes(enFile)) {
      pagePairs.push({ de: deFile, en: enFile });
    }
  }

  it('for matching DE/EN page pairs, heading text content differs', () => {
    expect(pagePairs.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...pagePairs),
        (pair) => {
          const $de = loadHtml(pair.de);
          const $en = loadHtml(pair.en);

          // Collect all h1, h2, h3 text from main content (excluding nav)
          const getHeadings = ($: ReturnType<typeof loadHtml>) => {
            const headings: string[] = [];
            $('main h1, main h2, main h3').each((_i, el) => {
              const text = $(el).text().trim();
              if (text) headings.push(text);
            });
            return headings.join(' | ');
          };

          const deHeadings = getHeadings($de);
          const enHeadings = getHeadings($en);

          // At least one heading should differ between locales
          expect(deHeadings).not.toBe(enHeadings);
        }
      ),
      { numRuns: Math.min(100, pagePairs.length * 10) }
    );
  });
});

/**
 * Property 7: Title element follows the site format
 * **Validates: Requirements 13.1**
 */
describe('Property 7: Title element follows site format', () => {
  it('for any page, <title> matches pattern {non-empty} | FAS Expedition', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $ = loadHtml(filePath);
          const title = $('title').text();
          expect(title).toMatch(/^.+\s\|\sFAS Expedition$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: Meta description is present and non-empty
 * **Validates: Requirements 13.2**
 */
describe('Property 8: Meta description is present and non-empty', () => {
  it('for any page, <meta name="description"> has a non-empty content attribute', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $ = loadHtml(filePath);
          const metaDesc = $('meta[name="description"]');
          expect(metaDesc.length).toBeGreaterThan(0);
          const content = metaDesc.attr('content');
          expect(content).toBeDefined();
          expect(content!.trim().length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 9: Hreflang alternate links are complete
 * **Validates: Requirements 13.3**
 */
describe('Property 9: Hreflang alternate links are complete', () => {
  it('for any page, <link rel="alternate"> elements exist for de, en, and x-default with valid href', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $ = loadHtml(filePath);

          const hreflangDe = $('link[rel="alternate"][hreflang="de"]');
          const hreflangEn = $('link[rel="alternate"][hreflang="en"]');
          const hreflangDefault = $('link[rel="alternate"][hreflang="x-default"]');

          expect(hreflangDe.length).toBeGreaterThan(0);
          expect(hreflangEn.length).toBeGreaterThan(0);
          expect(hreflangDefault.length).toBeGreaterThan(0);

          // Each should have a valid href
          expect(hreflangDe.attr('href')).toMatch(/^https?:\/\/.+/);
          expect(hreflangEn.attr('href')).toMatch(/^https?:\/\/.+/);
          expect(hreflangDefault.attr('href')).toMatch(/^https?:\/\/.+/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 10: Open Graph locale matches page locale
 * **Validates: Requirements 13.4**
 */
describe('Property 10: Open Graph locale matches page locale', () => {
  it('for any page, og:locale is de_DE for DE pages and en_GB for EN pages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $ = loadHtml(filePath);
          const locale = filePath.replace('_site/', '').split('/')[0];
          const ogLocale = $('meta[property="og:locale"]').attr('content');

          if (locale === 'de') {
            expect(ogLocale).toBe('de_DE');
          } else {
            expect(ogLocale).toBe('en_GB');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
