import { globSync } from 'glob';
import { readFileSync } from 'fs';
import * as cheerio from 'cheerio';

/**
 * Returns all HTML file paths from _site/ recursively,
 * excluding the root redirect page (_site/index.html),
 * the CMS admin panel (_site/admin/), and blog post pages
 * (which live at root-level slugs outside locale prefixes).
 */
export function getAllHtmlFiles(): string[] {
  const localePages = globSync('_site/{de,en}/**/*.html');
  return localePages;
}

/**
 * Returns all blog post HTML files from _site/ (root-level DE + /en/ prefixed EN).
 */
export function getBlogHtmlFiles(): string[] {
  // DE blog posts are at root level (not under de/ or en/)
  const rootFiles = globSync('_site/*/index.html').filter(
    (f) => f !== '_site/index.html' &&
           !f.startsWith('_site/de/') &&
           !f.startsWith('_site/en/') &&
           !f.startsWith('_site/admin/')
  );
  // EN blog posts are under /en/{slug}/
  const enBlogFiles = globSync('_site/en/*/index.html').filter(
    (f) => {
      // Exclude known EN pages (they have locale-specific slugs)
      const slug = f.replace('_site/en/', '').replace('/index.html', '');
      const knownPages = ['about', 'blog', 'brabus', 'careers', 'configurator', 'contact', 'documentation', 'expedition-vehicles', 'modular-systems', 'privacy', 'service', 'team', 'terms', 'warranty'];
      return !knownPages.includes(slug);
    }
  );
  return [...rootFiles, ...enBlogFiles];
}

/**
 * Reads an HTML file and returns a cheerio instance for DOM querying.
 */
export function loadHtml(filePath: string): cheerio.CheerioAPI {
  const html = readFileSync(filePath, 'utf-8');
  return cheerio.load(html);
}
