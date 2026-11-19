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

    const locale = form.querySelector('[name="locale"]')?.value
      || form.dataset.locale
      || document.documentElement.lang
      || (form.getAttribute('name') === 'kontakt' ? 'de' : 'en');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = message(locale, 'sending');

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
            locale,
            form_opened_at: openedAt,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(function () { return {}; });
          throw new Error(err.detail || err.error || 'server-error');
        }

        showSuccess(form, locale);
        form.reset();
      } catch (err) {
        showError(form, locale, err.message);
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

  function showSuccess(form, locale) {
    removeMessages(form);
    var div = document.createElement('div');
    div.setAttribute('data-message-type', 'success');
    div.className = 'bg-green-950 border border-green-800 rounded-lg p-6 mb-8';
    div.innerHTML = '<p class="text-green-300 font-semibold">\u2713 ' + message(locale, 'successTitle') +
      '</p><p class="text-green-200 text-sm mt-2">' + message(locale, 'successBody') + '</p>';
    form.parentElement.insertBefore(div, form);
    setTimeout(function () { div.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }

  function showError(form, locale, errorCode) {
    removeMessages(form);
    var div = document.createElement('div');
    div.setAttribute('data-message-type', 'error');
    div.className = 'bg-red-950 border border-red-800 rounded-lg p-6 mb-8';

    var msg;
    if (errorCode === 'too-fast') {
      msg = '<p class="text-red-300 font-semibold">\u2715 ' + message(locale, 'tooFastTitle') +
        '</p><p class="text-red-200 text-sm mt-2">' + message(locale, 'tooFastBody') + '</p>';
    } else {
      msg = '<p class="text-red-300 font-semibold">\u2715 ' + message(locale, 'errorTitle') +
        '</p><p class="text-red-200 text-sm mt-2">' + message(locale, 'errorBody') +
        ' <a href="mailto:info@fas-expedition.de" class="underline">info@fas-expedition.de</a>.</p>';
    }

    function message(locale, key) {
      const messages = {
        de: {
          sending: 'Wird gesendet\u2026',
          successTitle: 'Vielen Dank f\u00fcr Ihre Anfrage!',
          successBody: 'Wir haben Ihre Nachricht erhalten und setzen uns so bald wie m\u00f6glich mit Ihnen in Verbindung.',
          tooFastTitle: 'Zu schnell',
          tooFastBody: 'Bitte warten Sie mindestens 5 Sekunden, bevor Sie das Formular absenden.',
          errorTitle: 'Fehler bei der \u00dcbermittlung',
          errorBody: 'Beim Senden Ihrer Nachricht ist ein Problem aufgetreten. Bitte versuchen Sie es sp\u00e4ter erneut oder kontaktieren Sie uns direkt unter',
        },
        en: {
          sending: 'Sending\u2026',
          successTitle: 'Thank you for your inquiry!',
          successBody: 'We have received your message and will get back to you as soon as possible.',
          tooFastTitle: 'Too fast',
          tooFastBody: 'Please wait at least 5 seconds before submitting the form.',
          errorTitle: 'Submission Error',
          errorBody: 'There was a problem sending your message. Please try again later or contact us directly at',
        },
        es: {
          sending: 'Enviando\u2026',
          successTitle: '\u00a1Gracias por tu consulta!',
          successBody: 'Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.',
          tooFastTitle: 'Demasiado rápido',
          tooFastBody: 'Espera al menos 5 segundos antes de enviar el formulario.',
          errorTitle: 'Error al enviar',
          errorBody: 'Ha habido un problema al enviar tu mensaje. Inténtalo más tarde o contacta con nosotros en',
        },
        fr: {
          sending: 'Envoi en cours\u2026',
          successTitle: 'Merci pour votre demande !',
          successBody: 'Nous avons bien reçu votre message et vous répondrons dès que possible.',
          tooFastTitle: 'Trop rapide',
          tooFastBody: 'Veuillez patienter au moins 5 secondes avant d’envoyer le formulaire.',
          errorTitle: 'Échec de l’envoi',
          errorBody: 'Un problème est survenu lors de l’envoi de votre message. Réessayez plus tard ou contactez-nous à',
        },
      };
      return (messages[locale] || messages.en)[key];
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
