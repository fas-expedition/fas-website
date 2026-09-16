/**
 * Smoke tests for netlify/functions/sevdesk-webhook.js
 *
 * This function is invoked by Netlify's "Outgoing webhook" form notification
 * whenever the "inquiry" form (now submitted directly to Netlify Forms) is
 * received. It is a pure side-effect: SevDesk contact + draft offer creation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { handler } from '../netlify/functions/sevdesk-webhook.js';

// ── Static source analysis ──────────────────────────────────────────────────

describe('sevdesk-webhook.js – static source guards', () => {
  const src = readFileSync('netlify/functions/sevdesk-webhook.js', 'utf-8');

  it('reads the token from process.env.SEVDESK_API_TOKEN – not a hardcoded token', () => {
    expect(src).toContain('process.env.SEVDESK_API_TOKEN');
  });

  it('checks a shared secret from process.env.SEVDESK_WEBHOOK_SECRET', () => {
    expect(src).toContain('process.env.SEVDESK_WEBHOOK_SECRET');
  });

  it('only acts on the "inquiry" form', () => {
    expect(src).toContain("formName !== 'inquiry'");
  });

  it('exports a handler function', () => {
    expect(src).toContain('exports.handler');
  });
});

// ── Runtime behaviour ────────────────────────────────────────────────────────

describe('sevdesk-webhook.js – runtime behaviour', () => {
  function postEvent(body: object, secret?: string) {
    return {
      httpMethod: 'POST',
      queryStringParameters: secret ? { secret } : null,
      body: JSON.stringify(body),
    };
  }

  const netlifyPayload = {
    payload: {
      form_name: 'inquiry',
      data: {
        name: 'Max Mustermann',
        email: 'max@example.com',
        message: 'Ich interessiere mich für ein Expeditionsfahrzeug.',
        details_basisfahrzeug_seilwinde: 'Seilwinde',
      },
    },
  };

  afterEach(() => {
    delete process.env.SEVDESK_API_TOKEN;
    delete process.env.SEVDESK_WEBHOOK_SECRET;
  });

  it('returns 405 for GET requests', async () => {
    const res = await handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(405);
  });

  it('returns 200 and skips when SEVDESK_API_TOKEN is not set', async () => {
    delete process.env.SEVDESK_API_TOKEN;
    const res = await handler(postEvent(netlifyPayload));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).skipped).toBe(true);
  });

  it('returns 400 when body is not valid JSON', async () => {
    process.env.SEVDESK_API_TOKEN = 'test-token';
    const res = await handler({ httpMethod: 'POST', body: 'not-json', queryStringParameters: null });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 when the secret does not match', async () => {
    process.env.SEVDESK_API_TOKEN = 'test-token';
    process.env.SEVDESK_WEBHOOK_SECRET = 'correct-secret';
    const res = await handler(postEvent(netlifyPayload, 'wrong-secret'));
    expect(res.statusCode).toBe(401);
  });

  it('accepts the request when the secret matches', async () => {
    process.env.SEVDESK_API_TOKEN = 'test-token';
    process.env.SEVDESK_WEBHOOK_SECRET = 'correct-secret';
    // fetch is not mocked here, so the outbound SevDesk call will fail –
    // the handler must still respond 200 (SevDesk errors are non-fatal).
    const res = await handler(postEvent(netlifyPayload, 'correct-secret'));
    expect(res.statusCode).toBe(200);
  });

  it('skips (200) for forms other than "inquiry"', async () => {
    process.env.SEVDESK_API_TOKEN = 'test-token';
    const contactPayload = { payload: { form_name: 'contact', data: {} } };
    const res = await handler(postEvent(contactPayload));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).skipped).toBe(true);
  });

  it('never throws when the SevDesk API call fails (non-fatal)', async () => {
    process.env.SEVDESK_API_TOKEN = 'test-token';
    const res = await handler(postEvent(netlifyPayload));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
  });
});
