(function() {
  const popup = document.getElementById('contact-trigger-popup');
  if (!popup || popup.dataset.contactPopupInitialized === 'true') return;

  popup.dataset.contactPopupInitialized = 'true';

  const SESSION_PAGE_VIEWS_KEY = 'fasContactPopupPageViews';
  const SESSION_FIRST_SEEN_KEY = 'fasContactPopupFirstSeen';
  const SESSION_SHOWN_KEY = 'fasContactPopupShown';
  const DISMISSED_UNTIL_KEY = 'fasContactPopupDismissedUntil';
  const TIME_TRIGGER_MS = 60 * 1000;
  const PAGE_VIEW_TRIGGER = 3;
  const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

  function getStorageValue(storage, key, fallback) {
    try {
      return storage.getItem(key) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function setStorageValue(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch (error) {
      // Storage can be unavailable in strict privacy modes; the popup still works for this page view.
    }
  }

  const now = Date.now();
  const pageViews = Number(getStorageValue(sessionStorage, SESSION_PAGE_VIEWS_KEY, '0')) + 1;
  const firstSeen = Number(getStorageValue(sessionStorage, SESSION_FIRST_SEEN_KEY, String(now)));

  setStorageValue(sessionStorage, SESSION_PAGE_VIEWS_KEY, String(pageViews));
  setStorageValue(sessionStorage, SESSION_FIRST_SEEN_KEY, String(firstSeen));

  function isDismissed() {
    return Number(getStorageValue(localStorage, DISMISSED_UNTIL_KEY, '0')) > Date.now();
  }

  function markDismissed() {
    setStorageValue(localStorage, DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DURATION_MS));
  }

  function showPopup() {
    if (getStorageValue(sessionStorage, SESSION_SHOWN_KEY, '') === 'true' || isDismissed()) return;

    setStorageValue(sessionStorage, SESSION_SHOWN_KEY, 'true');
    popup.classList.remove('hidden');

    requestAnimationFrame(function() {
      popup.classList.remove('opacity-0', 'translate-y-4');
    });
  }

  function hidePopup() {
    popup.classList.add('opacity-0', 'translate-y-4');

    window.setTimeout(function() {
      popup.classList.add('hidden');
    }, 300);
  }

  function dismissPopup() {
    markDismissed();
    hidePopup();
  }

  popup.querySelectorAll('.contact-popup-close').forEach(function(button) {
    button.addEventListener('click', dismissPopup);
  });

  popup.querySelectorAll('.contact-popup-action').forEach(function(action) {
    action.addEventListener('click', function() {
      setStorageValue(sessionStorage, SESSION_SHOWN_KEY, 'true');
      hidePopup();
    });
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && !popup.classList.contains('hidden')) {
      dismissPopup();
    }
  });

  if (pageViews >= PAGE_VIEW_TRIGGER) {
    showPopup();
    return;
  }

  const elapsed = now - firstSeen;
  const remaining = TIME_TRIGGER_MS - elapsed;

  if (remaining <= 0) {
    showPopup();
  } else {
    window.setTimeout(showPopup, remaining);
  }
})();
