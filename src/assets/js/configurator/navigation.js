// navigation.js - Step flow control for the configurator

export const STEPS = ['platform', 'cabinSize', 'equipmentLine', 'accessories', 'summary'];

/**
 * Create a navigation controller for the multi-step configurator flow.
 * @param {Object} store - The state store instance
 * @param {Object} ruleEngine - The rule engine instance
 * @returns {{ canAdvance: Function, goNext: Function, goBack: Function, goToStep: Function, STEPS: string[] }}
 */
export function createNavigation(store, ruleEngine) {
  /**
   * Determine if the user can advance from the current step.
   * Requires the step's selection to be made and no constraint violations.
   * @param {Object} state - Current configurator state
   * @returns {boolean}
   */
  function canAdvance(state) {
    const step = STEPS[state.currentStep];
    const selections = state.selections;

    // Check required selection per step
    switch (step) {
      case 'platform':
        if (!selections.platform) return false;
        break;
      case 'cabinSize':
        if (!selections.cabinSize) return false;
        break;
      case 'equipmentLine':
        if (!selections.equipmentLine) return false;
        break;
      case 'accessories':
        // Accessories step is optional — always can advance
        break;
      case 'summary':
        // Cannot advance past summary
        return false;
    }

    // Check no constraint violations
    if (ruleEngine.hasViolations(selections, state.disabledOptions)) return false;

    return true;
  }

  /**
   * Advance to the next step if allowed.
   */
  function goNext() {
    const state = store.getState();
    if (canAdvance(state) && state.currentStep < STEPS.length - 1) {
      store.setState({ ...state, currentStep: state.currentStep + 1 });
    }
  }

  /**
   * Go back to the previous step without modifying selections.
   */
  function goBack() {
    const state = store.getState();
    if (state.currentStep > 0) {
      store.setState({ ...state, currentStep: state.currentStep - 1 });
    }
  }

  /**
   * Jump to a specific step (only completed or current steps allowed).
   * @param {number} index - Target step index
   */
  function goToStep(index) {
    const state = store.getState();
    if (index >= 0 && index <= state.currentStep) {
      store.setState({ ...state, currentStep: index });
    }
  }

  return { canAdvance, goNext, goBack, goToStep, STEPS };
}
