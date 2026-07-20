/**
 * Inquiry Form Modal Handler
 * Manages opening, closing, and submission of the inquiry form modal.
 *
 * Submission flow (hybrid):
 *  1. Collect all form fields into a structured data object
 *  2. Generate a PDF via window.generateInquiryPDF (inquiry-pdf.js)
 *  3. POST JSON (form data + PDF base64) to /.netlify/functions/handle-inquiry
 *     → Function sends email with PDF attachment via SendGrid
 *  4. Also POST URL-encoded backup to Netlify Forms (silent, best-effort)
 *  5. Show success/error state in the modal (no page navigation)
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

    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.close('inquiry', false);
    }
  }

  /**
   * Collect all form data into a structured object including:
   * - All text/select inputs by name
   * - checkboxes: array of {name, value} for all checked .inquiry-detail-checkbox elements
   * - selectedDetails: comma-joined values for Netlify Forms backup
   */
  function collectFormData() {
    const locale = document.getElementById('inquiry-locale')?.value || 'de';

    // All checked detail checkboxes
    const checkboxes = [];
    document.querySelectorAll('.inquiry-detail-checkbox:checked').forEach(function(cb) {
      checkboxes.push({ name: cb.name, value: cb.value });
    });

    // Helper: get trimmed value of an element by ID
    function val(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    return {
      // Customer data
      name: val('inquiry-name'),
      street: val('inquiry-street'),
      postal: val('inquiry-postal'),
      country: val('inquiry-country'),
      email: val('inquiry-email'),
      phone: val('inquiry-phone'),
      message: val('inquiry-message'),
      locale,

      // Vehicle
      base_vehicle_model: val('base_vehicle_model'),
      base_vehicle_custom: val('base_vehicle_custom'),

      // Bare cabin dimensions & options
      bare_cabin_length: val('bare_cabin_length'),
      bare_cabin_width: val('bare_cabin_width'),
      bare_cabin_height: val('bare_cabin_height'),
      bare_cabin_paintwork: val('bare_cabin_paintwork'),
      bare_cabin_color_code: val('bare_cabin_color_code'),
      bare_cabin_treppe: val('bare_cabin_treppe'),
      bare_cabin_tuer: val('bare_cabin_tuer'),

      // Windows
      side_window_klein: val('side_window_klein'),
      side_window_gross: val('side_window_gross'),
      side_window_panorama: val('side_window_panorama'),
      roof_window_klein: val('roof_window_klein'),
      roof_window_gross: val('roof_window_gross'),

      // Special items
      bare_cabin_special_items: val('bare_cabin_special_items'),

      // Interior
      energy_battery_capacity: val('energy_battery_capacity'),
      water_tank_capacity: val('water_tank_capacity'),
      climate_heating_model: val('climate_heating_model'),
      climate_air_conditioning: val('climate_air_conditioning'),
      cooling_type: val('cooling_type'),
      cooling_freezer_option: val('cooling_freezer_option'),
      shower_wc_type: val('shower_wc_type'),
      shower_wc_toilet_type: val('shower_wc_toilet_type'),

      // Special wishes
      special_wishes: val('inquiry-special-wishes'),

      // Checkboxes (structured for PDF)
      checkboxes,
      // Flat string for Netlify Forms backup
      selected_details: checkboxes.map(function(c) { return c.value; }).join(', '),
    };
  }

  /**
   * Show success state inside the modal (replaces form content).
   */
  function showSuccess(locale) {
    const isDE = locale === 'de';
    const container = inquiryFormElement.parentElement;
    inquiryFormElement.style.display = 'none';

    const successDiv = document.createElement('div');
    successDiv.id = 'inquiry-success';
    successDiv.className = 'p-8 flex flex-col items-center justify-center text-center space-y-6';
    successDiv.innerHTML =
      '<svg class="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
      '</svg>' +
      '<h3 class="text-2xl font-bold tracking-wider uppercase">' +
        (isDE ? 'Anfrage erhalten!' : 'Inquiry received!') +
      '</h3>' +
      '<p class="text-zinc-400 max-w-sm">' +
        (isDE
          ? 'Vielen Dank für deine Anfrage. Du erhältst in Kürze eine Bestätigung per E-Mail. Wir melden uns so schnell wie möglich bei dir.'
          : 'Thank you for your inquiry. You will receive a confirmation email shortly. We will get back to you as soon as possible.') +
      '</p>' +
      '<button id="inquiry-success-close" class="bg-white text-black px-8 py-3 font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors">' +
        (isDE ? 'Schließen' : 'Close') +
      '</button>';
    container.appendChild(successDiv);

    document.getElementById('inquiry-success-close').addEventListener('click', function() {
      closeForm();
      // Restore form for next open
      inquiryFormElement.style.display = '';
      successDiv.remove();
    });
  }

  /**
   * Show inline error message and re-enable submit button.
   */
  function showError(submitButton, originalText, locale) {
    const isDE = locale === 'de';
    submitButton.textContent = originalText;
    submitButton.disabled = false;

    let errorMsg = document.getElementById('inquiry-error-msg');
    if (!errorMsg) {
      errorMsg = document.createElement('p');
      errorMsg.id = 'inquiry-error-msg';
      errorMsg.className = 'text-red-400 text-sm text-center';
      submitButton.parentElement.parentElement.insertBefore(errorMsg, submitButton.parentElement.nextSibling);
    }
    errorMsg.textContent = isDE
      ? 'Fehler beim Senden. Bitte versuche es erneut oder schreibe uns direkt an info@fas-expedition.de.'
      : 'Error sending inquiry. Please try again or contact us directly at info@fas-expedition.de.';
  }

  /**
   * Main submit handler:
   * 1. Generate PDF
   * 2. POST to Netlify Function (email + PDF attachment)
   * 3. Backup POST to Netlify Forms (silent)
   * 4. Show success or error
   */
  async function handleSubmit(e) {
    e.preventDefault();

    const submitButton = inquiryFormElement.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    const locale = document.getElementById('inquiry-locale')?.value || 'de';
    const isDE = locale === 'de';

    // Show loading state
    submitButton.textContent = isDE ? 'Wird gesendet…' : 'Sending…';
    submitButton.disabled = true;

    // Remove previous error if any
    const prevErr = document.getElementById('inquiry-error-msg');
    if (prevErr) prevErr.remove();

    const formData = collectFormData();

    // ── GTM tracking ──
    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.submit('inquiry', {
        name: formData.name,
        email: formData.email,
        base_vehicle_model: formData.base_vehicle_model,
        message_length: formData.message.length,
      });
      gtmTracking.conversion.inquirySubmitted({
        email: formData.email,
        vehicle_model: formData.base_vehicle_model,
        message_length: formData.message.length,
      });
    }

    // ── Generate PDF ──
    let pdfBase64 = null;
    let pdfFilename = null;
    try {
      if (typeof window.generateInquiryPDF === 'function') {
        const pdf = await window.generateInquiryPDF(formData, locale);
        pdfBase64 = pdf.base64;
        pdfFilename = pdf.filename;
      }
    } catch (pdfErr) {
      console.warn('PDF generation failed (continuing without attachment):', pdfErr);
    }

    // ── POST to Netlify Function ──
    let functionSuccess = false;
    try {
      const response = await fetch('/.netlify/functions/handle-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({}, formData, { pdfBase64, pdfFilename })),
      });
      if (response.ok) {
        functionSuccess = true;
      } else {
        const err = await response.json().catch(function() { return {}; });
        console.error('Function error:', response.status, err);
      }
    } catch (fetchErr) {
      console.error('Function fetch failed:', fetchErr);
    }

    // ── Netlify Forms backup (best-effort, silent) ──
    try {
      const netlifyPayload = new URLSearchParams({
        'form-name': 'inquiry',
        name: formData.name,
        street: formData.street,
        postal: formData.postal,
        country: formData.country,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        locale: formData.locale,
        selectedDetails: formData.selected_details,
        specialWishes: formData.special_wishes,
        base_vehicle_model: formData.base_vehicle_model,
        base_vehicle_custom: formData.base_vehicle_custom,
      });
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: netlifyPayload.toString(),
      });
    } catch (_) {
      // Netlify Forms backup is best-effort; ignore errors
    }

    // ── Show result ──
    if (functionSuccess) {
      showSuccess(locale);
    } else {
      showError(submitButton, originalText, locale);
    }
  }

  /**
   * Toggle details expander
   */
  function toggleDetailsSection() {
    const detailsContent = document.getElementById('inquiry-details-content');
    const toggleIcon = document.getElementById('inquiry-toggle-icon');

    detailsContent.classList.toggle('hidden');
    toggleIcon.style.transform = detailsContent.classList.contains('hidden')
      ? 'rotate(0deg)'
      : 'rotate(180deg)';

    inquiryFormElement.scrollTop = 0;
  }

  // ── Event listeners ──────────────────────────────────────────────────────

  primaryButtons.forEach(function(btn) {
    btn.addEventListener('click', openForm);
  });

  closeButtons.forEach(function(btn) {
    btn.addEventListener('click', closeForm);
  });

  inquiryFormModal.addEventListener('click', function(e) {
    if (e.target === inquiryFormModal) closeForm();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeForm();
  });

  inquiryFormElement.addEventListener('submit', handleSubmit);

  const detailsToggle = document.getElementById('inquiry-details-toggle');
  if (detailsToggle) {
    detailsToggle.addEventListener('click', function(e) {
      e.preventDefault();
      toggleDetailsSection();
    });
  }

  // Base vehicle model → show/hide custom field
  const baseVehicleSelect = document.getElementById('base_vehicle_model');
  const customVehicleField = document.getElementById('custom_vehicle_field');
  if (baseVehicleSelect && customVehicleField) {
    baseVehicleSelect.addEventListener('change', function(e) {
      if (e.target.value === 'anderes Fahrgestell') {
        customVehicleField.classList.remove('hidden');
      } else {
        customVehicleField.classList.add('hidden');
      }
    });
  }

  // File input → show selected filenames
  const fileInput = document.getElementById('inquiry-documents');
  const fileDisplay = document.getElementById('inquiry-documents-display');
  if (fileInput && fileDisplay) {
    fileDisplay.addEventListener('click', function() {
      fileInput.click();
    });
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        const names = Array.from(fileInput.files).map(function(f) { return f.name; }).join(', ');
        fileDisplay.textContent = names;
        fileDisplay.classList.remove('text-zinc-400');
        fileDisplay.classList.add('text-white');
      } else {
        const loc = document.getElementById('inquiry-locale')?.value;
        fileDisplay.textContent = loc === 'de' ? 'Klicken zum Hochladen' : 'Click to Upload';
        fileDisplay.classList.remove('text-white');
        fileDisplay.classList.add('text-zinc-400');
      }
    });
  }
})();
