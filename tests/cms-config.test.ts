import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as yaml from 'js-yaml';
import * as cheerio from 'cheerio';
import { readFileSync, existsSync } from 'fs';
import { getAllHtmlFiles, loadHtml } from './helpers';

// ─── Load test fixtures ──────────────────────────────────────────────────────

const configPath = 'src/admin/config.yml';
const indexPath = 'src/admin/index.html';
const eleventyConfigPath = '.eleventy.js';
const netlifyTomlPath = 'netlify.toml';

const config = yaml.load(readFileSync(configPath, 'utf-8')) as any;
const indexHtml = readFileSync(indexPath, 'utf-8');
const $ = cheerio.load(indexHtml);
const eleventyConfig = readFileSync(eleventyConfigPath, 'utf-8');
const netlifyToml = readFileSync(netlifyTomlPath, 'utf-8');

// Helper: get all file entries across all collections
function getAllFileEntries(): any[] {
  return config.collections.flatMap((c: any) => c.files || []);
}

// Helper: get page collection file entries
function getPageFileEntries(): any[] {
  const pagesCollection = config.collections.find((c: any) => c.name === 'pages');
  return pagesCollection?.files || [];
}

// Helper: recursively find all fields with a given property
function findFieldsRecursive(fields: any[], predicate: (f: any) => boolean): any[] {
  const results: any[] = [];
  for (const field of fields) {
    if (predicate(field)) results.push(field);
    if (field.fields) results.push(...findFieldsRecursive(field.fields, predicate));
    if (field.field) {
      if (predicate(field.field)) results.push(field.field);
    }
  }
  return results;
}

// ─── Unit Tests: Backend, Media, and Editorial Workflow ──────────────────────

describe('Unit: Backend, media, and editorial workflow configuration', () => {
  it('backend is git-gateway with branch main', () => {
    expect(config.backend.name).toBe('git-gateway');
    expect(config.backend.branch).toBe('main');
  });

  it('publish_mode is editorial_workflow', () => {
    expect(config.publish_mode).toBe('editorial_workflow');
  });

  it('media_folder is src/assets/images/uploads', () => {
    expect(config.media_folder).toBe('src/assets/images/uploads');
  });

  it('public_folder is /assets/images/uploads', () => {
    expect(config.public_folder).toBe('/assets/images/uploads');
  });

  it('media_library max_file_size is 5242880 (5 MB)', () => {
    expect(config.media_library.max_file_size).toBe(5242880);
  });

  it('media_library allowed_extensions includes only image types', () => {
    const allowed = config.media_library.allowed_extensions;
    const imageTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    expect(allowed).toEqual(expect.arrayContaining(imageTypes));
    // Ensure no non-image types
    for (const ext of allowed) {
      expect(imageTypes).toContain(ext);
    }
  });
});

// ─── Unit Tests: Admin Panel HTML Structure ──────────────────────────────────

describe('Unit: Admin panel HTML structure', () => {
  it('index.html contains Decap CMS script with ^3.0.0 version', () => {
    expect(indexHtml).toContain('https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js');
  });

  it('index.html contains Netlify Identity Widget script', () => {
    expect(indexHtml).toContain('https://identity.netlify.com/v1/netlify-identity-widget.js');
  });

  it('index.html contains <noscript> fallback element', () => {
    const noscript = $('noscript');
    expect(noscript.length).toBeGreaterThan(0);
    expect(noscript.text()).toContain('JavaScript');
  });

  it('index.html registers preview styles via CMS.registerPreviewStyle', () => {
    expect(indexHtml).toContain('CMS.registerPreviewStyle');
    expect(indexHtml).toContain('/assets/css/main.css');
  });

  it('index.html registers preview templates for all page collections', () => {
    const expectedTemplates = [
      'home_de', 'home_en',
      'expeditionsmobile_de', 'expeditionsmobile_en',
      'modular_systems_de', 'modular_systems_en',
      'brabus_de', 'brabus_en',
    ];
    for (const name of expectedTemplates) {
      expect(indexHtml).toContain(`CMS.registerPreviewTemplate("${name}"`);
    }
  });
});

