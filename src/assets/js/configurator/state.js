// state.js - Configuration state management with subscriber notifications
import { STEPS } from './navigation.js';

/**
 * Create a state store for the vehicle configurator.
 * @param {Object} productData - The product data object from configurator.json
 * @returns {{ getState: Function, setState: Function, subscribe: Function, selectOption: Function, toggleAccessory: Function, clearDependents: Function }}
 */
export function createStore(productData) {
  let state = {
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
  };

  const subscribers = new Set();

  function getState() {
    return {
      ...state,
      selections: {
        ...state.selections,
        accessories: [...state.selections.accessories],
      },
      contact: { ...state.contact },
    };
  }

  function setState(updater) {
    const prev = state;
    state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    subscribers.forEach(fn => fn(state, prev));
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  /**
   * Select an option for a given step (single-select).
   * If changing an earlier step, clears all dependent selections.
   * @param {string} step - Step key: 'platform', 'cabinSize', 'equipmentLine'
   * @param {string} optionId - The ID of the selected option
   */
  function selectOption(step, optionId) {
    const stepIndex = STEPS.indexOf(step);
    if (stepIndex === -1 || step === 'accessories' || step === 'summary') return;

    const prev = state.selections[step];
    if (prev === optionId) return; // No change

    // If changing an earlier step (not first selection), clear dependents
    if (prev !== null) {
      clearDependents(stepIndex);
    }

    setState(s => ({
      ...s,
      selections: { ...s.selections, [step]: optionId },
    }));
  }

  /**
   * Toggle an accessory (add if not present, remove if present).
   * @param {string} optionId - The accessory ID to toggle
   */
  function toggleAccessory(optionId) {
    const accessories = [...state.selections.accessories];
    const index = accessories.indexOf(optionId);
    if (index === -1) {
      accessories.push(optionId);
    } else {
      accessories.splice(index, 1);
    }
    setState(s => ({
      ...s,
      selections: { ...s.selections, accessories },
    }));
  }

  /**
   * Clear all selections in steps after fromStep.
   * @param {number} fromStep - The step index from which to clear (exclusive)
   */
  function clearDependents(fromStep) {
    const updates = {};
    for (let i = fromStep + 1; i < STEPS.length; i++) {
      const stepKey = STEPS[i];
      if (stepKey === 'accessories') {
        updates.accessories = [];
      } else if (stepKey !== 'summary') {
        updates[stepKey] = null;
      }
    }
    setState(s => ({
      ...s,
      selections: { ...s.selections, ...updates },
    }));
  }

  return { getState, setState, subscribe, selectOption, toggleAccessory, clearDependents };
}
