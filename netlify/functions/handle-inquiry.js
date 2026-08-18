/**
 * Netlify Function: handle-inquiry
 *
 * Receives structured inquiry form data (JSON) including an optional
 * base64-encoded PDF generated client-side. Sends a formatted HTML email
 * with the PDF attached via SendGrid.
 *
 * Also contains a SevDesk stub (activated by setting SEVDESK_API_TOKEN).
 *
 * Required environment variables (Netlify dashboard → Site settings → Env):
 *   SENDGRID_API_KEY      – SendGrid API key (mark as Secret)
 *   INQUIRY_EMAIL         – recipient address (default: stefan.klug@fas-expedition.de)
 *   INQUIRY_FROM_EMAIL    – verified sender address in SendGrid
 *                           MUST match a verified Single Sender or domain in SendGrid!
 *                           (default: stefan.klug@fas-expedition.de)
 *
 * Optional:
 *   SEVDESK_API_TOKEN  – activates SevDesk contact + offer creation
 */

const sgMail = require('@sendgrid/mail');
const MIN_SUBMIT_DELAY_MS = 5000;

const INQUIRY_EMAIL = process.env.INQUIRY_EMAIL || 'stefan.klug@fas-expedition.de';
// FROM_EMAIL must be a verified sender in your SendGrid account.
// → SendGrid dashboard → Settings → Sender Authentication → Single Sender Verification
const FROM_EMAIL = process.env.INQUIRY_FROM_EMAIL || 'stefan.klug@fas-expedition.de';

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

  // Validate required fields
  const missing = ['name', 'email', 'phone', 'message'].filter((f) => !data[f]);
  if (missing.length) {
    return cors(400, JSON.stringify({ error: `Missing fields: ${missing.join(', ')}` }));
  }

  const timingValidationError = validateSubmissionTiming(data.form_opened_at);
  if (timingValidationError) {
    return cors(400, JSON.stringify({ error: 'Spam protection validation failed', detail: timingValidationError }));
  }

  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not set');
    return cors(500, JSON.stringify({ error: 'Email service not configured' }));
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const isDE = data.locale === 'de';
  const now = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

  try {
    // ── Internal notification email ────────────────────────────────────────
    const subject = isDE
      ? `Neue Kundenanfrage von ${data.name}`
      : `New customer inquiry from ${data.name}`;

    const html = buildHtmlEmail(data, isDE, now);

    const msg = {
      to: INQUIRY_EMAIL,
      from: { email: FROM_EMAIL, name: 'FAS Expedition Website' },
      replyTo: { email: data.email, name: data.name },
      subject,
      html,
      text: buildTextEmail(data, isDE, now),
    };

    // Attach PDF if provided
    if (data.pdfBase64 && data.pdfFilename) {
      msg.attachments = [
        {
          content: data.pdfBase64,
          filename: data.pdfFilename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ];
    }

    const [notifResult] = await sgMail.send(msg);
    console.log(`[handle-inquiry] Notification email accepted by SendGrid: status=${notifResult?.statusCode}, to=${INQUIRY_EMAIL}, from=${FROM_EMAIL}, customer=${data.email}`);

    // ── Customer confirmation email ────────────────────────────────────────
    const confirmMsg = {
      to: data.email,
      from: { email: FROM_EMAIL, name: 'FAS Expedition GmbH' },
      subject: isDE
        ? 'Ihre Anfrage bei FAS Expedition – Eingangsbestätigung'
        : 'Your inquiry at FAS Expedition – Confirmation',
      html: buildConfirmationEmail(data, isDE),
    };
    try {
      await sgMail.send(confirmMsg);
      console.log(`[handle-inquiry] Confirmation email sent to customer: ${data.email}`);
    } catch (confirmErr) {
      // Log but don't fail – customer confirmation is non-critical
      console.warn('[handle-inquiry] Customer confirmation failed (non-fatal):', confirmErr.message);
    }

    // ── SevDesk integration (optional) ────────────────────────────────────
    if (process.env.SEVDESK_API_TOKEN) {
      try {
        await createSevDeskEntry(data);
      } catch (sevErr) {
        // Log but don't fail the whole request
        console.error('SevDesk error (non-fatal):', sevErr.message);
      }
    }

    return cors(200, JSON.stringify({ success: true }));
  } catch (err) {
    const sgErrors = err.response?.body?.errors;
    const detail = sgErrors ? JSON.stringify(sgErrors) : err.message;
    console.error('SendGrid error:', detail);
    return cors(500, JSON.stringify({ error: 'Failed to send email', detail }));
  }
};

