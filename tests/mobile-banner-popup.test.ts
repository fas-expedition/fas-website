import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMobileBannerController,
  isMobileBannerDismissed,
  markMobileBannerDismissed,
  MOBILE_BANNER_DISMISSED_KEY,
} from '../src/assets/js/mobile-banner-popup.js';
import { getBlogHtmlFiles, loadHtml } from './helpers';

function createClassList() {
  const classes = new Set<string>();

  return {
    add(...tokens: string[]) {
      tokens.forEach((token) => classes.add(token));
    },
    remove(...tokens: string[]) {
      tokens.forEach((token) => classes.delete(token));
    },
    contains(token: string) {
      return classes.has(token);
    },
  };
}

function createPopupElement() {
  const attributes = new Map<string, string>();

  return {
    style: {
      display: '',
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
    getAttribute(name: string) {
      return attributes.get(name);
    },
  };
}

function createCloseButton() {
  const listeners = new Map<string, () => void>();

  return {
    addEventListener(eventName: string, listener: () => void) {
      listeners.set(eventName, listener);
    },
    click() {
      listeners.get('click')?.();
    },
  };
}

function createStorage(initialValue?: string) {
  const data = new Map<string, string>();

  if (initialValue) {
    data.set(MOBILE_BANNER_DISMISSED_KEY, initialValue);
  }

  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe('mobile-banner-popup.js', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('stores the dismissal flag in session storage', () => {
    const storage = createStorage();

    expect(markMobileBannerDismissed(storage)).toBe(true);
    expect(storage.getItem(MOBILE_BANNER_DISMISSED_KEY)).toBe('true');
    expect(isMobileBannerDismissed(storage)).toBe(true);
  });

  it('hides the mobile popup and remembers dismissal after closing it', () => {
    const popup = createPopupElement();
    const closeButton = createCloseButton();
    const rootElement = { classList: createClassList() };
    const storage = createStorage();
    const controller = createMobileBannerController({ popup, closeButton, storage, rootElement });

    controller.init();
    closeButton.click();

    expect(storage.getItem(MOBILE_BANNER_DISMISSED_KEY)).toBe('true');
    expect(rootElement.classList.contains('mobile-banner-dismissed')).toBe(true);
    expect(popup.style.display).toBe('none');
    expect(popup.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the popup hidden when the current session already dismissed it', () => {
    const popup = createPopupElement();
    const closeButton = createCloseButton();
    const rootElement = { classList: createClassList() };
    const storage = createStorage('true');
    const controller = createMobileBannerController({ popup, closeButton, storage, rootElement });

    controller.init();

    expect(rootElement.classList.contains('mobile-banner-dismissed')).toBe(true);
    expect(popup.style.display).toBe('none');
    expect(popup.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not render the banner on the DE and EN home pages', () => {
    const deHome = loadHtml('_site/de/index.html');
    const enHome = loadHtml('_site/en/index.html');

    expect(deHome('#mobile-banner-popup').length).toBe(0);
    expect(deHome('#desktop-floating-banner').length).toBe(0);
    expect(deHome('script[type="module"][src="/assets/js/mobile-banner-popup.js"]').length).toBe(0);

    expect(enHome('#mobile-banner-popup').length).toBe(0);
    expect(enHome('#desktop-floating-banner').length).toBe(0);
    expect(enHome('script[type="module"][src="/assets/js/mobile-banner-popup.js"]').length).toBe(0);
  });

  it('renders the shared mobile banner controller on non-home pages and blog layouts', () => {
    const pageLayout = loadHtml('_site/de/kontakt/index.html');
    const blogFiles = getBlogHtmlFiles();

    expect(pageLayout('head script').text()).toContain(MOBILE_BANNER_DISMISSED_KEY);
    expect(pageLayout('#mobile-banner-popup').length).toBe(1);
    expect(pageLayout('#desktop-floating-banner').length).toBe(1);
    expect(pageLayout('script[type="module"][src="/assets/js/mobile-banner-popup.js"]').length).toBe(1);
    expect(blogFiles.length).toBeGreaterThan(0);

    const blogLayout = loadHtml(blogFiles[0]);
    expect(blogLayout('head script').text()).toContain(MOBILE_BANNER_DISMISSED_KEY);
    expect(blogLayout('script[type="module"][src="/assets/js/mobile-banner-popup.js"]').length).toBe(1);
  });
});
