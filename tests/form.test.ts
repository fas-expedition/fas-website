import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFormHandler } from '../src/assets/js/configurator/form.js';
import { createStore } from '../src/assets/js/configurator/state.js';

// Minimal product data for store initialization
const mockProductData = {
  platforms: [{ id: '4x4', name: { de: '4x4', en: '4x4' } }],
  cabinSizes: [{ id: 'compact', name: { de: 'Kompakt', en: 'Compact' } }],
  equipmentLines: [{ id: 'expedition', name: { de: 'Expedition', en: 'Expedition' } }],
  accessories: [{ id: 'acc-winch', name: { de: 'Seilwinde', en: 'Winch' } }],
  rules: [],
};

const deUiStrings = {
  'form.error.nameRequired': 'Bitte geben Sie Ihren Namen ein.',
  'form.error.emailRequired': 'Bitte geben Sie Ihre E-Mail-Adresse ein.',
  'form.error.emailInvalid': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  'form.error.submitFailed': 'Übermittlung fehlgeschlagen. Bitte versuchen Sie es erneut.',
};

const enUiStrings = {
  'form.error.nameRequired': 'Please enter your name.',
  'form.error.emailRequired': 'Please enter your email address.',
  'form.error.emailInvalid': 'Please enter a valid email address.',
  'form.error.submitFailed': 'Submission failed. Please try again.',
};