// ── HTML email builder ────────────────────────────────────────────────────────

function buildHtmlEmail(d, isDE, now) {
  const cb = d.checkboxes || [];
  const byPrefix = (prefix) =>
    cb
      .filter((c) => c.name.startsWith(prefix))
      .map((c) => `<li>${esc(c.value)}</li>`)
      .join('');

  const section = (title, content) =>
    content
      ? `<tr><td style="padding:12px 0 4px;font-size:11px;font-weight:bold;text-transform:uppercase;color:#888;border-bottom:1px solid #e5e5e5;letter-spacing:1px">${title}</td></tr>
         <tr><td style="padding:8px 0 12px">${content}</td></tr>`
      : '';

  const row = (label, value) =>
    value
      ? `<tr><td style="padding:2px 0;font-size:13px"><span style="color:#888;min-width:160px;display:inline-block">${label}:</span> <strong>${esc(value)}</strong></td></tr>`
      : '';

  const listBlock = (items) =>
    items ? `<ul style="margin:4px 0;padding-left:20px;font-size:13px">${items}</ul>` : '';

  const dims = [d.bare_cabin_length, d.bare_cabin_width, d.bare_cabin_height].filter(Boolean).join(' × ');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
<table width="600" style="background:#fff;margin:0 auto;border:1px solid #e5e5e5">
  <tr><td style="background:#000;padding:20px 24px">
    <span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:2px">FAS EXPEDITION</span>
    <span style="color:#888;font-size:11px;display:block;margin-top:4px">${isDE ? 'Neue Kundenanfrage' : 'New Customer Inquiry'} – ${now}</span>
  </td></tr>
  <tr><td style="padding:24px">
    <table width="100%">
      ${section(isDE ? 'Kundendaten' : 'Customer Information', `
        <table>
          ${row('Name', d.name)}
          ${row(isDE ? 'Straße' : 'Street', d.street)}
          ${row(isDE ? 'PLZ / Ort' : 'Postal / City', d.postal)}
          ${row(isDE ? 'Land' : 'Country', d.country)}
          ${row('E-Mail', `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`)}
          ${row(isDE ? 'Telefon' : 'Phone', d.phone)}
          ${row(isDE ? 'Sprache' : 'Language', isDE ? 'Deutsch' : 'English')}
        </table>`)}
      ${section(isDE ? 'Nachricht' : 'Message',
        `<p style="font-size:13px;white-space:pre-wrap;background:#f9f9f9;padding:12px;border-left:3px solid #000">${esc(d.message)}</p>`)}
      ${d.base_vehicle_model || cb.some((c) => c.name.startsWith('details_basisfahrzeug'))
        ? section(isDE ? 'Fahrzeugkonfiguration' : 'Vehicle Configuration', `
            <table>
              ${row(isDE ? 'Modell' : 'Model', d.base_vehicle_model)}
              ${d.base_vehicle_custom ? row(isDE ? 'Angabe' : 'Specification', d.base_vehicle_custom) : ''}
            </table>
            ${listBlock(byPrefix('details_basisfahrzeug'))}
            ${dims ? `<p style="font-size:13px"><span style="color:#888">${isDE ? 'Kabinenmaße' : 'Cabin dims'}:</span> <strong>${esc(dims)} m</strong></p>` : ''}
            ${row(isDE ? 'Lackierung' : 'Paintwork', d.bare_cabin_paintwork)}
            ${row(isDE ? 'Farbcode' : 'Color Code', d.bare_cabin_color_code)}
            ${row(isDE ? 'Treppe' : 'Staircase', d.bare_cabin_treppe)}
            ${row(isDE ? 'Tür' : 'Door', d.bare_cabin_tuer)}
            ${listBlock(byPrefix('details_stauklappen') + byPrefix('details_leerkabine') + byPrefix('details_schnittstellen') + byPrefix('details_innenausbau') + byPrefix('sleeping_') + byPrefix('cooking_') + byPrefix('appliance_') + byPrefix('bathroom_') + byPrefix('water_sep') + byPrefix('climate_floor') + byPrefix('upgrade_') + byPrefix('details_zusatz') + byPrefix('garagen_'))}
            ${row(isDE ? 'Batteriekapazität' : 'Battery Capacity', d.energy_battery_capacity)}
            ${row(isDE ? 'Wasserkapazität' : 'Water Capacity', d.water_tank_capacity)}
            ${row(isDE ? 'Heizmodell' : 'Heating Model', d.climate_heating_model)}
            ${row(isDE ? 'Klimaanlage' : 'Air Conditioning', d.climate_air_conditioning)}
            ${row(isDE ? 'Kühltyp' : 'Cooling', d.cooling_type)}
            ${row(isDE ? 'Nasszelle' : 'Wet Room', d.shower_wc_type)}
            ${row(isDE ? 'Toilette' : 'Toilet', d.shower_wc_toilet_type)}`)
        : ''}
      ${section(isDE ? 'Spezielle Wünsche' : 'Special Requests',
        d.special_wishes
          ? `<p style="font-size:13px;white-space:pre-wrap;background:#f9f9f9;padding:12px;border-left:3px solid #ccc">${esc(d.special_wishes)}</p>`
          : '')}
    </table>
    ${d.pdfFilename ? `<p style="font-size:12px;color:#666;margin-top:16px">📎 ${isDE ? 'PDF-Anhang' : 'PDF attachment'}: <strong>${esc(d.pdfFilename)}</strong></p>` : ''}
  </td></tr>
  <tr><td style="background:#f5f5f5;padding:12px 24px;font-size:11px;color:#999;text-align:center">
    FAS Expedition GmbH · Trafoweg 2-4 · 52152 Lammersdorf
  </td></tr>
</table>
</body></html>`;
}

function buildTextEmail(d, isDE, now) {
  const cb = (d.checkboxes || []).map((c) => `  • ${c.value}`).join('\n');
  return [
    isDE ? `NEUE KUNDENANFRAGE – ${now}` : `NEW CUSTOMER INQUIRY – ${now}`,
    '',
    isDE ? 'KUNDENDATEN' : 'CUSTOMER INFORMATION',
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    `Phone: ${d.phone}`,
    `Address: ${[d.street, d.postal, d.country].filter(Boolean).join(', ')}`,
    '',
    isDE ? 'NACHRICHT' : 'MESSAGE',
    d.message,
    cb ? `\n${isDE ? 'KONFIGURATION' : 'CONFIGURATION'}\n${cb}` : '',
    d.special_wishes ? `\n${isDE ? 'SPEZIELLE WÜNSCHE' : 'SPECIAL REQUESTS'}\n${d.special_wishes}` : '',
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

function buildConfirmationEmail(d, isDE) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
<table width="600" style="background:#fff;margin:0 auto;border:1px solid #e5e5e5">
  <tr><td style="background:#000;padding:20px 24px">
    <span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:2px">FAS EXPEDITION</span>
  </td></tr>
  <tr><td style="padding:32px 24px">
    <h2 style="margin-top:0">${isDE ? `Hallo ${esc(d.name)},` : `Hello ${esc(d.name)},`}</h2>
    <p>${isDE
      ? 'vielen Dank für deine Anfrage. Wir haben sie erhalten und werden uns so schnell wie möglich bei dir melden.'
      : 'thank you for your inquiry. We have received it and will get back to you as soon as possible.'}</p>
    <p style="color:#888;font-size:13px">${isDE
      ? 'Falls du noch Fragen hast, erreichst du uns jederzeit unter <a href="mailto:info@fas-expedition.de">info@fas-expedition.de</a> oder +49 (0) 2473 929 3422.'
      : 'If you have any questions, you can reach us at <a href="mailto:info@fas-expedition.de">info@fas-expedition.de</a> or +49 (0) 2473 929 3422.'}</p>
    <p style="margin-bottom:0">${isDE ? 'Mit freundlichen Grüßen,<br><strong>FAS Expedition GmbH</strong>' : 'Best regards,<br><strong>FAS Expedition GmbH</strong>'}</p>
  </td></tr>
  <tr><td style="background:#f5f5f5;padding:12px 24px;font-size:11px;color:#999;text-align:center">
    FAS Expedition GmbH · Trafoweg 2-4 · 52152 Lammersdorf · <a href="https://fas-expedition.de" style="color:#999">fas-expedition.de</a>
  </td></tr>
</table>
</body></html>`;
}

