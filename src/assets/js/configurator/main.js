// main.js - Configurator initialization and module wiring
import { createStore } from './state.js';
import { createRuleEngine } from './rules.js';
import { createNavigation } from './navigation.js';
import { createRenderer } from './renderer.js';
import { createFormHandler } from './form.js';

/**
 * Initialize the vehicle configurator.
 * Reads embedded product data and UI strings from the page,
 * wires all modules together, and triggers the initial render.
 * @param {HTMLElement} [containerEl] - Optional container element. If not provided, queries for [data-configurator].
 */
export function initConfigurator(containerEl) {
  // Read embedded product data
  const dataEl = document.getElementById('configurator-data');
  if (!dataEl) return;
  const productData = JSON.parse(dataEl.textContent);

  // Read locale from data attribute
  const container = containerEl || document.querySelector('[data-configurator]');
  if (!container) return;
  const locale = container.dataset.locale || 'de';

  // Parse UI strings
  const uiStringsEl = document.getElementById('configurator-ui-strings');
  if (!uiStringsEl) return;
  const uiStrings = JSON.parse(uiStringsEl.textContent);

  // Initialize modules
  const store = createStore(productData);
  const ruleEngine = createRuleEngine(productData.rules);
  const navigation = createNavigation(store, ruleEngine);
  const renderer = createRenderer(store, navigation, productData, locale, uiStrings);
  const formHandler = createFormHandler(store, locale, uiStrings);

  // Wire rule evaluation into store subscriber
  // Use a flag to prevent infinite loops (rule evaluation triggers setState which triggers subscribers)
  let evaluatingRules = false;
  store.subscribe((state) => {
    if (evaluatingRules) return;
    evaluatingRules = true;
    const result = ruleEngine.evaluate(state.selections, locale);
    store.setState({
      ruleMessages: result.messages,
      disabledOptions: result.disabled,
      autoSelected: result.autoSelected,
    });
    evaluatingRules = false;
  });

  // Event delegation for all configurator interactions
  container.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    switch (action) {
      case 'select-option': {
        const step = target.dataset.step;
        const optionId = target.dataset.optionId;
        if (target.getAttribute('aria-disabled') === 'true') return;
        store.selectOption(step, optionId);
        break;
      }
      case 'toggle-accessory': {
        const optionId = target.dataset.optionId;
        if (target.getAttribute('aria-disabled') === 'true') return;
        store.toggleAccessory(optionId);
        break;
      }
      case 'go-next':
        navigation.goNext();
        break;
      case 'go-back':
        navigation.goBack();
        break;
      case 'go-to-step': {
        const stepIndex = parseInt(target.dataset.step, 10);
        navigation.goToStep(stepIndex);
        break;
      }
      case 'submit-form': {
        handleFormSubmit(formHandler, store, renderer, uiStrings, locale);
        break;
      }
      case 'download-pdf': {
        handlePdfDownload(store, productData, locale, uiStrings);
        break;
      }
      case 'toggle-sidebar': {
        renderer.toggleSidebar();
        break;
      }
      case 'new-config': {
        // Reset state and go to step 0
        store.setState({
          currentStep: 0,
          selections: {
            platform: null,
            cabinSize: null,
            equipmentLine: null,
            accessories: [],
          },
          contact: { name: '', email: '', phone: '', company: '', notes: '' },
          ruleMessages: [],
          disabledOptions: [],
          autoSelected: [],
        });
        break;
      }
    }
  });

  // Keyboard support for option cards and step indicators
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target.closest('[data-action]');
      if (target) {
        e.preventDefault();
        target.click();
      }
    }
  });

  // Contact form field input handling (update state.contact on input)
  container.addEventListener('input', (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    const state = store.getState();
    store.setState({
      contact: { ...state.contact, [field]: e.target.value },
    });
  });

  // Initial render
  renderer.render(store.getState());
}

/**
 * Handle form submission with validation and confirmation display.
 */
async function handleFormSubmit(formHandler, store, renderer, uiStrings, locale) {
  const state = store.getState();
  const { valid, errors } = formHandler.validateForm(state.contact);

  if (!valid) {
    // Show validation errors
    Object.entries(errors).forEach(([field, message]) => {
      const errorEl = document.querySelector(`[data-error="${field}"]`);
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      }
    });
    return;
  }

  // Clear previous errors
  document.querySelectorAll('[data-error]').forEach(el => {
    el.classList.add('hidden');
    el.textContent = '';
  });

  const formElement = document.getElementById('configurator-form');
  const result = await formHandler.submit(formElement);

  if (result.success) {
    showConfirmation(store, uiStrings, locale);
  } else {
    const formError = document.querySelector('[data-error="form"]');
    if (formError) {
      formError.textContent = result.errors.submit || uiStrings['form.error.submitFailed'];
      formError.classList.remove('hidden');
    }
  }
}

/**
 * Show the confirmation view after successful submission.
 */
function showConfirmation(store, uiStrings, locale) {
  const content = document.getElementById('configurator-content');
  const sidebar = document.getElementById('configurator-sidebar');
  const nav = document.getElementById('configurator-nav');
  const notifications = document.getElementById('configurator-notifications');

  // Generate reference number from timestamp
  const refNumber = `FAS-${Date.now().toString(36).toUpperCase()}`;

  if (content) {
    content.innerHTML = `
      <div class="text-center py-12">
        <div class="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-2xl">✓</span>
        </div>
        <h2 class="text-3xl font-bold tracking-wider uppercase mb-4">${uiStrings['confirm.title']}</h2>
        <p class="text-zinc-300 text-lg max-w-lg mx-auto mb-8">${uiStrings['confirm.message']}</p>
        <div class="bg-zinc-950 border border-zinc-800 p-6 inline-block mb-8">
          <span class="text-zinc-500 text-sm uppercase tracking-wider">${uiStrings['confirm.reference']}</span>
          <p class="text-xl font-bold mt-1 font-mono">${refNumber}</p>
        </div>
        <div class="mt-4">
          <h3 class="text-lg font-bold mb-2">${uiStrings['confirm.nextSteps']}</h3>
          <p class="text-zinc-400">${uiStrings['confirm.nextStepsText']}</p>
        </div>
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <a href="/${locale}/"
             class="border border-zinc-700 px-8 py-3 text-sm tracking-widest uppercase font-bold hover:bg-white hover:text-black transition-colors inline-block focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none">
            ${uiStrings['confirm.backHome']}
          </a>
          <button type="button" data-action="new-config"
                  class="bg-white text-black px-8 py-3 text-sm tracking-widest uppercase font-bold hover:bg-zinc-200 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none">
            ${uiStrings['btn.newConfig']}
          </button>
        </div>
      </div>
    `;
  }

  if (sidebar) sidebar.innerHTML = '';
  if (nav) nav.innerHTML = '';
  if (notifications) notifications.innerHTML = '';
}

/**
 * Handle PDF download with lazy-loaded jsPDF.
 */
async function handlePdfDownload(store, productData, locale, uiStrings) {
  try {
    const { generatePDF } = await import('./pdf.js');
    const state = store.getState();
    await generatePDF(state, productData, locale, uiStrings);
  } catch (err) {
    console.error('PDF generation failed:', err);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConfigurator);
} else {
  initConfigurator();
}
