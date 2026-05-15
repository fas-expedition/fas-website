import { globSync } from 'glob';
import { readFileSync } from 'fs';
import * as cheerio from 'cheerio';

/**
 * Returns all HTML file paths from _site/ recursively,
 * excluding the root redirect page (_site/index.html) and
 * the CMS admin panel (_site/admin/).
 */
export function getAllHtmlFiles(): string[] {
  return globSync('_site/**/*.html').filter(
    (f) => f !== '_site/index.html' && !f.startsWith('_site/admin/')
  );
}

/**
 * Reads an HTML file and returns a cheerio instance for DOM querying.
 */
export function loadHtml(filePath: string): cheerio.CheerioAPI {
  const html = readFileSync(filePath, 'utf-8');
  return cheerio.load(html);
}
