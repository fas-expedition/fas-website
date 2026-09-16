/**
 * Inquiry Form Modal Handler
 * Manages opening, closing, and submission of the inquiry form modal.
 *
 * Submission flow (Netlify Forms):
 *  1. Collect all form fields into a structured data object (for PDF generation)
 *  2. Generate a PDF via window.generateInquiryPDF (inquiry-pdf.js)
 *  3. Build a FormData from the real <form> (captures every text/select/checkbox field)
 *     and attach the generated PDF as a file under "pdf_attachment"
 *  4. POST the FormData to "/" → Netlify Forms stores the submission (incl. PDF file)
 *     and triggers whatever notifications are configured in the Netlify dashboard
 *  5. Show success/error state in the modal (no page navigation)
 */
(function() {
  const MIN_SUBMIT_DELAY_SECONDS = 5;
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
    const openedAtField = document.getElementById('inquiry-opened-at');
    if (openedAtField) {
      openedAtField.value = String(Date.now());
    }

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
      form_opened_at: val('inquiry-opened-at'),

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
  function showError(submitButton, originalText, locale, detail) {
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
    const base = isDE
      ? 'Fehler beim Senden. Bitte versuche es erneut oder schreibe uns direkt an info@fas-expedition.de.'
      : 'Error sending inquiry. Please try again or contact us directly at info@fas-expedition.de.';
    const timingText = isDE
      ? `Bitte warte mindestens ${MIN_SUBMIT_DELAY_SECONDS} Sekunden vor dem Absenden.`
      : `Please wait at least ${MIN_SUBMIT_DELAY_SECONDS} seconds before submitting.`;
    const isTimingError = detail === 'too-fast';
    errorMsg.textContent = isTimingError ? timingText : (detail && detail !== 'submit-failed' ? base + ' (' + detail + ')' : base);
  }

  /**
   * Convert a base64 string (no data-URI prefix) into a Blob.
   */
  function base64ToBlob(base64, mimeType) {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  }

  /**
   * Main submit handler:
   * 1. Generate PDF from the collected form data
   * 2. Build a FormData snapshot of the real form (captures every field + checked checkboxes)
   * 3. Attach the generated PDF as a file under "pdf_attachment"
   * 4. POST to Netlify Forms ("/") and show success or error
   */
  async function handleSubmit(e) {
    e.preventDefault();

    const submitButton = inquiryFormElement.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    const locale = document.getElementById('inquiry-locale')?.value || 'de';
    const isDE = locale === 'de';

    // Remove previous error if any
    const prevErr = document.getElementById('inquiry-error-msg');
    if (prevErr) prevErr.remove();

    // ── Client-side spam timing guard (mirrors previous server-side check) ──
    const openedAtField = document.getElementById('inquiry-opened-at');
    const openedAt = openedAtField ? Number(openedAtField.value) : NaN;
    if (Number.isFinite(openedAt) && Date.now() - openedAt < MIN_SUBMIT_DELAY_SECONDS * 1000) {
      showError(submitButton, originalText, locale, 'too-fast');
      return;
    }

    // Show loading state
    submitButton.textContent = isDE ? 'Wird gesendet…' : 'Sending…';
    submitButton.disabled = true;

    const collectedData = collectFormData();

    // ── GTM tracking ──
    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.submit('inquiry', {
        name: collectedData.name,
        email: collectedData.email,
        base_vehicle_model: collectedData.base_vehicle_model,
        message_length: collectedData.message.length,
        submit_delay_seconds: collectedData.form_opened_at
          ? Math.floor((Date.now() - Number(collectedData.form_opened_at)) / 1000)
          : null,
      });
      gtmTracking.conversion.inquirySubmitted({
        email: collectedData.email,
        vehicle_model: collectedData.base_vehicle_model,
        message_length: collectedData.message.length,
        submit_delay_seconds: collectedData.form_opened_at
          ? Math.floor((Date.now() - Number(collectedData.form_opened_at)) / 1000)
          : null,
      });
    }

    // ── Generate PDF ──
    let pdfBase64 = null;
    let pdfFilename = null;
    try {
      if (typeof window.generateInquiryPDF === 'function') {
        const pdf = await window.generateInquiryPDF(collectedData, locale);
        pdfBase64 = pdf.base64;
        pdfFilename = pdf.filename;
      }
    } catch (pdfErr) {
      console.warn('PDF generation failed (continuing without attachment):', pdfErr);
    }

    // ── Populate the flattened "selected_details" summary field before snapshotting ──
    const selectedDetailsField = document.getElementById('inquiry-selected-details');
    if (selectedDetailsField) {
      selectedDetailsField.value = collectedData.selected_details;
    }

    // ── Build FormData from the real form (captures all text/select/checkbox fields) ──
    const netlifyFormData = new FormData(inquiryFormElement);

    // Netlify Forms supports only one file per field; keep at most the first
    // user-selected document to avoid submission errors from the "documents" field.
    const documentFiles = netlifyFormData.getAll('documents').filter(function(f) { return f && f.size > 0; });
    netlifyFormData.delete('documents');
    if (documentFiles.length > 0) {
      netlifyFormData.set('documents', documentFiles[0]);
    }

    // Attach the generated PDF (overrides the empty placeholder file input)
    if (pdfBase64 && pdfFilename) {
      netlifyFormData.set('pdf_attachment', base64ToBlob(pdfBase64, 'application/pdf'), pdfFilename);
    } else {
      netlifyFormData.delete('pdf_attachment');
    }

    // ── POST to Netlify Forms ──
    let success = false;
    let errorDetail = null;
    try {
      const response = await fetch('/', {
        method: 'POST',
        body: netlifyFormData,
      });
      success = response.ok;
      if (!response.ok) {
        errorDetail = 'HTTP ' + response.status;
        console.error('Netlify Forms submission error:', response.status);
      }
    } catch (fetchErr) {
      errorDetail = 'submit-failed';
      console.error('Netlify Forms fetch failed:', fetchErr);
    }

    // ── Show result ──
    if (success) {
      showSuccess(locale);
    } else {
      showError(submitButton, originalText, locale, errorDetail);
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
