/**
 * Netlify Function: handle-contact
 *
 * Receives contact form submissions (name, email, phone, message, locale)
 * and sends an email notification via SendGrid.
 *
 * Shares the same environment variables as handle-inquiry:
 *   SENDGRID_API_KEY     – SendGrid API key
 *   INQUIRY_EMAIL        – recipient address (default: stefan.klug@fas-expedition.de)
 *   INQUIRY_FROM_EMAIL   – verified sender address in SendGrid
 */

const sgMail = require('@sendgrid/mail');

const CONTACT_EMAIL = process.env.INQUIRY_EMAIL || 'stefan.klug@fas-expedition.de';
const FROM_EMAIL = process.env.INQUIRY_FROM_EMAIL || 'stefan.klug@fas-expedition.de';
const MIN_SUBMIT_DELAY_MS = 5000;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return cors(200, '');
  }
  if (event.httpMethod !== 'POST') {
    return cors(405, JSON.stringify({ error: 'Method not allowed' }));
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (_) {
    return cors(400, JSON.stringify({ error: 'Invalid JSON' }));
  }

  const missing = ['name', 'email', 'message'].filter((f) => !data[f]);
  if (missing.length) {
    return cors(400, JSON.stringify({ error: `Missing fields: ${missing.join(', ')}` }));
  }

  const timingError = validateSubmissionTiming(data.form_opened_at);
  if (timingError) {
    return cors(400, JSON.stringify({ error: 'Spam protection validation failed', detail: timingError }));
  }

  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not set');
    return cors(500, JSON.stringify({ error: 'Email service not configured' }));
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const isDE = data.locale !== 'en';
  const now = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

  try {
    const subject = isDE
      ? `Neue Kontaktanfrage von ${data.name}`
      : `New contact inquiry from ${data.name}`;

    const msg = {
      to: CONTACT_EMAIL,
      from: { email: FROM_EMAIL, name: 'FAS Expedition Website' },
      replyTo: { email: data.email, name: data.name },
      subject,
      html: buildHtml(data, isDE, now),
      text: buildText(data, isDE, now),
    };

    await sgMail.send(msg);
    console.log(`[handle-contact] Email sent: from=${data.email}, to=${CONTACT_EMAIL}`);

    return cors(200, JSON.stringify({ success: true }));
  } catch (err) {
    const detail = err.response?.body?.errors
      ? JSON.stringify(err.response.body.errors)
      : err.message;
    console.error('[handle-contact] SendGrid error:', detail);
    return cors(500, JSON.stringify({ error: 'Failed to send email', detail }));
  }
};

function buildHtml(d, isDE, now) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
<table width="600" style="background:#fff;margin:0 auto;border:1px solid #e5e5e5">
  <tr><td style="background:#000;padding:20px 24px">
    <span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:2px">FAS EXPEDITION</span>
    <span style="color:#888;font-size:11px;display:block;margin-top:4px">${isDE ? 'Kontaktanfrage' : 'Contact Inquiry'} – ${now}</span>
  </td></tr>
  <tr><td style="padding:24px">
    <table width="100%">
      <tr><td style="padding:2px 0;font-size:13px"><span style="color:#888;min-width:100px;display:inline-block">Name:</span> <strong>${esc(d.name)}</strong></td></tr>
      <tr><td style="padding:2px 0;font-size:13px"><span style="color:#888;min-width:100px;display:inline-block">E-Mail:</span> <a href="mailto:${esc(d.email)}">${esc(d.email)}</a></td></tr>
      ${d.phone ? `<tr><td style="padding:2px 0;font-size:13px"><span style="color:#888;min-width:100px;display:inline-block">${isDE ? 'Telefon' : 'Phone'}:</span> <strong>${esc(d.phone)}</strong></td></tr>` : ''}
    </table>
    <div style="margin-top:16px">
      <p style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#888;border-bottom:1px solid #e5e5e5;padding-bottom:4px">${isDE ? 'Nachricht' : 'Message'}</p>
      <p style="font-size:13px;white-space:pre-wrap;background:#f9f9f9;padding:12px;border-left:3px solid #000">${esc(d.message)}</p>
    </div>
  </td></tr>
  <tr><td style="background:#f5f5f5;padding:12px 24px;font-size:11px;color:#999;text-align:center">
    FAS Expedition GmbH · Trafoweg 2-4 · 52152 Lammersdorf
  </td></tr>
</table>
</body></html>`;
}

function buildText(d, isDE, now) {
  return [
    isDE ? `KONTAKTANFRAGE – ${now}` : `CONTACT INQUIRY – ${now}`,
    '',
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    d.phone ? `${isDE ? 'Telefon' : 'Phone'}: ${d.phone}` : '',
    '',
    isDE ? 'NACHRICHT' : 'MESSAGE',
    d.message,
  ].filter(Boolean).join('\n');
}

function validateSubmissionTiming(openedAtRaw) {
  if (!openedAtRaw) return 'Missing form_opened_at timestamp';
  const openedAt = Number(openedAtRaw);
  if (!Number.isFinite(openedAt)) return 'Invalid form_opened_at timestamp';
  const elapsedMs = Date.now() - openedAt;
  if (elapsedMs < 0) return 'Invalid form_opened_at timestamp';
  if (elapsedMs < MIN_SUBMIT_DELAY_MS) return `Submitted too quickly (${elapsedMs}ms)`;
  return null;
}

function cors(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body,
  };
}
