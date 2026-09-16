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
