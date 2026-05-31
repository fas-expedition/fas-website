/**
 * Inquiry Form Modal Handler
 * Manages opening, closing, and submission of the inquiry form modal
 * Submits data to Netlify Forms for email notification
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
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the inquiry form modal
   */
  function closeForm() {
    inquiryFormModal.classList.add('hidden');
    inquiryFormModal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  /**
   * Handle form submission - send to Netlify Function
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
      name: document.getElementById('inquiry-name').value,
      street: document.getElementById('inquiry-street').value,
      postal: document.getElementById('inquiry-postal').value,
      country: document.getElementById('inquiry-country').value,
      email: document.getElementById('inquiry-email').value,
      phone: document.getElementById('inquiry-phone').value,
      message: document.getElementById('inquiry-message').value,
      locale: document.getElementById('inquiry-locale').value,
      selectedDetails: selectedDetails.join(', ')
    };

    // Show loading state
    const submitButton = inquiryFormElement.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = document.documentElement.lang === 'de' ? 'Wird gesendet...' : 'Sending...';
    submitButton.disabled = true;

    // Submit to Netlify Function
    fetch('/.netlify/functions/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show success message
        submitButton.textContent = document.documentElement.lang === 'de' ? 'Erfolgreich gesendet!' : 'Successfully sent!';
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        
        // Reset form after 2 seconds and close
        setTimeout(() => {
          inquiryFormElement.reset();
          submitButton.textContent = originalText;
          submitButton.disabled = false;
          submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
          closeForm();
        }, 2000);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    })
    .catch((error) => {
      // Show error but still close
      console.error('Form submission error:', error);
      submitButton.textContent = document.documentElement.lang === 'de' ? 'Fehler beim Senden' : 'Error sending';
      submitButton.classList.add('bg-red-600');
      
      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('bg-red-600');
        closeForm();
      }, 2000);
    });
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
})();
