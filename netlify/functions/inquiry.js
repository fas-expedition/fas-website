/**
 * Netlify Function: Handle inquiry form submissions and send emails
 * This function receives form data and sends it to Formspree for email delivery
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
    // Parse form data
    const data = JSON.parse(event.body);

    // Formspree endpoint (configure in environment variables or use directly)
    const formspreeEndpoint = 'https://formspree.io/f/YOUR_FORMSPREE_ID';

    // Prepare email data
    const emailData = {
      name: data.name,
      street: data.street,
      postal: data.postal,
      country: data.country,
      email: data.email,
      phone: data.phone,
      message: data.message,
      locale: data.locale,
      _subject: `Neue Anfrage von ${data.name}`,
      _replyto: data.email
    };

    // Send to Formspree
    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Formspree error: ${response.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Inquiry submitted successfully'
      })
    };
  } catch (error) {
    console.error('Inquiry submission error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
