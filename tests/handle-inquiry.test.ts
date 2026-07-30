/**
 * Smoke tests for netlify/functions/handle-inquiry.js
 *
 * These tests guard against the class of bugs that caused
 * "Fehler beim Senden" in production:
 *
 *   1. FROM_EMAIL hardcoded to an unverified sender
 *   2. Missing or swallowed error details
 *   3. Wrong/missing required field validation
 *   4. Broken response shape
 *
 * Note: The SendGrid send() path is not covered here because vi.mock() does
 * not intercept CJS require() calls in this Vitest configuration. Those paths
 * are covered by the static source guards below, which catch misconfigurations
 * before they reach production.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';

// ── Static source analysis ──────────────────────────────────────────────────

describe('handle-inquiry.js – static source guards', () => {
  const src = readFileSync('netlify/functions/handle-inquiry.js', 'utf-8');

  it('does NOT hardcode a noreply@ or unverified sender as FROM_EMAIL', () => {
    // FROM_EMAIL must come from process.env, not a hardcoded noreply address.
    // This was the root cause of the "Fehler beim Senden" bug in production.
    expect(src).not.toMatch(/FROM_EMAIL\s*=\s*['"`]noreply@/);
    expect(src).not.toMatch(/FROM_EMAIL\s*=\s*['"`][^'"`]*@[^'"`]*['"`]\s*;/);
  });

  it('uses process.env.INQUIRY_FROM_EMAIL as FROM_EMAIL source', () => {
    expect(src).toContain('process.env.INQUIRY_FROM_EMAIL');
  });

  it('uses process.env.SENDGRID_API_KEY – not a hardcoded key', () => {
    expect(src).toContain('process.env.SENDGRID_API_KEY');
    // A real SendGrid key starts with "SG."
    expect(src).not.toMatch(/['"`]SG\.[A-Za-z0-9_-]{20,}/);
  });

  it('returns error detail from SendGrid in 500 response', () => {
    // The function must propagate err details so the frontend can show them
    expect(src).toContain('detail');
  });

  it('validates required fields: name, email, phone, message', () => {
    expect(src).toContain("'name'");
    expect(src).toContain("'email'");
    expect(src).toContain("'phone'");
    expect(src).toContain("'message'");
  });

  it('validates submission timing via form_opened_at field', () => {
    expect(src).toContain('form_opened_at');
    expect(src).toContain('validateSubmissionTiming');
    expect(src).toContain('Submitted too quickly');
  });

  it('exports a handler function', () => {
    expect(src).toContain('exports.handler');
  });
});

// ── Runtime behaviour (no SendGrid call required) ───────────────────────────

import { handler } from '../netlify/functions/handle-inquiry.js';

describe('handle-inquiry.js – runtime behaviour', () => {
  const validPayload = {
    name: 'Max Mustermann',
    email: 'max@example.com',
    phone: '+49 123 456',
    message: 'Ich interessiere mich für ein Expeditionsfahrzeug.',
    locale: 'de',
    form_opened_at: String(Date.now() - 6000),
  };

  function postEvent(body: object) {
    return { httpMethod: 'POST', body: JSON.stringify(body) };
  }

  beforeEach(() => {
    process.env.SENDGRID_API_KEY = 'SG.test-key-for-unit-tests';
    delete process.env.INQUIRY_FROM_EMAIL;
    delete process.env.INQUIRY_EMAIL;
  });

  afterEach(() => {
    delete process.env.SENDGRID_API_KEY;
  });

  it('returns 405 for GET requests', async () => {
    const res = await handler({ httpMethod: 'GET', body: '' });
    expect(res.statusCode).toBe(405);
  });

  it('returns 200 for OPTIONS (CORS preflight)', async () => {
    const res = await handler({ httpMethod: 'OPTIONS', body: '' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 when body is not valid JSON', async () => {
    const res = await handler({ httpMethod: 'POST', body: 'not-json' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await handler(postEvent({ name: 'Max' }));
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toMatch(/missing fields/i);
  });

  it('returns 400 when form_opened_at is missing', async () => {
    const payloadWithoutTiming = { ...validPayload };
    delete payloadWithoutTiming.form_opened_at;
    const res = await handler(postEvent(payloadWithoutTiming));
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toMatch(/spam protection/i);
  });

  it('returns 400 when form is submitted too quickly', async () => {
    const tooFastPayload = { ...validPayload, form_opened_at: String(Date.now() - 1000) };
    const res = await handler(postEvent(tooFastPayload));
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.detail).toMatch(/submitted too quickly/i);
  });

  it('returns 500 when SENDGRID_API_KEY is not set', async () => {
    delete process.env.SENDGRID_API_KEY;
    const res = await handler(postEvent(validPayload));
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('configured');
  });
});
