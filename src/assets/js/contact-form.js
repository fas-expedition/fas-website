/**
 * Contact form handler
 * POSTs to /.netlify/functions/handle-contact (SendGrid).
 * Includes a 5-second timing gate to block obvious bot submissions.
 */

(function () {
  const MIN_SUBMIT_DELAY_MS = 5000;

  function initContactForm() {
    const form = document.querySelector('form[name="kontakt"], form[name="contact"]');
    if (!form) return;

    // Record when the page loaded so we can measure time-to-submit
    const openedAt = String(Date.now());

    const isDE = form.getAttribute('name') === 'kontakt';

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = isDE ? 'Wird gesendet\u2026' : 'Sending\u2026';

      removeMessages(form);

      try {
        const name    = form.querySelector('input[name="name"]')?.value?.trim()       || '';
        const email   = form.querySelector('input[name="email"]')?.value?.trim()      || '';
        const phone   = form.querySelector('input[name="phone"]')?.value?.trim()      || '';
        const message = form.querySelector('textarea[name="message"]')?.value?.trim() || '';

        if (!name || !email || !message) {
          throw new Error('missing-fields');
        }

        const elapsedMs = Date.now() - Number(openedAt);
        if (elapsedMs < MIN_SUBMIT_DELAY_MS) {
          throw new Error('too-fast');
        }

        const response = await fetch('/.netlify/functions/handle-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            message,
            locale: isDE ? 'de' : 'en',
            form_opened_at: openedAt,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(function () { return {}; });
          throw new Error(err.detail || err.error || 'server-error');
        }

        showSuccess(form, isDE);
        form.reset();
      } catch (err) {
        showError(form, isDE, err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
      }
    });
  }

  function removeMessages(form) {
    form.parentElement.querySelectorAll('[data-message-type]').forEach(function (el) {
      el.remove();
    });
  }

  function showSuccess(form, isDE) {
    removeMessages(form);
    var div = document.createElement('div');
    div.setAttribute('data-message-type', 'success');
    div.className = 'bg-green-950 border border-green-800 rounded-lg p-6 mb-8';
    div.innerHTML = isDE
      ? '<p class="text-green-300 font-semibold">\u2713 Vielen Dank f\u00fcr Ihre Anfrage!</p><p class="text-green-200 text-sm mt-2">Wir haben Ihre Nachricht erhalten und setzen uns so bald wie m\u00f6glich mit Ihnen in Verbindung.</p>'
      : '<p class="text-green-300 font-semibold">\u2713 Thank you for your inquiry!</p><p class="text-green-200 text-sm mt-2">We have received your message and will get back to you as soon as possible.</p>';
    form.parentElement.insertBefore(div, form);
    setTimeout(function () { div.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }

  function showError(form, isDE, errorCode) {
    removeMessages(form);
    var div = document.createElement('div');
    div.setAttribute('data-message-type', 'error');
    div.className = 'bg-red-950 border border-red-800 rounded-lg p-6 mb-8';

    var msg;
    if (errorCode === 'too-fast') {
      msg = isDE
        ? '<p class="text-red-300 font-semibold">\u2715 Zu schnell</p><p class="text-red-200 text-sm mt-2">Bitte warte mindestens 5 Sekunden, bevor Du das Formular absendest.</p>'
        : '<p class="text-red-300 font-semibold">\u2715 Too fast</p><p class="text-red-200 text-sm mt-2">Please wait at least 5 seconds before submitting the form.</p>';
    } else {
      msg = isDE
        ? '<p class="text-red-300 font-semibold">\u2715 Fehler bei der \u00dcbermittlung</p><p class="text-red-200 text-sm mt-2">Es gab ein Problem beim Senden Ihrer Nachricht. Bitte versuchen Sie es sp\u00e4ter erneut oder kontaktieren Sie uns direkt unter <a href="mailto:info@fas-expedition.de" class="underline">info@fas-expedition.de</a>.</p>'
        : '<p class="text-red-300 font-semibold">\u2715 Submission Error</p><p class="text-red-200 text-sm mt-2">There was a problem sending your message. Please try again later or contact us directly at <a href="mailto:info@fas-expedition.de" class="underline">info@fas-expedition.de</a>.</p>';
    }
    div.innerHTML = msg;
    form.parentElement.insertBefore(div, form);
    setTimeout(function () { div.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
