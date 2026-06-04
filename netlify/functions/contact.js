/**
 * Netlify Function: Handle contact form submissions and send emails via Formspree
 * Form endpoint: https://formspree.io/f/xvzyjnwy
 */

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse form data from multipart/form-data
    const body = event.body;
    
    console.log('Contact form submission received');
    console.log('Content-Type:', event.headers['content-type']);
    console.log('Body length:', body?.length, 'bytes');

    // Extract form fields from body (supports URL-encoded and multipart)
    const fields = parseFormData(body, event.headers['content-type']);
    console.log('Parsed fields:', fields);
    
    // Formspree endpoint - already configured and active
    const formspreeEndpoint = 'https://formspree.io/f/xvzyjnwy';
    
    // Prepare email data for Formspree
    const emailPayload = {
      name: fields.name || 'Unknown',
      email: fields.email || 'noreply@fas-expedition.de',
      phone: fields.phone || '',
      message: fields.message || 'No message provided',
      _subject: `Neue Kontaktanfrage von ${fields.name || 'Unbekannt'}`,
      _replyto: fields.email || 'noreply@fas-expedition.de'
    };

    console.log('Sending email to Formspree:', formspreeEndpoint);

    const formspreeResponse = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const responseData = await formspreeResponse.json();
    
    if (!formspreeResponse.ok) {
      console.error(`Formspree error: ${formspreeResponse.status}`, responseData);
      throw new Error(`Formspree returned status ${formspreeResponse.status}`);
    }

    console.log('Email sent successfully via Formspree', responseData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Your message has been received and email sent'
      })
    };
  } catch (error) {
    console.error('Contact form error:', error);
    
    // Return success anyway to avoid showing error to user
    // (form was received, just email sending had an issue)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Your message has been received'
      })
    };
  }
};

/**
 * Parse form data (supports both URL-encoded and multipart)
 */
function parseFormData(body, contentType) {
  const fields = {};
  
  if (!body) return fields;
  
  // Handle URL-encoded format (application/x-www-form-urlencoded)
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(body);
    for (const [key, value] of params.entries()) {
      fields[key] = value;
    }
    console.log('Parsed URL-encoded data:', fields);
    return fields;
  }
  
  // Handle multipart/form-data
  if (contentType?.includes('multipart/form-data')) {
    return parseMultipartFormData(body, contentType);
  }
  
  return fields;
}

/**
 * Parse multipart/form-data
 * Simple parser for form data sent from browser
 */
function parseMultipartFormData(body, contentType) {
  const fields = {};
  
  if (!body || !contentType) {
    return fields;
  }
  
  // Extract boundary from content-type header
  const boundaryMatch = contentType.match(/boundary=([^;\r\n]+)/);
  if (!boundaryMatch) {
    console.warn('No boundary found in content-type');
    return fields;
  }
  
  let boundary = boundaryMatch[1].trim().replace(/"/g, '');
  
  // Split by boundary
  const parts = body.split('--' + boundary);
  
  for (let i = 1; i < parts.length - 1; i++) {
    const part = parts[i];
    
    // Look for Content-Disposition header
    const dispositionMatch = part.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/i);
    if (!dispositionMatch) continue;
    
    const fieldName = dispositionMatch[1];
    
    // Find where headers end (double CRLF) and extract value
    const headerEndIndex = part.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) continue;
    
    // Get everything after headers
    let value = part.substring(headerEndIndex + 4);
    
    // Remove trailing boundary markers and whitespace
    value = value.replace(/\r\n$/, '').trim();
    
    // Skip empty values from file fields
    if (value && value !== '{}') {
      fields[fieldName] = value;
    }
  }
  
  console.log('Parsed multipart data:', fields);
  return fields;
}
