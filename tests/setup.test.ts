import { describe, it, expect } from 'vitest';
import { getAllHtmlFiles, loadHtml } from './helpers';

describe('Test setup smoke test', () => {
  it('getAllHtmlFiles returns an array', () => {
    const files = getAllHtmlFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  it('getAllHtmlFiles excludes root redirect', () => {
    const files = getAllHtmlFiles();
    expect(files).not.toContain('_site/index.html');
  });

  it('loadHtml returns a cheerio instance', () => {
    const files = getAllHtmlFiles();
    if (files.length > 0) {
      const $ = loadHtml(files[0]);
      expect($.html()).toBeTruthy();
    }
  });
});
