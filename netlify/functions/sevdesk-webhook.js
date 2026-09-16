/**
 * Netlify Function: sevdesk-webhook
 *
 * Receives Netlify Forms' "Outgoing webhook" notification for the "inquiry"
 * form and (optionally) creates a SevDesk contact + draft offer from it.
 *
 * The inquiry form itself is now submitted directly to Netlify Forms
 * (see src/assets/js/inquiry-form.js). This function is a side-effect only –
 * it does not process the submission itself, Netlify already stored it.
 *
 * Setup (manual, Netlify dashboard – cannot be configured via netlify.toml):
 *   1. Site settings → Forms → Form notifications → Add notification
 *      → Outgoing webhook
 *   2. Form: "inquiry"
 *   3. URL: https://<your-site>/.netlify/functions/sevdesk-webhook?secret=<SEVDESK_WEBHOOK_SECRET>
 *
 * Required environment variables (Netlify dashboard → Site settings → Env):
 *   SEVDESK_API_TOKEN     – SevDesk API token. Absence disables this function entirely
 *                           (it responds 200 without doing anything, so Netlify doesn't retry).
 *   SEVDESK_WEBHOOK_SECRET – shared secret checked against the "secret" query
 *                            parameter above, to stop random requests from
 *                            triggering SevDesk entries.
 *
 * See netlify/sevdesk-mapping.json for the checkbox → SevDesk article mapping.
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  // Feature flag: do nothing (but succeed) if SevDesk isn't configured.
  if (!process.env.SEVDESK_API_TOKEN) {
    console.log('[sevdesk-webhook] SEVDESK_API_TOKEN not set – skipping');
    return json(200, { skipped: true });
  }

  // Shared-secret check so this endpoint can't be triggered by arbitrary requests.
  const expectedSecret = process.env.SEVDESK_WEBHOOK_SECRET;
  if (expectedSecret) {
    const providedSecret = event.queryStringParameters && event.queryStringParameters.secret;
    if (providedSecret !== expectedSecret) {
      return json(401, { error: 'Invalid secret' });
    }
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (_) {
    return json(400, { error: 'Invalid JSON' });
  }

  // Netlify's outgoing webhook payload shape: { payload: { form_name, data, ... } }
  const payload = body.payload || body;
  const formName = payload.form_name;
  const data = payload.data || {};

  if (formName !== 'inquiry') {
    // Not our form (e.g. "contact") – ignore, but respond 200 so Netlify is happy.
    return json(200, { skipped: true, reason: `form "${formName}" not handled` });
  }

  try {
    await createSevDeskEntry(reconstructInquiryData(data));
    return json(200, { success: true });
  } catch (err) {
    console.error('[sevdesk-webhook] SevDesk error:', err.message);
    // Return 200 anyway – the Netlify Forms submission itself already succeeded;
    // a SevDesk failure must not make Netlify treat/retry this as a form error.
    return json(200, { success: false, error: err.message });
  }
};

/**
 * Turn Netlify's flat submission field map back into the { name, email,
 * message, checkboxes: [{name, value}] } shape createSevDeskEntry() expects.
 * Checkboxes are recovered by matching the mapping file's known field names
 * against the flat data (an unchecked checkbox is simply absent from `data`).
 */
function reconstructInquiryData(data) {
  let mapping = {};
  try {
    mapping = require('../sevdesk-mapping.json').fields || {};
  } catch (_) {}

  const checkboxes = Object.keys(mapping)
    .filter((fieldName) => Boolean(data[fieldName]))
    .map((fieldName) => ({ name: fieldName, value: data[fieldName] }));

  return {
    name: data.name || '',
    email: data.email || '',
    message: data.message || '',
    checkboxes,
  };
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

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}
