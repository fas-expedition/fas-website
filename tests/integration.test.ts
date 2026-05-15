import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { globSync } from 'glob';
import { loadHtml } from './helpers';

describe('Integration Tests: Build Pipeline', () => {
  describe('npm run build', () => {
    it('completes with exit code 0', () => {
      // Run build and expect no error (exit code 0)
      expect(() => {
        execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
      }).not.toThrow();
    });
  });

  describe('npm run clean', () => {
    it('succeeds when _site does not exist', () => {
      // Remove _site first if it exists, then run clean
      execSync('rm -rf _site', { stdio: 'pipe' });
      expect(() => {
        execSync('npm run clean', { stdio: 'pipe', timeout: 10000 });
      }).not.toThrow();
    });
  });

  describe('Build output validation', () => {
    beforeAll(() => {
      // Rebuild to ensure _site exists for remaining tests
      execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
    });

    it('contains _site/assets/css/output.css (non-empty)', () => {
      const cssPath = '_site/assets/css/output.css';
      expect(existsSync(cssPath)).toBe(true);
      const stat = statSync(cssPath);
      expect(stat.size).toBeGreaterThan(0);
    });

    it('preserves src/assets/images/ structure in _site/assets/images/', () => {
      // Check that image directories are preserved
      expect(existsSync('_site/assets/images/logo')).toBe(true);
      expect(existsSync('_site/assets/images/vehicles')).toBe(true);

      // Check that at least one image file exists in each directory
      const logoFiles = globSync('_site/assets/images/logo/*');
      expect(logoFiles.length).toBeGreaterThan(0);

      const vehicleFiles = globSync('_site/assets/images/vehicles/*');
      expect(vehicleFiles.length).toBeGreaterThan(0);
    });

    it('_site/sitemap.xml exists and contains hreflang entries', () => {
      const sitemapPath = '_site/sitemap.xml';
      expect(existsSync(sitemapPath)).toBe(true);

      const content = readFileSync(sitemapPath, 'utf-8');
      expect(content).toContain('hreflang="de"');
      expect(content).toContain('hreflang="en"');
      expect(content).toContain('hreflang="x-default"');
    });

    it('JSON data is accessible in rendered templates (text appears in HTML)', () => {
      // Verify that content from JSON data files appears in rendered HTML
      const deHome = loadHtml('_site/de/index.html');
      const deData = JSON.parse(readFileSync('src/_data/de/pages/home.json', 'utf-8'));

      // Hero title from JSON should appear in rendered HTML
      expect(deHome('body').text()).toContain(deData.hero.title);

      // Feature section title should appear
      expect(deHome('body').text()).toContain(deData.features.title);

      // EN locale too
      const enHome = loadHtml('_site/en/index.html');
      const enData = JSON.parse(readFileSync('src/_data/en/pages/home.json', 'utf-8'));
      expect(enHome('body').text()).toContain(enData.hero.title);
    });
  });
});
