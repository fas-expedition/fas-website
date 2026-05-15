// form.js - Contact form validation and submission

/**
 * Create a form handler for the configurator contact form.
 * @param {Object} store - The state store instance
 * @param {string} locale - Current locale ('de' or 'en')
 * @param {Object} uiStrings - Locale-specific UI strings
 * @returns {{ validateForm: Function, isValidEmail: Function, submit: Function }}
 */
export function createFormHandler(store, locale, uiStrings) {
  /**
   * Validate the contact form fields.
   * @param {Object} contact - { name, email, phone, company, notes }
   * @returns {{ valid: boolean, errors: Object }}
   */
  function validateForm(contact) {
    const errors = {};

    if (!contact.name || !contact.name.trim()) {
      errors.name = uiStrings['form.error.nameRequired'];
    }

    if (!contact.email || !contact.email.trim()) {
      errors.email = uiStrings['form.error.emailRequired'];
    } else if (!isValidEmail(contact.email)) {
      errors.email = uiStrings['form.error.emailInvalid'];
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Validate an email address format.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Submit the form to Netlify Forms via AJAX.
   * @param {HTMLFormElement} formElement - The form DOM element
   * @returns {Promise<{ success: boolean, errors?: Object }>}
   */
  async function submit(formElement) {
    const state = store.getState();

    // Serialize configuration into hidden field
    const configField = formElement.querySelector('#form-configuration');
    if (configField) {
      configField.value = JSON.stringify({
        platform: state.selections.platform,
        cabinSize: state.selections.cabinSize,
        equipmentLine: state.selections.equipmentLine,
        accessories: state.selections.accessories,
      });
    }

    // Determine the submission URL from form action or fallback
    const actionUrl = formElement.getAttribute('action')
      || (typeof window !== 'undefined' ? window.location.pathname : '/');

    try {
      const formData = new FormData(formElement);
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      });

      if (response.ok) {
        return { success: true };
      }
      return { success: false, errors: { submit: uiStrings['form.error.submitFailed'] } };
    } catch (e) {
      return { success: false, errors: { submit: uiStrings['form.error.submitFailed'] } };
    }
  }

  return { validateForm, isValidEmail, submit };
}
