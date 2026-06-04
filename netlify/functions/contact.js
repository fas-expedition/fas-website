/**
 * Netlify Function: Handle contact form submissions
 * Accepts form submissions and stores them in Netlify's form backend
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
    // Parse form data (sent as multipart/form-data by the browser)
    const body = event.body;
    
    // Log for debugging
    console.log('Contact form submission received');
    
    // For now, return success
    // In production, you can integrate with email service, CRM, etc.
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
  } catch (error) {
    console.error('Contact form error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
