// renderer.js - DOM rendering functions for the configurator

/**
 * Create a renderer that subscribes to state changes and updates the DOM.
 * @param {Object} store - The state store instance
 * @param {Object} navigation - The navigation controller instance
 * @param {Object} productData - The product data object
 * @param {string} locale - Current locale ('de' or 'en')
 * @param {Object} uiStrings - Locale-specific UI strings
 * @returns {{ render: Function }}
 */
export function createRenderer(store, navigation, productData, locale, uiStrings) {
  const containers = {
    stepIndicator: document.getElementById('step-indicator'),
    mainContent: document.getElementById('configurator-content'),
    sidebar: document.getElementById('configurator-sidebar'),
    navigation: document.getElementById('configurator-nav'),
    notifications: document.getElementById('configurator-notifications'),
  };

  // Track sidebar open/closed state on mobile
  let sidebarOpen = false;

  /**
   * Main render function — dispatches to step-specific renderers.
   * @param {Object} state - Current configurator state
   */
  function render(state) {
    renderStepIndicator(state);
    renderMainContent(state);
    renderSidebar(state);
    renderNavButtons(state);
    renderNotifications(state);
  }

  /**
   * Render the step indicator bar with completed/current/upcoming states.
   * On mobile (<md): shows a compact step counter with current step name.
   * On md+: shows full step circles with labels and connector lines.
   * Uses aria-current="step" for the active step.
   * @param {Object} state - Current configurator state
   */
  function renderStepIndicator(state) {
    const steps = navigation.STEPS;
    const currentLabel = uiStrings[`step.${steps[state.currentStep]}`] || steps[state.currentStep];
    const stepOfText = (uiStrings['misc.stepOf'] || 'Step {current} of {total}')
      .replace('{current}', state.currentStep + 1)
      .replace('{total}', steps.length);

    const html = `
      <div class="md:hidden flex items-center justify-between" aria-label="${stepOfText}">
        <span class="text-sm text-zinc-400">${stepOfText}</span>
        <span class="text-sm font-bold text-white">${currentLabel}</span>
      </div>
      <div class="hidden md:flex items-center justify-between gap-2 md:gap-4">
        ${steps.map((step, i) => {
          const isCompleted = i < state.currentStep;
          const isCurrent = i === state.currentStep;
          const label = uiStrings[`step.${step}`] || step;

          let circleClasses = 'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors';
          let labelClasses = 'mt-2 text-xs md:text-sm';

          if (isCompleted) {
            circleClasses += ' bg-white text-black';
            labelClasses += ' text-zinc-300';
          } else if (isCurrent) {
            circleClasses += ' border-2 border-white text-white';
            labelClasses += ' text-white font-bold';
          } else {
            circleClasses += ' border border-zinc-700 text-zinc-500';
            labelClasses += ' text-zinc-500';
          }

          const ariaLabel = isCompleted
            ? `${label} - ${uiStrings['aria.stepCompleted']}`
            : isCurrent
              ? `${label} - ${uiStrings['aria.stepCurrent']}`
              : `${label} - ${uiStrings['aria.stepUpcoming']}`;

          const ariaCurrent = isCurrent ? 'aria-current="step"' : '';
          const clickable = isCompleted
            ? `data-action="go-to-step" data-step="${i}" tabindex="0" role="button"`
            : '';

          const focusClasses = isCompleted
            ? ' focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none rounded'
            : '';

          return `
            <div class="flex flex-col items-center flex-1${isCompleted ? ' cursor-pointer' : ''}${focusClasses}" ${clickable} ${ariaCurrent} aria-label="${ariaLabel}">
              <div class="${circleClasses}">
                ${isCompleted ? '&#10003;' : i + 1}
              </div>
              <span class="${labelClasses}">${label}</span>
            </div>
            ${i < steps.length - 1 ? `<div class="flex-1 h-px ${i < state.currentStep ? 'bg-white' : 'bg-zinc-700'} mt-5"></div>` : ''}
          `;
        }).join('')}
      </div>
    `;
    containers.stepIndicator.innerHTML = html;
  }

  /**
   * Render the main content area based on the current step.
   * Dispatches to step-specific render functions, filtering options by selected platform.
   * @param {Object} state - Current configurator state
   */
  function renderMainContent(state) {
    const stepKey = navigation.STEPS[state.currentStep];
    switch (stepKey) {
      case 'platform': renderPlatformStep(state); break;
      case 'cabinSize': renderCabinStep(state); break;
      case 'equipmentLine': renderEquipmentStep(state); break;
      case 'accessories': renderAccessoriesStep(state); break;
      case 'summary': renderSummaryStep(state); break;
    }
  }

  /**
   * Render platform selection step (no filtering needed — all platforms shown).
   */
  function renderPlatformStep(state) {
    const selections = state.selections;
    const options = productData.platforms;
    containers.mainContent.innerHTML = `
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-wider uppercase mb-2">${uiStrings['step.platform']}</h2>
        <p class="text-zinc-400">${uiStrings['step.platform.description']}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="radiogroup" aria-label="${uiStrings['step.platform']}">
        ${options.map(opt => renderOptionCard(opt, selections.platform === opt.id, false, 'platform')).join('')}
      </div>
    `;
  }

  /**
   * Render cabin size step — filtered by selected platform compatibility.
   */
  function renderCabinStep(state) {
    const selections = state.selections;
    const options = productData.cabinSizes.filter(
      c => c.platformCompatibility.includes(selections.platform)
    );
    containers.mainContent.innerHTML = `
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-wider uppercase mb-2">${uiStrings['step.cabinSize']}</h2>
        <p class="text-zinc-400">${uiStrings['step.cabinSize.description']}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="radiogroup" aria-label="${uiStrings['step.cabinSize']}">
        ${options.map(opt => {
          const isDisabled = state.disabledOptions.includes(opt.id);
          return renderOptionCard(opt, selections.cabinSize === opt.id, isDisabled, 'cabinSize');
        }).join('')}
      </div>
    `;
  }

  /**
   * Render equipment line step — filtered by selected platform compatibility.
   */
  function renderEquipmentStep(state) {
    const selections = state.selections;
    const options = productData.equipmentLines.filter(
      e => e.platformCompatibility.includes(selections.platform)
    );
    containers.mainContent.innerHTML = `
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-wider uppercase mb-2">${uiStrings['step.equipmentLine']}</h2>
        <p class="text-zinc-400">${uiStrings['step.equipmentLine.description']}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="radiogroup" aria-label="${uiStrings['step.equipmentLine']}">
        ${options.map(opt => {
          const isDisabled = state.disabledOptions.includes(opt.id);
          return renderOptionCard(opt, selections.equipmentLine === opt.id, isDisabled, 'equipmentLine');
        }).join('')}
      </div>
    `;
  }

  /**
   * Render accessories step — filtered by selected platform, multi-select.
   */
  function renderAccessoriesStep(state) {
    const selections = state.selections;
    const options = productData.accessories.filter(
      a => a.platformCompatibility.includes(selections.platform)
    );
    containers.mainContent.innerHTML = `
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-wider uppercase mb-2">${uiStrings['step.accessories']}</h2>
        <p class="text-zinc-400">${uiStrings['step.accessories.description']}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="group" aria-label="${uiStrings['step.accessories']}">
        ${options.map(opt => {
          const isSelected = selections.accessories.includes(opt.id);
          const isDisabled = state.disabledOptions.includes(opt.id);
          return renderOptionCard(opt, isSelected, isDisabled, 'accessories');
        }).join('')}
      </div>
    `;
  }

  /**
   * Render summary step with all selections grouped by category,
   * auto-applied dependency notes, contact form, and action buttons.
   */
  function renderSummaryStep(state) {
    const selections = state.selections;
    containers.mainContent.innerHTML = `
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-wider uppercase mb-2">${uiStrings['step.summary']}</h2>
        <p class="text-zinc-400">${uiStrings['step.summary.description']}</p>
      </div>
      ${renderSummarySelections(state)}
      <div class="mt-12 border-t border-zinc-800 pt-8" aria-label="${uiStrings['aria.formSection']}">
        <h3 class="text-xl font-bold mb-2">${uiStrings['form.title']}</h3>
        <p class="text-zinc-400 mb-6">${uiStrings['form.subtitle']}</p>
        ${renderContactForm(state)}
      </div>
      <div class="mt-8 flex flex-wrap gap-4">
        <button type="button" data-action="submit-form"
                class="bg-white text-black px-10 py-4 text-sm tracking-widest uppercase font-bold hover:bg-zinc-200 transition-colors">
          ${uiStrings['btn.submit']}
        </button>
        <button type="button" data-action="download-pdf"
                class="border border-zinc-700 px-10 py-4 text-sm tracking-widest uppercase font-bold hover:bg-white hover:text-black transition-colors">
          ${uiStrings['btn.downloadPdf']}
        </button>
      </div>
    `;
  }

  /**
   * Render summary selections grouped by category.
   * Includes auto-applied dependency notes when items were auto-selected by rules.
   */
  function renderSummarySelections(state) {
    const selections = state.selections;
    const sections = [];

    if (selections.platform) {
      const platform = productData.platforms.find(p => p.id === selections.platform);
      sections.push(`
        <div class="mb-4">
          <span class="text-zinc-500 text-sm uppercase tracking-wider">${uiStrings['sidebar.platform']}</span>
          <p class="text-lg font-bold mt-1">${platform ? platform.name[locale] : selections.platform}</p>
        </div>
      `);
    }

    if (selections.cabinSize) {
      const cabin = productData.cabinSizes.find(c => c.id === selections.cabinSize);
      sections.push(`
        <div class="mb-4">
          <span class="text-zinc-500 text-sm uppercase tracking-wider">${uiStrings['sidebar.cabinSize']}</span>
          <p class="text-lg font-bold mt-1">${cabin ? cabin.name[locale] : selections.cabinSize}</p>
        </div>
      `);
    }

    if (selections.equipmentLine) {
      const equip = productData.equipmentLines.find(e => e.id === selections.equipmentLine);
      sections.push(`
        <div class="mb-4">
          <span class="text-zinc-500 text-sm uppercase tracking-wider">${uiStrings['sidebar.equipmentLine']}</span>
          <p class="text-lg font-bold mt-1">${equip ? equip.name[locale] : selections.equipmentLine}</p>
        </div>
      `);
    }

    if (selections.accessories.length > 0) {
      const accNames = selections.accessories.map(id => {
        const acc = productData.accessories.find(a => a.id === id);
        return acc ? acc.name[locale] : id;
      });
      sections.push(`
        <div class="mb-4">
          <span class="text-zinc-500 text-sm uppercase tracking-wider">${uiStrings['sidebar.accessories']}</span>
          <ul class="mt-1">
            ${accNames.map(name => `<li class="text-lg">&bull; ${name}</li>`).join('')}
          </ul>
        </div>
      `);
    }

    // Display auto-applied dependency notes (Requirement 9.2)
    let autoSelectedHtml = '';
    if (state.autoSelected && state.autoSelected.length > 0) {
      const autoNames = state.autoSelected.map(id => {
        const allOptions = [
          ...productData.platforms,
          ...productData.cabinSizes,
          ...productData.equipmentLines,
          ...productData.accessories,
        ];
        const option = allOptions.find(o => o.id === id);
        return option ? option.name[locale] : id;
      });
      autoSelectedHtml = `
        <div class="mt-4 border-t border-zinc-800 pt-4">
          <span class="text-xs uppercase tracking-wider font-bold text-yellow-400">${uiStrings['rule.autoSelected']}</span>
          <ul class="mt-1">
            ${autoNames.map(name => `<li class="text-sm text-zinc-300">&bull; ${name}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    return `<div class="bg-zinc-950 border border-zinc-800 p-6" aria-label="${uiStrings['aria.summarySection']}">${sections.join('')}${autoSelectedHtml}</div>`;
  }

  /**
   * Render the contact form fields for the summary step.
   */
  function renderContactForm(state) {
    const contact = state.contact;
    return `
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-zinc-400 mb-1">${uiStrings['form.name']} *</label>
          <input type="text" data-field="name" value="${escapeHtml(contact.name)}"
                 placeholder="${uiStrings['form.name.placeholder']}"
                 class="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-600 focus:border-white focus:outline-none transition-colors"
                 aria-label="${uiStrings['form.name']}" required>
          <p class="text-red-400 text-sm mt-1 hidden" data-error="name"></p>
        </div>
        <div>
          <label class="block text-sm text-zinc-400 mb-1">${uiStrings['form.email']} *</label>
          <input type="email" data-field="email" value="${escapeHtml(contact.email)}"
                 placeholder="${uiStrings['form.email.placeholder']}"
                 class="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-600 focus:border-white focus:outline-none transition-colors"
                 aria-label="${uiStrings['form.email']}" required>
          <p class="text-red-400 text-sm mt-1 hidden" data-error="email"></p>
        </div>
        <div>
          <label class="block text-sm text-zinc-400 mb-1">${uiStrings['form.phone']}</label>
          <input type="tel" data-field="phone" value="${escapeHtml(contact.phone)}"
                 placeholder="${uiStrings['form.phone.placeholder']}"
                 class="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-600 focus:border-white focus:outline-none transition-colors"
                 aria-label="${uiStrings['form.phone']}">
        </div>
        <div>
          <label class="block text-sm text-zinc-400 mb-1">${uiStrings['form.company']}</label>
          <input type="text" data-field="company" value="${escapeHtml(contact.company)}"
                 placeholder="${uiStrings['form.company.placeholder']}"
                 class="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-600 focus:border-white focus:outline-none transition-colors"
                 aria-label="${uiStrings['form.company']}">
        </div>
        <div>
          <label class="block text-sm text-zinc-400 mb-1">${uiStrings['form.notes']}</label>
          <textarea data-field="notes" rows="3"
                    placeholder="${uiStrings['form.notes.placeholder']}"
                    class="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-600 focus:border-white focus:outline-none transition-colors resize-none"
                    aria-label="${uiStrings['form.notes']}">${escapeHtml(contact.notes)}</textarea>
        </div>
        <p class="text-red-400 text-sm hidden" data-error="form"></p>
      </div>
    `;
  }

  /**
   * Render a single option card with correct Tailwind classes.
   * Selected: border-white bg-white/5
   * Disabled: opacity-50 cursor-not-allowed
   * Default: border border-zinc-800 p-6 cursor-pointer transition-all hover:border-zinc-600
   * @param {Object} option - The option data object
   * @param {boolean} isSelected - Whether this option is currently selected
   * @param {boolean} isDisabled - Whether this option is disabled by constraint rules
   * @param {string} step - The step key this card belongs to
   * @returns {string} HTML string for the option card
   */
  function renderOptionCard(option, isSelected, isDisabled, step) {
    let cardClasses = 'border p-6 transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none';

    if (isDisabled) {
      cardClasses += ' border-zinc-800 opacity-50 cursor-not-allowed';
    } else if (isSelected) {
      cardClasses += ' border-white bg-white/5 cursor-pointer';
    } else {
      cardClasses += ' border-zinc-800 cursor-pointer hover:border-zinc-600';
    }

    const action = step === 'accessories' ? 'toggle-accessory' : 'select-option';
    const ariaSelected = isSelected ? 'aria-selected="true"' : 'aria-selected="false"';
    const ariaDisabled = isDisabled ? 'aria-disabled="true"' : '';
    const tabIndex = isDisabled ? '' : 'tabindex="0"';

    const name = option.name[locale] || option.name.de || option.id;
    const description = option.description
      ? (option.description[locale] || option.description.de || '')
      : '';

    // Features list for equipment lines
    let featuresHtml = '';
    if (option.features) {
      const features = option.features[locale] || option.features.de || [];
      featuresHtml = `<ul class="mt-3 space-y-1">${features.map(f => `<li class="text-sm text-zinc-400">&bull; ${f}</li>`).join('')}</ul>`;
    }

    // Specs for platforms
    let specsHtml = '';
    if (option.specs) {
      specsHtml = `<div class="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-400">
        ${Object.entries(option.specs).map(([key, val]) => `<span>${key}: ${val}</span>`).join('')}
      </div>`;
    }

    // Price display
    let priceHtml = '';
    if (option.price) {
      const formatted = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0
      }).format(option.price);
      priceHtml = `<p class="mt-3 text-sm font-bold text-zinc-300">${formatted}</p>`;
    }

    const isMulti = step === 'accessories';
    let indicatorHtml;
    if (isMulti) {
      indicatorHtml = isSelected
        ? `<div class="w-5 h-5 border-2 border-white bg-white flex items-center justify-center shrink-0"><svg class="w-3 h-3 text-black" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>`
        : `<div class="w-5 h-5 border-2 ${isDisabled ? 'border-zinc-700' : 'border-zinc-500'} shrink-0"></div>`;
    } else {
      indicatorHtml = isSelected
        ? `<div class="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center shrink-0"><div class="w-2.5 h-2.5 bg-white rounded-full"></div></div>`
        : `<div class="w-5 h-5 border-2 ${isDisabled ? 'border-zinc-700' : 'border-zinc-500'} rounded-full shrink-0"></div>`;
    }

    return `
      <div class="${cardClasses}" ${tabIndex}
           data-action="${action}" data-step="${step}" data-option-id="${option.id}"
           ${ariaSelected} ${ariaDisabled}
           role="${isMulti ? 'checkbox' : 'radio'}"
           aria-checked="${isSelected}"
           aria-label="${name}${isDisabled ? ' - ' + uiStrings['aria.optionDisabled'] : ''}">
        <div class="flex items-start gap-3">
          ${indicatorHtml}
          <div class="flex-1">
            <h3 class="text-lg font-bold">${name}</h3>
            <p class="text-sm text-zinc-400 mt-1">${description}</p>
            ${specsHtml}
            ${featuresHtml}
            ${priceHtml}
          </div>
        </div>
        ${isSelected ? `<span class="inline-block mt-3 text-xs uppercase tracking-wider text-white font-bold">${uiStrings['misc.selected']}</span>` : ''}
      </div>
    `;
  }

  /**
   * Render the sidebar with current selections summary.
   * On mobile (<lg): collapsible with a toggle button, hidden by default.
   * On desktop (lg+): always visible, sticky positioning.
   * @param {Object} state - Current configurator state
   */
  function renderSidebar(state) {
    const selections = state.selections;
    const items = [];

    if (selections.platform) {
      const p = productData.platforms.find(x => x.id === selections.platform);
      items.push(`<div class="mb-3"><span class="text-zinc-500 text-xs uppercase tracking-wider">${uiStrings['sidebar.platform']}</span><p class="font-bold">${p ? p.name[locale] : selections.platform}</p></div>`);
    }
    if (selections.cabinSize) {
      const c = productData.cabinSizes.find(x => x.id === selections.cabinSize);
      items.push(`<div class="mb-3"><span class="text-zinc-500 text-xs uppercase tracking-wider">${uiStrings['sidebar.cabinSize']}</span><p class="font-bold">${c ? c.name[locale] : selections.cabinSize}</p></div>`);
    }
    if (selections.equipmentLine) {
      const e = productData.equipmentLines.find(x => x.id === selections.equipmentLine);
      items.push(`<div class="mb-3"><span class="text-zinc-500 text-xs uppercase tracking-wider">${uiStrings['sidebar.equipmentLine']}</span><p class="font-bold">${e ? e.name[locale] : selections.equipmentLine}</p></div>`);
    }
    if (selections.accessories.length > 0) {
      const accNames = selections.accessories.map(id => {
        const a = productData.accessories.find(x => x.id === id);
        return a ? a.name[locale] : id;
      });
      items.push(`<div class="mb-3"><span class="text-zinc-500 text-xs uppercase tracking-wider">${uiStrings['sidebar.accessories']}</span>${accNames.map(n => `<p class="text-sm">${n}</p>`).join('')}</div>`);
    }

    const content = items.length > 0
      ? items.join('')
      : `<p class="text-zinc-500 text-sm">${uiStrings['sidebar.empty']}</p>`;

    const sidebarContentClasses = sidebarOpen ? 'block lg:block' : 'hidden lg:block';
    const toggleLabel = uiStrings['aria.sidebarToggle'] || 'Show/hide selection';
    const chevron = sidebarOpen ? '&#9650;' : '&#9660;';

    containers.sidebar.innerHTML = `
      <button type="button" data-action="toggle-sidebar"
              class="lg:hidden w-full flex items-center justify-between border border-zinc-800 bg-zinc-950 px-4 py-3 mb-2 text-sm uppercase tracking-wider font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
              aria-expanded="${sidebarOpen}" aria-controls="sidebar-content"
              aria-label="${toggleLabel}">
        <span>${uiStrings['sidebar.title']}</span>
        <span aria-hidden="true">${chevron}</span>
      </button>
      <div id="sidebar-content" class="${sidebarContentClasses}">
        <div class="bg-zinc-950 border border-zinc-800 p-6 lg:sticky lg:top-24">
          <h3 class="hidden lg:block text-sm uppercase tracking-wider font-bold mb-4">${uiStrings['sidebar.title']}</h3>
          ${content}
        </div>
      </div>
    `;
  }

  /**
   * Toggle the sidebar visibility on mobile.
   * Called from the event delegation in main.js via data-action="toggle-sidebar".
   */
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    const sidebarContent = document.getElementById('sidebar-content');
    const toggleBtn = containers.sidebar.querySelector('[data-action="toggle-sidebar"]');
    if (sidebarContent) {
      if (sidebarOpen) {
        sidebarContent.classList.remove('hidden');
        sidebarContent.classList.add('block');
      } else {
        sidebarContent.classList.remove('block');
        sidebarContent.classList.add('hidden');
        // Keep lg:block so desktop always shows
        sidebarContent.classList.add('lg:block');
      }
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(sidebarOpen));
      const chevronEl = toggleBtn.querySelector('span[aria-hidden]');
      if (chevronEl) {
        chevronEl.innerHTML = sidebarOpen ? '&#9650;' : '&#9660;';
      }
    }
  }

  /**
   * Render navigation buttons (Back/Next) with correct visibility and disabled states.
   * Back is hidden on step 0, Next is disabled when canAdvance is false.
   * @param {Object} state - Current configurator state
   */
  function renderNavButtons(state) {
    const isFirst = state.currentStep === 0;
    const isLast = state.currentStep === navigation.STEPS.length - 1;
    const canNext = navigation.canAdvance(state);

    let html = '';

    if (!isFirst) {
      html += `
        <button type="button" data-action="go-back"
                class="border border-zinc-700 px-8 py-3 text-sm tracking-widest uppercase font-bold hover:bg-white hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none">
          ${uiStrings['btn.back']}
        </button>
      `;
    } else {
      html += '<div></div>';
    }

    if (!isLast) {
      html += `
        <button type="button" data-action="go-next"
                class="bg-white text-black px-8 py-3 text-sm tracking-widest uppercase font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
                ${canNext ? '' : 'disabled'}>
          ${uiStrings['btn.next']}
        </button>
      `;
    }

    containers.navigation.innerHTML = html;
  }

  /**
   * Render constraint rule notifications in the ARIA live region.
   * Displays messages from the rule engine (excludes, requires).
   * @param {Object} state - Current configurator state
   */
  function renderNotifications(state) {
    if (!state.ruleMessages || state.ruleMessages.length === 0) {
      containers.notifications.innerHTML = '';
      return;
    }

    const html = state.ruleMessages.map(msg => {
      const message = msg.message || '';
      const typeLabel = uiStrings[`rule.${msg.type}`] || msg.type;
      const bgClass = msg.type === 'excludes'
        ? 'border-red-900/50 bg-red-950/30'
        : msg.type === 'requires'
          ? 'border-yellow-900/50 bg-yellow-950/30'
          : 'border-blue-900/50 bg-blue-950/30';
      return `
        <div class="border ${bgClass} p-4 mt-4">
          <span class="text-xs uppercase tracking-wider font-bold">${typeLabel}</span>
          <p class="text-sm mt-1">${message}</p>
        </div>
      `;
    }).join('');

    containers.notifications.innerHTML = html;
  }

  /**
   * Escape HTML to prevent XSS in user-provided content.
   * @param {string} str - String to escape
   * @returns {string} Escaped string safe for innerHTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Subscribe to store for automatic re-render on state changes
  store.subscribe((state) => render(state));

  return { render, toggleSidebar };
}
