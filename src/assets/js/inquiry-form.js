/**
 * Inquiry Form Modal Handler
 * Manages opening, closing, and submission of the inquiry form modal
 * Submits data to Netlify Forms for email notification
 * Integrates Google Tag Manager event tracking
 */
(function() {
  const inquiryFormModal = document.getElementById('inquiry-form');
  const inquiryFormElement = document.getElementById('inquiry-form-element');
  const closeButtons = document.querySelectorAll('.inquiry-form-close');
  const primaryButtons = document.querySelectorAll('[href="#inquiry-form"]');

  if (!inquiryFormModal) return;

  /**
   * Open the inquiry form modal
   */
  function openForm(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    inquiryFormModal.classList.remove('hidden');
    inquiryFormModal.classList.add('flex');
    inquiryFormElement.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    
    // Track form open event with GTM
    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.open('inquiry');
    }
  }

  /**
   * Close the inquiry form modal
   */
  function closeForm() {
    inquiryFormModal.classList.add('hidden');
    inquiryFormModal.classList.remove('flex');
    document.body.style.overflow = '';
    
    // Track form close event with GTM
    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.close('inquiry', false);
    }
  }

  /**
   * Handle form submission - send to Netlify Forms via AJAX
   * Per Netlify requirements: POST with URL-encoded body, no redirects
   */
  function handleSubmit(e) {
    e.preventDefault();

    // Collect selected details checkboxes
    const selectedDetails = [];
    document.querySelectorAll('.inquiry-detail-checkbox:checked').forEach(checkbox => {
      selectedDetails.push(checkbox.value);
    });

    // Get form data
    const formData = {
      'form-name': 'inquiry',  // Required: tells Netlify which form this is
      'name': document.getElementById('inquiry-name').value,
      'street': document.getElementById('inquiry-street').value,
      'postal': document.getElementById('inquiry-postal').value,
      'country': document.getElementById('inquiry-country').value,
      'email': document.getElementById('inquiry-email').value,
      'phone': document.getElementById('inquiry-phone').value,
      'message': document.getElementById('inquiry-message').value,
      'locale': document.getElementById('inquiry-locale').value,
      'selectedDetails': selectedDetails.join(', '),
      'specialWishes': document.getElementById('inquiry-special-wishes')?.value || '',
      'base_vehicle_model': document.getElementById('base_vehicle_model')?.value || '',
      'base_vehicle_custom': document.getElementById('base_vehicle_custom')?.value || ''
    };

    // Show loading state
    const submitButton = inquiryFormElement.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = document.documentElement.lang === 'de' ? 'Wird gesendet...' : 'Sending...';
    submitButton.disabled = true;

    // Track form submission with GTM BEFORE submitting
    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.submit('inquiry', {
        name: formData.name,
        email: formData.email,
        base_vehicle_model: formData.base_vehicle_model,
        message_length: formData.message.length
      });
      gtmTracking.conversion.inquirySubmitted({
        email: formData.email,
        vehicle_model: formData.base_vehicle_model,
        message_length: formData.message.length
      });
    }

    // Submit to Netlify Forms via hidden form element
    const netlifyForm = document.querySelector('form[name="inquiry"]');
    
    // Populate the hidden Netlify form with submission data
    netlifyForm.querySelector('input[name="name"]').value = formData.name;
    netlifyForm.querySelector('input[name="street"]').value = formData.street;
    netlifyForm.querySelector('input[name="postal"]').value = formData.postal;
    netlifyForm.querySelector('input[name="country"]').value = formData.country;
    netlifyForm.querySelector('input[name="email"]').value = formData.email;
    netlifyForm.querySelector('input[name="phone"]').value = formData.phone;
    netlifyForm.querySelector('textarea[name="message"]').value = formData.message;
    netlifyForm.querySelector('input[name="locale"]').value = formData.locale;
    netlifyForm.querySelector('input[name="selectedDetails"]').value = formData.selectedDetails;
    netlifyForm.querySelector('textarea[name="specialWishes"]').value = formData.specialWishes;
    netlifyForm.querySelector('input[name="base_vehicle_model"]').value = formData.base_vehicle_model;
    netlifyForm.querySelector('input[name="base_vehicle_custom"]').value = formData.base_vehicle_custom;
    
    // Submit the hidden form directly to Netlify (this bypasses AJAX and ensures Netlify receives it)
    // Netlify will handle the submission and email notification
    netlifyForm.submit();
  }

  /**
   * Close modal when clicking on background
   */
  function handleBackgroundClick(e) {
    if (e.target === inquiryFormModal) {
      closeForm();
    }
  }

  /**
   * Close modal with Escape key
   */
  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeForm();
    }
  }

  /**
   * Toggle details expander
   */
  function toggleDetailsSection() {
    const detailsContent = document.getElementById('inquiry-details-content');
    const toggleIcon = document.getElementById('inquiry-toggle-icon');
    
    detailsContent.classList.toggle('hidden');
    toggleIcon.style.transform = detailsContent.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    
    // Scroll to top when expanding details
    inquiryFormElement.scrollTop = 0;
  }

  // Event listeners for opening the form
  primaryButtons.forEach(btn => {
    btn.addEventListener('click', openForm);
  });

  // Event listener for details toggle
  const detailsToggle = document.getElementById('inquiry-details-toggle');
  if (detailsToggle) {
    detailsToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDetailsSection();
    });
  }

  // Event listeners for closing the form
  closeButtons.forEach(btn => {
    btn.addEventListener('click', closeForm);
  });

  // Background click to close
  inquiryFormModal.addEventListener('click', handleBackgroundClick);

  // Escape key to close
  document.addEventListener('keydown', handleEscapeKey);

  // Form submission
  inquiryFormElement.addEventListener('submit', handleSubmit);

  // Base vehicle model selection - show/hide custom vehicle field
  const baseVehicleSelect = document.getElementById('base_vehicle_model');
  const customVehicleField = document.getElementById('custom_vehicle_field');
  if (baseVehicleSelect && customVehicleField) {
    baseVehicleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'anderes Fahrgestell') {
        customVehicleField.classList.remove('hidden');
      } else {
        customVehicleField.classList.add('hidden');
      }
    });
  }
  // File input handler - show/hide filenames
  const fileInput = document.getElementById('inquiry-documents');
  const fileDisplay = document.getElementById('inquiry-documents-display');
  if (fileInput && fileDisplay) {
    // Click display to open file picker
    fileDisplay.addEventListener('click', () => {
      fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        const fileNames = Array.from(fileInput.files).map(f => f.name).join(', ');
        fileDisplay.textContent = fileNames;
        fileDisplay.classList.remove('text-zinc-400');
        fileDisplay.classList.add('text-white');
      } else {
        const locale = document.getElementById('inquiry-locale').value;
        fileDisplay.textContent = locale === 'de' ? 'Klicken zum Hochladen' : 'Click to Upload';
        fileDisplay.classList.remove('text-white');
        fileDisplay.classList.add('text-zinc-400');
      }
    });
  }})();