describe('form.js - createFormHandler', () => {
  let store: ReturnType<typeof createStore>;
  let formHandler: ReturnType<typeof createFormHandler>;

  beforeEach(() => {
    store = createStore(mockProductData);
    formHandler = createFormHandler(store, 'de', deUiStrings);
  });

  describe('createFormHandler return value', () => {
    it('returns an object with validateForm, isValidEmail, and submit', () => {
      expect(formHandler.validateForm).toBeTypeOf('function');
      expect(formHandler.isValidEmail).toBeTypeOf('function');
      expect(formHandler.submit).toBeTypeOf('function');
    });
  });

  describe('isValidEmail', () => {
    it('accepts a standard email address', () => {
      expect(formHandler.isValidEmail('user@example.com')).toBe(true);
    });

    it('accepts email with subdomain', () => {
      expect(formHandler.isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('accepts email with plus addressing', () => {
      expect(formHandler.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('accepts email with dots in local part', () => {
      expect(formHandler.isValidEmail('first.last@example.com')).toBe(true);
    });

    it('rejects email without @', () => {
      expect(formHandler.isValidEmail('userexample.com')).toBe(false);
    });

    it('rejects email without domain', () => {
      expect(formHandler.isValidEmail('user@')).toBe(false);
    });

    it('rejects email without local part', () => {
      expect(formHandler.isValidEmail('@example.com')).toBe(false);
    });

    it('rejects email with spaces', () => {
      expect(formHandler.isValidEmail('user @example.com')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(formHandler.isValidEmail('')).toBe(false);
    });

    it('rejects email without TLD dot', () => {
      expect(formHandler.isValidEmail('user@example')).toBe(false);
    });
  });

  describe('validateForm', () => {
    it('returns valid: true when name and email are provided and email is valid', () => {
      const result = formHandler.validateForm({
        name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns error when name is empty', () => {
      const result = formHandler.validateForm({
        name: '',
        email: 'max@example.com',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe(deUiStrings['form.error.nameRequired']);
    });

    it('returns error when name is only whitespace', () => {
      const result = formHandler.validateForm({
        name: '   ',
        email: 'max@example.com',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe(deUiStrings['form.error.nameRequired']);
    });

    it('returns error when email is empty', () => {
      const result = formHandler.validateForm({
        name: 'Max',
        email: '',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBe(deUiStrings['form.error.emailRequired']);
    });

    it('returns error when email is only whitespace', () => {
      const result = formHandler.validateForm({
        name: 'Max',
        email: '   ',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBe(deUiStrings['form.error.emailRequired']);
    });

    it('returns emailInvalid error when email format is wrong', () => {
      const result = formHandler.validateForm({
        name: 'Max',
        email: 'not-an-email',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBe(deUiStrings['form.error.emailInvalid']);
    });

    it('returns both name and email errors when both are missing', () => {
      const result = formHandler.validateForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe(deUiStrings['form.error.nameRequired']);
      expect(result.errors.email).toBe(deUiStrings['form.error.emailRequired']);
    });

    it('does not validate phone, company, or notes (optional fields)', () => {
      const result = formHandler.validateForm({
        name: 'Max',
        email: 'max@example.com',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.valid).toBe(true);
    });

    it('uses locale-specific error messages (EN)', () => {
      const enHandler = createFormHandler(store, 'en', enUiStrings);
      const result = enHandler.validateForm({
        name: '',
        email: 'invalid',
        phone: '',
        company: '',
        notes: '',
      });
      expect(result.errors.name).toBe(enUiStrings['form.error.nameRequired']);
      expect(result.errors.email).toBe(enUiStrings['form.error.emailInvalid']);
    });
  });

  describe('submit', () => {
    let mockFormElement: any;
    let configInput: { value: string };

    beforeEach(() => {
      // Set up store with selections
      store.selectOption('platform', '4x4');
      store.selectOption('cabinSize', 'compact');
      store.selectOption('equipmentLine', 'expedition');
      store.toggleAccessory('acc-winch');

      // Mock form element
      const fields = new Map<string, string>();
      fields.set('form-name', 'vehicle-inquiry');
      fields.set('locale', 'de');

      configInput = { value: '' };

      mockFormElement = {
        getAttribute: vi.fn((attr: string) => {
          if (attr === 'action') return '/de/konfigurator/';
          return null;
        }),
        querySelector: vi.fn((selector: string) => {
          if (selector === '#form-configuration') return configInput;
          return null;
        }),
      };

      // Mock FormData
      global.FormData = vi.fn().mockImplementation(() => {
        return {
          entries: () => fields.entries(),
          [Symbol.iterator]: () => fields.entries(),
        };
      }) as any;

      // Mock URLSearchParams
      global.URLSearchParams = vi.fn().mockImplementation((data: any) => {
        return {
          toString: () => 'form-name=vehicle-inquiry&locale=de',
        };
      }) as any;
    });

    it('returns success: true when fetch succeeds', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const result = await formHandler.submit(mockFormElement);
      expect(result).toEqual({ success: true });
    });

    it('POSTs to the form action URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await formHandler.submit(mockFormElement);
      expect(global.fetch).toHaveBeenCalledWith(
        '/de/konfigurator/',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('falls back to window.location.pathname when no action attribute', async () => {
      mockFormElement.getAttribute = vi.fn(() => null);
      // Mock window.location
      Object.defineProperty(global, 'window', {
        value: { location: { pathname: '/de/konfigurator/' } },
        writable: true,
      });

      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await formHandler.submit(mockFormElement);
      expect(global.fetch).toHaveBeenCalledWith(
        '/de/konfigurator/',
        expect.anything()
      );
    });

    it('serializes configuration into the hidden field', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await formHandler.submit(mockFormElement);

      const parsed = JSON.parse(configInput.value);
      expect(parsed.platform).toBe('4x4');
      expect(parsed.cabinSize).toBe('compact');
      expect(parsed.equipmentLine).toBe('expedition');
      expect(parsed.accessories).toEqual(['acc-winch']);
    });

    it('returns error with submitFailed message on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      const result = await formHandler.submit(mockFormElement);
      expect(result).toEqual({
        success: false,
        errors: { submit: deUiStrings['form.error.submitFailed'] },
      });
    });

    it('returns error with submitFailed message on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await formHandler.submit(mockFormElement);
      expect(result).toEqual({
        success: false,
        errors: { submit: deUiStrings['form.error.submitFailed'] },
      });
    });

    it('uses locale-specific error message on failure (EN)', async () => {
      const enHandler = createFormHandler(store, 'en', enUiStrings);
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      const result = await enHandler.submit(mockFormElement);
      expect(result.errors!.submit).toBe(enUiStrings['form.error.submitFailed']);
    });
  });
});
