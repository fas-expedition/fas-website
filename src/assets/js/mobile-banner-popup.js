export const MOBILE_BANNER_DISMISSED_KEY = 'fasMobileBannerDismissed';
const MOBILE_BANNER_DISMISSED_VALUE = 'true';
const MOBILE_BANNER_DISMISSED_CLASS = 'mobile-banner-dismissed';

function logStorageUnavailable(error) {
  console.warn('Mobile banner session state is unavailable.', error);
}

export function isMobileBannerDismissed(storage) {
  try {
    return storage.getItem(MOBILE_BANNER_DISMISSED_KEY) === MOBILE_BANNER_DISMISSED_VALUE;
  } catch (error) {
    logStorageUnavailable(error);
    return false;
  }
}

export function markMobileBannerDismissed(storage) {
  try {
    storage.setItem(MOBILE_BANNER_DISMISSED_KEY, MOBILE_BANNER_DISMISSED_VALUE);
    return true;
  } catch (error) {
    logStorageUnavailable(error);
    return false;
  }
}

function hidePopup(rootElement, popup) {
  rootElement.classList.add(MOBILE_BANNER_DISMISSED_CLASS);
  popup.style.display = 'none';
  popup.setAttribute('aria-hidden', 'true');
}

export function createMobileBannerController({ popup, closeButton, storage, rootElement }) {
  function dismissPopup() {
    markMobileBannerDismissed(storage);
    hidePopup(rootElement, popup);
  }

  function init() {
    if (isMobileBannerDismissed(storage)) {
      hidePopup(rootElement, popup);
    }

    closeButton.addEventListener('click', dismissPopup);
  }

  return {
    dismissPopup,
    init,
  };
}

function initMobileBannerPopup() {
  const popup = document.getElementById('mobile-banner-popup');
  const closeButton = document.getElementById('mobile-banner-close');

  if (!popup || !closeButton) {
    return;
  }

  createMobileBannerController({
    popup,
    closeButton,
    storage: window.sessionStorage,
    rootElement: document.documentElement,
  }).init();
}

if (typeof document !== 'undefined') {
  initMobileBannerPopup();
}
