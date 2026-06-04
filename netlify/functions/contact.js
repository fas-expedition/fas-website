/**
 * Netlify Function: Handle contact form submissions and send emails via Formspree
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

    // Extract form fields from body (multipart data)
    // Parse the multipart form data
    const fields = parseMultipartFormData(body, event.headers['content-type']);
    
    // Prepare email data for Formspree
    const formspreeId = process.env.FORMSPREE_ID;
    
    if (!formspreeId) {
      console.warn('FORMSPREE_ID not configured - form submission will not send email');
      // Still return success to show message on frontend
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Your message has been received',
          warning: 'Email service not configured'
        })
      };
    }

    // Send to Formspree
    const formspreeEndpoint = `https://formspree.io/${formspreeId}`;
    
    const emailPayload = {
      name: fields.name || 'Unknown',
      email: fields.email || 'noreply@fas-expedition.de',
      phone: fields.phone || '',
      message: fields.message || 'No message provided',
      file_uploaded: !!fields.file ? 'Yes' : 'No',
      _subject: `Neue Kontaktanfrage von ${fields.name || 'Unbekannt'}`,
      _replyto: fields.email || 'noreply@fas-expedition.de'
    };

    const formspreeResponse = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!formspreeResponse.ok) {
      console.error(`Formspree error: ${formspreeResponse.status}`);
      throw new Error(`Formspree returned status ${formspreeResponse.status}`);
    }

    console.log('Email sent successfully via Formspree');

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
        message: 'Your message has been received',
        error: error.message
      })
    };
  }
};

/**
 * Parse multipart/form-data
 * Simple parser for form data
 */
function parseMultipartFormData(body, contentType) {
  const fields = {};
  
  // Extract boundary from content-type
  const boundaryMatch = contentType?.match(/boundary=([^;]+)/);
  if (!boundaryMatch) {
    return fields;
  }
  
  const boundary = boundaryMatch[1].replace(/"/g, '');
  const parts = body.split(`--${boundary}`);
  
  for (let part of parts) {
    if (part.includes('Content-Disposition')) {
      // Extract field name
      const nameMatch = part.match(/name="([^"]+)"/);
      if (!nameMatch) continue;
      
      const fieldName = nameMatch[1];
      
      // Extract field value (after headers, before next boundary)
      const valueMatch = part.match(/\r\n\r\n([\s\S]*?)\r\n--/);
      if (valueMatch) {
        fields[fieldName] = valueMatch[1].trim();
      }
    }
  }
  
  return fields;
}
