/**
 * Guards for the inquiry form's Netlify Forms wiring.
 *
 * The inquiry modal form is submitted directly to Netlify Forms (see
 * src/assets/js/inquiry-form.js). These tests assert on the raw Nunjucks
 * source so they run without a full Eleventy build.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('inquiry-form-modal.njk – Netlify Forms wiring', () => {
  const src = readFileSync('src/_includes/partials/inquiry-form-modal.njk', 'utf-8');

  it('declares the real form with name="inquiry" and data-netlify="true"', () => {
    expect(src).toMatch(/<form[^>]*id="inquiry-form-element"[^>]*name="inquiry"/);
    expect(src).toMatch(/<form[^>]*id="inquiry-form-element"[^>]*data-netlify="true"/);
  });

  it('declares multipart/form-data so file uploads (PDF, documents) work', () => {
    expect(src).toMatch(/<form[^>]*id="inquiry-form-element"[^>]*enctype="multipart\/form-data"/);
  });

  it('declares the Netlify honeypot attribute matching netlify.toml', () => {
    expect(src).toMatch(/<form[^>]*id="inquiry-form-element"[^>]*netlify-honeypot="bot-field"/);
  });

  it('has exactly one form named "inquiry" (no stale duplicate bootstrap form)', () => {
    const matches = src.match(/<form[^>]*name="inquiry"/g) || [];
    expect(matches.length).toBe(1);
  });

  it('includes a bot-field honeypot input inside the form', () => {
    expect(src).toContain('name="bot-field"');
  });

  it('includes a hidden file input for the generated PDF attachment', () => {
    expect(src).toMatch(/<input[^>]*type="file"[^>]*name="pdf_attachment"/);
  });

  it('includes the form-name hidden field required by Netlify Forms', () => {
    expect(src).toContain('<input type="hidden" name="form-name" value="inquiry" />');
  });
});

describe('inquiry-form.js – Netlify Forms submission', () => {
  const src = readFileSync('src/assets/js/inquiry-form.js', 'utf-8');

  it('no longer posts to the removed SendGrid handle-inquiry function', () => {
    expect(src).not.toContain('/.netlify/functions/handle-inquiry');
  });

  it('submits via FormData built from the real form', () => {
    expect(src).toContain('new FormData(inquiryFormElement)');
  });

  it('POSTs the submission to the current page path, not the redirected "/" root', () => {
    // netlify.toml 301-redirects "/" to "/de/", which breaks a raw fetch('/')
    // POST. The form must submit to window.location.pathname instead.
    expect(src).not.toMatch(/fetch\(\s*['"]\/['"]/);
    expect(src).toContain('window.location.pathname');
    expect(src).toMatch(/fetch\(\s*submitUrl/);
  });

  it('attaches the generated PDF under the pdf_attachment field', () => {
    expect(src).toContain("netlifyFormData.set('pdf_attachment'");
  });

  it('keeps a client-side submission-timing guard for spam protection', () => {
    expect(src).toContain('MIN_SUBMIT_DELAY_SECONDS');
    expect(src).toContain("'too-fast'");
  });
});

describe('netlify.toml – forms declaration', () => {
  const src = readFileSync('netlify.toml', 'utf-8');

  it('declares the "inquiry" form with the bot-field honeypot', () => {
    expect(src).toMatch(/name = "inquiry"[\s\S]{0,80}honeypot = "bot-field"/);
  });
});

describe('layouts – cache-busting for immutable static assets', () => {
  // netlify.toml serves /assets/* with `Cache-Control: ... immutable` for a
  // full year. Without a cache-busting query string, browsers that already
  // cached an older inquiry-form.js would never fetch a fixed version after
  // a deploy, silently reproducing already-fixed bugs (e.g. the form
  // submitting to the redirected "/" root). Every script/stylesheet tag
  // referencing a local /assets/js or /assets/css file must therefore be
  // versioned via buildMeta.version.
  const templatesWithLocalAssets = [
    'src/_includes/layouts/base.njk',
    'src/_includes/layouts/blog-post.njk',
    'src/pages/de/konfigurator.njk',
    'src/pages/en/configurator.njk',
  ];

  it('appends buildMeta.version to every local /assets/js or /assets/css reference', () => {
    for (const template of templatesWithLocalAssets) {
      const src = readFileSync(template, 'utf-8');
      const tags = src.match(/(?:src|href)="\/assets\/(?:js|css)\/[^"]*"/g) || [];
      expect(tags.length, `expected ${template} to reference local assets`).toBeGreaterThan(0);
      for (const tag of tags) {
        expect(tag, `${template}: ${tag} is missing the buildMeta.version cache-buster`).toContain(
          '?v={{ buildMeta.version }}'
        );
      }
    }
  });

  it('computes buildMeta.version from the current git commit (with a fallback)', () => {
    const src = readFileSync('src/_data/buildMeta.js', 'utf-8');
    expect(src).toContain('git rev-parse --short HEAD');
    expect(src).toContain('module.exports');
  });
});
