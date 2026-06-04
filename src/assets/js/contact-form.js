/**
 * Handle contact form submissions directly to Formspree
 * Sends JSON data directly without intermediate processing
 */

(function() {
  // Formspree endpoint
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzyjnwy';

  function initContactForm() {
    const form = document.querySelector('form[name="kontakt"], form[name="contact"]');
    
    if (!form) {
      console.log('Contact form not found');
      return;
    }

    console.log('Initializing contact form...');

    // Get the form name to determine language
    const isGerman = form.getAttribute('name') === 'kontakt';
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted');

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      try {
        // Add loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = isGerman ? 'Wird gesendet...' : 'Sending...';

        // Get form values
        const name = form.querySelector('input[name="name"]')?.value?.trim() || '';
        const email = form.querySelector('input[name="email"]')?.value?.trim() || '';
        const phone = form.querySelector('input[name="phone"]')?.value?.trim() || '';
        const message = form.querySelector('textarea[name="message"]')?.value?.trim() || '';

        console.log('Form fields:', { name, email, phone, message });

        // Validate required fields
        if (!name || !email || !message) {
          throw new Error('Missing required fields');
        }

        // Send directly to Formspree as JSON
        console.log('Sending to Formspree:', FORMSPREE_ENDPOINT);
        
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            phone: phone,
            message: message,
            _subject: isGerman ? `Neue Kontaktanfrage von ${name}` : `New contact inquiry from ${name}`,
            _replyto: email
          })
        });

        console.log('Formspree response status:', response.status);
        const result = await response.json();
        console.log('Formspree response:', result);

        if (!response.ok) {
          throw new Error(`Formspree error: ${response.status}`);
        }

        // Success! Show success message
        showSuccessMessage(form, isGerman);
        
        // Reset form
        form.reset();
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
      } catch (error) {
        console.error('Form submission error:', error);
        
        // Show error message
        showErrorMessage(form, isGerman);
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  function showSuccessMessage(form, isGerman) {
    // Remove any existing success/error messages
    const existingMessages = form.parentElement.querySelectorAll('[data-message-type]');
    existingMessages.forEach(msg => msg.remove());
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.setAttribute('data-message-type', 'success');
    successDiv.className = 'bg-green-950 border border-green-800 rounded-lg p-6 mb-8';
    successDiv.innerHTML = isGerman 
      ? '<p class="text-green-300 font-semibold">✓ Vielen Dank für Ihre Anfrage!</p><p class="text-green-200 text-sm mt-2">Wir haben Ihre Nachricht erhalten und setzen uns so bald wie möglich mit Ihnen in Verbindung.</p>'
      : '<p class="text-green-300 font-semibold">✓ Thank you for your inquiry!</p><p class="text-green-200 text-sm mt-2">We have received your message and will get back to you as soon as possible.</p>';
    
    // Insert before form
    form.parentElement.insertBefore(successDiv, form);
    
    // Scroll to message
    setTimeout(() => {
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function showErrorMessage(form, isGerman) {
    // Remove any existing success/error messages
    const existingMessages = form.parentElement.querySelectorAll('[data-message-type]');
    existingMessages.forEach(msg => msg.remove());
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('data-message-type', 'error');
    errorDiv.className = 'bg-red-950 border border-red-800 rounded-lg p-6 mb-8';
    errorDiv.innerHTML = isGerman 
      ? '<p class="text-red-300 font-semibold">✕ Fehler bei der Übermittlung</p><p class="text-red-200 text-sm mt-2">Es gab ein Problem beim Senden Ihrer Nachricht. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.</p>'
      : '<p class="text-red-300 font-semibold">✕ Submission Error</p><p class="text-red-200 text-sm mt-2">There was an issue sending your message. Please try again later or contact us directly.</p>';
    
    // Insert before form
    form.parentElement.insertBefore(errorDiv, form);
    
    // Scroll to message
    setTimeout(() => {
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
