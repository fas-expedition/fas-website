import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { loadHtml } from './helpers';

describe('Unit Tests: Configuration and Content Validation', () => {
  describe('package.json', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

    it('contains correct devDependencies', () => {
      const deps = pkg.devDependencies;
      expect(deps['@11ty/eleventy']).toBeDefined();
      expect(deps['tailwindcss']).toBeDefined();
      expect(deps['postcss']).toBeDefined();
      expect(deps['autoprefixer']).toBeDefined();
      expect(deps['concurrently']).toBeDefined();
    });

    it('has engines.node >= 20', () => {
      expect(pkg.engines).toBeDefined();
      expect(pkg.engines.node).toBe('>=20.0.0');
    });

    it('has required scripts', () => {
      expect(pkg.scripts.dev).toBeDefined();
      expect(pkg.scripts.build).toBeDefined();
      expect(pkg.scripts.clean).toBeDefined();
      expect(pkg.scripts.test).toBeDefined();
      expect(pkg.scripts['build:css']).toBeDefined();
      expect(pkg.scripts['build:11ty']).toBeDefined();
    });
  });

  describe('netlify.toml', () => {
    const toml = readFileSync('netlify.toml', 'utf-8');

    it('has correct build command', () => {
      expect(toml).toContain('command = "npm run build"');
    });

    it('has correct publish directory', () => {
      expect(toml).toContain('publish = "_site"');
    });

    it('has redirect from / to /de/', () => {
      expect(toml).toContain('from = "/"');
      expect(toml).toContain('to = "/de/"');
      expect(toml).toContain('status = 301');
    });

    it('has cache headers for assets', () => {
      expect(toml).toContain('for = "/assets/*"');
      expect(toml).toContain('Cache-Control');
      expect(toml).toContain('max-age=31536000');
      expect(toml).toContain('immutable');
    });
  });

  describe('Navigation translations', () => {
    const navKeys = [
      'nav.home',
      'nav.expeditionMobile',
      'nav.modularSystems',
      'nav.brabus',
      'nav.configurator',
      'nav.blog',
      'nav.customerPortal',
    ];

    it('DE translations contain all required nav keys', () => {
      const de = JSON.parse(readFileSync('src/_data/de/translations.json', 'utf-8'));
      for (const key of navKeys) {
        expect(de[key], `Missing DE nav key: ${key}`).toBeDefined();
        expect(de[key]).not.toBe('');
      }
    });

    it('EN translations contain all required nav keys', () => {
      const en = JSON.parse(readFileSync('src/_data/en/translations.json', 'utf-8'));
      for (const key of navKeys) {
        expect(en[key], `Missing EN nav key: ${key}`).toBeDefined();
        expect(en[key]).not.toBe('');
      }
    });
  });

  describe('Footer translations', () => {
    const footerKeys = [
      'footer.company',
      'footer.about',
      'footer.team',
      'footer.careers',
      'footer.contact',
      'footer.products',
      'footer.4x4',
      'footer.6x6',
      'footer.8x8',
      'footer.modularSystems',
      'footer.support',
      'footer.documentation',
      'footer.warranty',
      'footer.service',
      'footer.rights',
      'footer.copyright',
      'footer.privacy',
      'footer.terms',
      'footer.tagline',
    ];

    it('DE translations contain all required footer keys', () => {
      const de = JSON.parse(readFileSync('src/_data/de/translations.json', 'utf-8'));
      for (const key of footerKeys) {
        expect(de[key], `Missing DE footer key: ${key}`).toBeDefined();
        expect(de[key]).not.toBe('');
      }
    });

    it('EN translations contain all required footer keys', () => {
      const en = JSON.parse(readFileSync('src/_data/en/translations.json', 'utf-8'));
      for (const key of footerKeys) {
        expect(en[key], `Missing EN footer key: ${key}`).toBeDefined();
        expect(en[key]).not.toBe('');
      }
    });
  });

  describe('Home page hero content', () => {
    const requiredHeroFields = ['title', 'subtitle', 'description', 'image', 'ctaText', 'ctaUrl'];

    it('DE home page hero has required fields', () => {
      const data = JSON.parse(readFileSync('src/_data/de/pages/home.json', 'utf-8'));
      expect(data.hero).toBeDefined();
      for (const field of requiredHeroFields) {
        expect(data.hero[field], `Missing DE hero field: ${field}`).toBeDefined();
        expect(data.hero[field]).not.toBe('');
      }
    });

    it('EN home page hero has required fields', () => {
      const data = JSON.parse(readFileSync('src/_data/en/pages/home.json', 'utf-8'));
      expect(data.hero).toBeDefined();
      for (const field of requiredHeroFields) {
        expect(data.hero[field], `Missing EN hero field: ${field}`).toBeDefined();
        expect(data.hero[field]).not.toBe('');
      }
    });
  });

  describe('Root redirect page', () => {
    it('contains meta-refresh to /de/', () => {
      const $ = loadHtml('_site/index.html');
      const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
      expect(metaRefresh).toBeDefined();
      expect(metaRefresh).toContain('/de/');
    });
  });

  describe('BRABUS nav link styling', () => {
    it('has serif font styling in DE home page', () => {
      const $ = loadHtml('_site/de/index.html');
      const brabusLink = $('nav a').filter(function () {
        return $(this).text().trim() === 'BRABUS';
      }).first();
      const style = brabusLink.attr('style') || '';
      expect(style).toContain('serif');
    });

    it('has serif font styling in EN home page', () => {
      const $ = loadHtml('_site/en/index.html');
      const brabusLink = $('nav a').filter(function () {
        return $(this).text().trim() === 'BRABUS';
      }).first();
      const style = brabusLink.attr('style') || '';
      expect(style).toContain('serif');
    });
  });

  describe('Placeholder pages', () => {
    const placeholderPages = [
      '_site/de/konfigurator/index.html',
      '_site/en/configurator/index.html',
      '_site/de/blog/index.html',
      '_site/en/blog/index.html',
    ];

    for (const page of placeholderPages) {
      it(`${page} contains "Coming Soon" equivalent and home link`, () => {
        expect(existsSync(page), `File not found: ${page}`).toBe(true);
        const $ = loadHtml(page);
        const text = $('body').text();
        // Check for "Coming Soon" or German equivalent "Demnächst verfügbar"
        const hasComingSoon = text.includes('Coming Soon') || text.includes('Demnächst verfügbar');
        expect(hasComingSoon, `${page} should contain "Coming Soon" or equivalent`).toBe(true);
        // Check for a link back to home
        const locale = page.includes('/de/') ? 'de' : 'en';
        const homeLink = $(`a[href="/${locale}/"]`);
        expect(homeLink.length, `${page} should have a link to /${locale}/`).toBeGreaterThan(0);
      });
    }
  });

  describe('Feature cards in home page', () => {
    it('DE home page has 4 feature items', () => {
      const data = JSON.parse(readFileSync('src/_data/de/pages/home.json', 'utf-8'));
      expect(data.features.items).toHaveLength(4);
    });

    it('EN home page has 4 feature items', () => {
      const data = JSON.parse(readFileSync('src/_data/en/pages/home.json', 'utf-8'));
      expect(data.features.items).toHaveLength(4);
    });

    it('DE home page renders 4 feature cards in HTML', () => {
      const $ = loadHtml('_site/de/index.html');
      // Feature cards have the border border-zinc-800 pattern
      const featureCards = $('section.bg-zinc-950 .grid .border.border-zinc-800');
      expect(featureCards.length).toBe(4);
    });
  });

  describe('BRABUS edition data', () => {
    it('EN BRABUS data has 700 HP and 900 HP editions', () => {
      const data = JSON.parse(readFileSync('src/_data/en/pages/brabus.json', 'utf-8'));
      const editions = data.editions.items;
      expect(editions).toHaveLength(2);

      const edition700 = editions.find((e: any) => e.name.includes('700'));
      expect(edition700).toBeDefined();
      expect(edition700.specs.power.value).toBe('700 HP');

      const edition900 = editions.find((e: any) => e.name.includes('900'));
      expect(edition900).toBeDefined();
      expect(edition900.specs.power.value).toBe('900 HP');
    });

    it('DE BRABUS data has 700 PS and 900 PS editions', () => {
      const data = JSON.parse(readFileSync('src/_data/de/pages/brabus.json', 'utf-8'));
      const editions = data.editions.items;
      expect(editions).toHaveLength(2);

      const edition700 = editions.find((e: any) => e.name.includes('700'));
      expect(edition700).toBeDefined();
      expect(edition700.specs.power.value).toBe('700 PS');

      const edition900 = editions.find((e: any) => e.name.includes('900'));
      expect(edition900).toBeDefined();
      expect(edition900.specs.power.value).toBe('900 PS');
    });
  });
});