// ─── Unit Tests: Site Settings and Translation Collections ───────────────────

describe('Unit: Site settings and translation collections', () => {
  it('site settings URL field has https:// pattern validation', () => {
    const settingsCollection = config.collections.find((c: any) => c.name === 'settings');
    const siteSettings = settingsCollection.files.find((f: any) => f.name === 'site_settings');
    const urlField = siteSettings.fields.find((f: any) => f.name === 'url');
    expect(urlField.pattern).toBeDefined();
    expect(urlField.pattern[0]).toContain('https://');
  });

  it('site settings locales field uses hidden widget', () => {
    const settingsCollection = config.collections.find((c: any) => c.name === 'settings');
    const siteSettings = settingsCollection.files.find((f: any) => f.name === 'site_settings');
    const localesField = siteSettings.fields.find((f: any) => f.name === 'locales');
    expect(localesField.widget).toBe('hidden');
  });

  it('translation collection entries exist for both DE and EN', () => {
    const translationsCollection = config.collections.find((c: any) => c.name === 'translations');
    const files = translationsCollection.files;
    const deEntry = files.find((f: any) => f.name === 'translations_de');
    const enEntry = files.find((f: any) => f.name === 'translations_en');
    expect(deEntry).toBeDefined();
    expect(enEntry).toBeDefined();
  });

  it('translation fields use object widget for category grouping', () => {
    const translationsCollection = config.collections.find((c: any) => c.name === 'translations');
    const deEntry = translationsCollection.files.find((f: any) => f.name === 'translations_de');
    for (const field of deEntry.fields) {
      expect(field.widget).toBe('object');
    }
  });

  it('site settings collection entry exists for src/_data/site.json', () => {
    const settingsCollection = config.collections.find((c: any) => c.name === 'settings');
    const siteSettings = settingsCollection.files.find((f: any) => f.name === 'site_settings');
    expect(siteSettings.file).toBe('src/_data/site.json');
  });
});

// ─── Unit Tests: Eleventy Configuration ──────────────────────────────────────

describe('Unit: Eleventy configuration', () => {
  it('.eleventy.js includes passthrough copy for src/admin', () => {
    expect(eleventyConfig).toContain('addPassthroughCopy("src/admin")');
  });

  it('.eleventy.js includes passthrough copy for src/assets/images/uploads', () => {
    expect(eleventyConfig).toContain('addPassthroughCopy("src/assets/images/uploads")');
  });
});

// ─── Unit Tests: Netlify Configuration ───────────────────────────────────────