// ── SevDesk stub ─────────────────────────────────────────────────────────────
// Activate by setting SEVDESK_API_TOKEN in Netlify environment variables.
// See netlify/sevdesk-mapping.json for the article ID mapping.

async function createSevDeskEntry(data) {
  const token = process.env.SEVDESK_API_TOKEN;
  const baseUrl = 'https://my.sevdesk.de/api/v1';
  const headers = {
    Authorization: token,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // 1. Create contact (Interessent, Category 28)
  const contactRes = await fetch(`${baseUrl}/Contact`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      objectName: 'Contact',
      surename: data.name.split(' ').slice(0, -1).join(' ') || data.name,
      familyname: data.name.split(' ').slice(-1)[0] || '',
      category: { id: 28, objectName: 'Category' }, // Interessent
    }),
  });
  if (!contactRes.ok) throw new Error(`SevDesk contact creation failed: ${contactRes.status}`);
  const contactData = await contactRes.json();
  const contactId = contactData.objects?.id;
  if (!contactId) throw new Error('SevDesk contact ID missing');

  // 2. Add email
  await fetch(`${baseUrl}/CommunicationWay`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      objectName: 'CommunicationWay',
      type: 'EMAIL',
      value: data.email,
      key: { id: 2, objectName: 'CommunicationWayKey' }, // Arbeit
      contact: { id: contactId, objectName: 'Contact' },
      main: true,
    }),
  });

  // 3. Create offer draft (AN) with checked items as positions
  // Load mapping to resolve sevdesk_part_id for each checked checkbox
  let mapping = {};
  try {
    mapping = require('../sevdesk-mapping.json').fields || {};
  } catch (_) {}

  const positions = (data.checkboxes || [])
    .map((cb, i) => {
      const entry = mapping[cb.name];
      const pos = {
        objectName: 'OrderPos',
        mapAll: true,
        positionNumber: i,
        name: cb.value,
        quantity: 1,
        price: 0,
        taxRate: 19,
        unity: { id: 1, objectName: 'Unity' },
      };
      if (entry && entry.sevdesk_part_id) {
        pos.part = { id: entry.sevdesk_part_id, objectName: 'Part' };
      }
      return pos;
    });

  if (positions.length === 0) {
    // Add at least a note position
    positions.push({
      objectName: 'OrderPos',
      mapAll: true,
      positionNumber: 0,
      name: data.message || 'Kundenanfrage',
      quantity: 1,
      price: 0,
      taxRate: 19,
      unity: { id: 1, objectName: 'Unity' },
    });
  }

  const orderPayload = {
    order: {
      objectName: 'Order',
      mapAll: true,
      orderType: 'AN',
      status: 100, // Draft
      currency: 'EUR',
      header: `Angebot – ${data.name}`,
      headText: data.message || '',
      contact: { id: contactId, objectName: 'Contact' },
      orderDate: new Date().toLocaleDateString('de-DE'),
    },
    orderPosSave: positions,
    orderPosDelete: null,
    takeDefaultAddress: false,
  };

  const orderRes = await fetch(`${baseUrl}/Order/Factory/saveOrder`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderPayload),
  });
  if (!orderRes.ok) {
    const errBody = await orderRes.text();
    throw new Error(`SevDesk order creation failed: ${orderRes.status} – ${errBody}`);
  }
  console.log('SevDesk offer draft created for contact', contactId);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function validateSubmissionTiming(openedAtRaw) {
  if (!openedAtRaw) return 'Missing form_opened_at timestamp';

  const openedAt = Number(openedAtRaw);
  if (!Number.isFinite(openedAt)) return 'Invalid form_opened_at timestamp';

  const elapsedMs = Date.now() - openedAt;
  if (elapsedMs < 0) return 'Invalid form_opened_at timestamp';
  if (elapsedMs < MIN_SUBMIT_DELAY_MS) return `Submitted too quickly (${elapsedMs}ms)`;

  return null;
}
