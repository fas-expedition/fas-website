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
      selectedDetails: data.selectedDetails || '',
      base_vehicle_model: data.base_vehicle_model || '',
      base_vehicle_custom: data.base_vehicle_custom || '',
      specialWishes: data.specialWishes || '',
      bare_cabin_length: data.bare_cabin_length || '',
      bare_cabin_width: data.bare_cabin_width || '',
      bare_cabin_height: data.bare_cabin_height || '',
      bare_cabin_paintwork: data.bare_cabin_paintwork || '',
      bare_cabin_color_code: data.bare_cabin_color_code || '',
      bare_cabin_treppe: data.bare_cabin_treppe || '',
      bare_cabin_tuer: data.bare_cabin_tuer || '',
      side_window_klein: data.side_window_klein || '',
      side_window_gross: data.side_window_gross || '',
      side_window_panorama: data.side_window_panorama || '',
      roof_window_klein: data.roof_window_klein || '',
      roof_window_gross: data.roof_window_gross || '',
      bare_cabin_special_items: data.bare_cabin_special_items || '',
      energy_battery_capacity: data.energy_battery_capacity || '',
      water_tank_capacity: data.water_tank_capacity || '',
      climate_heating_model: data.climate_heating_model || '',
      climate_air_conditioning: data.climate_air_conditioning || '',
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