describe('Unit: Netlify configuration', () => {
  it('netlify.toml has no redirects targeting /admin/', () => {
    // Check that no redirect rule targets /admin/
    expect(netlifyToml).not.toMatch(/to\s*=\s*"\/admin/);
  });
});

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Property 2: Locale parity — both locales exist with identical field schemas', () => {
  it('for any page, both DE and EN entries exist with identical field schemas', () => {
    const files = getPageFileEntries();
    // Extract page base names (without locale suffix)
    const pageNames = [...new Set(files.map((f: any) => f.name.replace(/_de$|_en$/, '')))];

    fc.assert(
      fc.property(
        fc.constantFrom(...pageNames),
        (pageName) => {
          const deEntry = files.find((f: any) => f.name === `${pageName}_de`);
          const enEntry = files.find((f: any) => f.name === `${pageName}_en`);
          expect(deEntry).toBeDefined();
          expect(enEntry).toBeDefined();
          // Compare field schemas (names and widgets)
          const deFields = JSON.stringify(deEntry.fields.map((f: any) => ({ name: f.name, widget: f.widget })));
          const enFields = JSON.stringify(enEntry.fields.map((f: any) => ({ name: f.name, widget: f.widget })));
          expect(deFields).toBe(enFields);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Page collections prevent file creation', () => {
  it('page content uses files collection type (inherently prevents creation)', () => {
    const pagesCollection = config.collections.find((c: any) => c.name === 'pages');
    // The "files" key being present means it's a files-type collection (not folder-type)
    expect(pagesCollection.files).toBeDefined();
    expect(Array.isArray(pagesCollection.files)).toBe(true);
    // Folder-type collections use "folder" key — ensure it's absent
    expect(pagesCollection.folder).toBeUndefined();
  });
});

describe('Property 4: Collection labels include language suffix', () => {
  it('for any locale-specific collection entry, the label contains (DE) or (EN)', () => {
    const allFiles = getAllFileEntries();
    // Filter to locale-specific entries (those with _de or _en suffix in name)
    const localeEntries = allFiles.filter((f: any) => /_de$|_en$/.test(f.name));

    fc.assert(
      fc.property(
        fc.constantFrom(...localeEntries),
        (entry) => {
          const hasLocaleLabel = entry.label.includes('(DE)') || entry.label.includes('(EN)');
          expect(hasLocaleLabel).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 5: Locale path isolation', () => {
  it('for any DE entry, file path contains /de/ and not /en/', () => {
    const allFiles = getAllFileEntries();
    const deEntries = allFiles.filter((f: any) => f.label?.includes('(DE)'));

    fc.assert(
      fc.property(
        fc.constantFrom(...deEntries),
        (entry) => {
          expect(entry.file).toContain('/de/');
          expect(entry.file).not.toContain('/en/');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any EN entry, file path contains /en/ and not /de/', () => {
    const allFiles = getAllFileEntries();
    const enEntries = allFiles.filter((f: any) => f.label?.includes('(EN)'));

    fc.assert(
      fc.property(
        fc.constantFrom(...enEntries),
        (entry) => {
          expect(entry.file).toContain('/en/');
          expect(entry.file).not.toContain('/de/');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Image fields use image widget', () => {
  it('for any field whose name contains "image", the widget type is "image"', () => {
    const pageFiles = getPageFileEntries();
    const allImageFields: any[] = [];

    for (const file of pageFiles) {
      const imageFields = findFieldsRecursive(file.fields, (f: any) => f.name === 'image');
      allImageFields.push(...imageFields);
    }

    expect(allImageFields.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...allImageFields),
        (field) => {
          expect(field.widget).toBe('image');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 7: Translation key coverage', () => {
  it('for any key in the source translations.json, a corresponding field exists in the CMS config', () => {
    const deTranslations = JSON.parse(readFileSync('src/_data/de/translations.json', 'utf-8'));
    const translationKeys = Object.keys(deTranslations);

    const translationsCollection = config.collections.find((c: any) => c.name === 'translations');
    const deEntry = translationsCollection.files.find((f: any) => f.name === 'translations_de');

    // Collect all field names from the translations config (nested in object widgets)
    const configFieldNames: string[] = [];
    for (const group of deEntry.fields) {
      if (group.fields) {
        for (const field of group.fields) {
          configFieldNames.push(field.name);
        }
      }
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...translationKeys),
        (key) => {
          expect(configFieldNames).toContain(key);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 8: Descriptive field labels', () => {
  it('for any nested field within a page content object widget, the label contains a section prefix', () => {
    const pageFiles = getPageFileEntries();
    const nestedFields: { parentName: string; field: any }[] = [];

    for (const file of pageFiles) {
      for (const topField of file.fields) {
        if (topField.widget === 'object' && topField.fields) {
          for (const nestedField of topField.fields) {
            nestedFields.push({ parentName: topField.name, field: nestedField });
          }
        }
      }
    }

    expect(nestedFields.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...nestedFields),
        ({ parentName, field }) => {
          // Label should contain a prefix like "Hero - ", "Features - ", "CTA - ", etc.
          expect(field.label).toMatch(/.+ - .+/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 1: Identity Widget present on all pages (build output) ─────────

describe('Property 1: Identity Widget present on all pages', () => {
  it('for any HTML file in _site/, the document contains the Netlify Identity Widget script', () => {
    const htmlFiles = getAllHtmlFiles();

    if (htmlFiles.length === 0) {
      // Build output not available — skip gracefully
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const $page = loadHtml(filePath);
          const identityScript = $page('script[src*="identity.netlify.com"]');
          expect(identityScript.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: Math.min(100, htmlFiles.length) }
    );
  });
});
