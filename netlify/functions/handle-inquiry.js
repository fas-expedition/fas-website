/**
 * Netlify Function: Handle Inquiry Form Submission
 * Receives form data, sends email notifications via SendGrid
 */

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const INQUIRY_EMAIL = process.env.INQUIRY_EMAIL || 'inquiry@fas-expedition.de';

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse form data
    const data = JSON.parse(event.body);

    // Validate required fields
    const required = ['name', 'email', 'phone', 'message'];
    for (const field of required) {
      if (!data[field]) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Missing required field: ${field}` })
        };
      }
    }

    // Log submission
    console.log('Inquiry form submitted:', {
      name: data.name,
      email: data.email,
      vehicle: data.base_vehicle_model,
      locale: data.locale,
      timestamp: new Date().toISOString()
    });

    // Prepare email content
    const isGerman = data.locale === 'de';
    const emailSubject = isGerman 
      ? `Neue Anfrage von ${data.name}`
      : `New inquiry from ${data.name}`;

    const emailContent = `
${isGerman ? 'Neue Anfrage erhalten!' : 'New inquiry received!'}

${isGerman ? 'Name:' : 'Name:'} ${data.name}
${isGerman ? 'E-Mail:' : 'Email:'} ${data.email}
${isGerman ? 'Telefon:' : 'Phone:'} ${data.phone}
${isGerman ? 'Straße:' : 'Street:'} ${data.street || '-'}
${isGerman ? 'PLZ/Ort:' : 'Postal/City:'} ${data.postal || '-'}
${isGerman ? 'Land:' : 'Country:'} ${data.country || '-'}

${isGerman ? 'Basisfahrzeug:' : 'Base Vehicle:'} ${data.base_vehicle_model || '-'}
${data.base_vehicle_custom ? `(${data.base_vehicle_custom})` : ''}

${isGerman ? 'Nachricht:' : 'Message:'}
${data.message}

${data.selectedDetails ? `\n${isGerman ? 'Ausgewählte Details:' : 'Selected Details:'}\n${data.selectedDetails}` : ''}

${data.specialWishes ? `\n${isGerman ? 'Spezielle Wünsche:' : 'Special Wishes:'}\n${data.specialWishes}` : ''}

---
${isGerman ? 'Zeitstempel:' : 'Timestamp:'} ${new Date().toISOString()}
${isGerman ? 'Sprache:' : 'Language:'} ${isGerman ? 'Deutsch' : 'English'}
    `;

    // Send email to inquiry address
    await sgMail.send({
      to: INQUIRY_EMAIL,
      from: 'noreply@fas-expedition.de',
      replyTo: data.email,
      subject: emailSubject,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    });

    // Send confirmation email to customer
    const confirmSubject = isGerman
      ? 'Anfrage erhalten - FAS Expedition'
      : 'Inquiry received - FAS Expedition';

    const confirmContent = `
${isGerman ? 'Vielen Dank für deine Anfrage!' : 'Thank you for your inquiry!'}

${isGerman ? 'Wir haben deine Nachricht erhalten und werden uns in Kürze bei dir melden.' : 'We have received your message and will contact you shortly.'}

${isGerman ? 'Mit freundlichen Grüßen,' : 'Best regards,'}
FAS Expedition GmbH
    `;

    await sgMail.send({
      to: data.email,
      from: 'noreply@fas-expedition.de',
      subject: confirmSubject,
      text: confirmContent,
      html: confirmContent.replace(/\n/g, '<br>')
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: true,
        message: 'Inquiry submitted successfully'
      })
    };
  } catch (error) {
    console.error('Error processing inquiry:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to process inquiry'
      })
    };
  }
};
