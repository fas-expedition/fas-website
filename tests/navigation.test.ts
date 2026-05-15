import { describe, it, expect, vi } from 'vitest';
import { createNavigation } from '../src/assets/js/configurator/navigation.js';

/**
 * Helper to create a mock store with configurable state.
 */
function createMockStore(initialState: Record<string, unknown>) {
  let state = { ...initialState };
  return {
    getState() { return { ...state }; },
    setState(updater: Record<string, unknown> | ((s: Record<string, unknown>) => Record<string, unknown>)) {
      if (typeof updater === 'function') {
        state = updater(state);
      } else {
        state = { ...state, ...updater };
      }
    },
  };
}

/**
 * Helper to create a mock rule engine.
 */
function createMockRuleEngine(hasViolationsResult = false) {
  return {
    evaluate: vi.fn(() => ({ messages: [], disabled: [], autoSelected: [] })),
    hasViolations: vi.fn(() => hasViolationsResult),
  };
}

/**
 * Helper to create a default state at a given step.
 */
function makeState(overrides: Record<string, unknown> = {}) {
  return {
    currentStep: 0,
    selections: {
      platform: null,
      cabinSize: null,
      equipmentLine: null,
      accessories: [],
    },
    disabledOptions: [],
    ruleMessages: [],
    ...overrides,
  };
}

describe('navigation.js — createNavigation', () => {
  describe('STEPS array', () => {
    it('contains exactly 5 steps in the correct order', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      expect(nav.STEPS).toEqual(['platform', 'cabinSize', 'equipmentLine', 'accessories', 'summary']);
      expect(nav.STEPS).toHaveLength(5);
    });
  });

  describe('canAdvance(state)', () => {
    it('returns false for platform step when no platform is selected', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({ currentStep: 0 });
      expect(nav.canAdvance(state)).toBe(false);
    });

    it('returns true for platform step when platform is selected', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({
        currentStep: 0,
        selections: { platform: 'man-tgs', cabinSize: null, equipmentLine: null, accessories: [] },
      });
      expect(nav.canAdvance(state)).toBe(true);
    });

    it('returns false for cabinSize step when no cabin is selected', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({
        currentStep: 1,
        selections: { platform: 'man-tgs', cabinSize: null, equipmentLine: null, accessories: [] },
      });
      expect(nav.canAdvance(state)).toBe(false);
    });

    it('returns true for cabinSize step when cabin is selected', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({
        currentStep: 1,
        selections: { platform: 'man-tgs', cabinSize: 'cabin-standard', equipmentLine: null, accessories: [] },
      });
      expect(nav.canAdvance(state)).toBe(true);
    });

    it('returns false for equipmentLine step when no equipment is selected', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({
        currentStep: 2,
        selections: { platform: 'man-tgs', cabinSize: 'cabin-standard', equipmentLine: null, accessories: [] },
      });
      expect(nav.canAdvance(state)).toBe(false);
    });

    it('returns true for equipmentLine step when equipment is selected', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({
        currentStep: 2,
        selections: { platform: 'man-tgs', cabinSize: 'cabin-standard', equipmentLine: 'equip-premium', accessories: [] },
      });
      expect(nav.canAdvance(state)).toBe(true);
    });

    it('returns true for accessories step (always, since accessories are optional)', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({
        currentStep: 3,
        selections: { platform: 'man-tgs', cabinSize: 'cabin-standard', equipmentLine: 'equip-premium', accessories: [] },
      });
      expect(nav.canAdvance(state)).toBe(true);
    });

    it('returns false for summary step (last step, cannot advance)', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({
        currentStep: 4,
        selections: { platform: 'man-tgs', cabinSize: 'cabin-standard', equipmentLine: 'equip-premium', accessories: ['acc-winch'] },
      });
      expect(nav.canAdvance(state)).toBe(false);
    });

    it('returns false when there are constraint violations even if selection is present', () => {
      const store = createMockStore(makeState());
      const ruleEngine = createMockRuleEngine(true); // hasViolations returns true
      const nav = createNavigation(store, ruleEngine);

      const state = makeState({
        currentStep: 0,
        selections: { platform: 'man-tgs', cabinSize: null, equipmentLine: null, accessories: [] },
      });
      expect(nav.canAdvance(state)).toBe(false);
    });
  });

  describe('goNext()', () => {
    it('advances currentStep when canAdvance is true', () => {
      const state = makeState({
        currentStep: 0,
        selections: { platform: 'man-tgs', cabinSize: null, equipmentLine: null, accessories: [] },
      });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goNext();
      expect(store.getState().currentStep).toBe(1);
    });

    it('does not advance when canAdvance is false (no selection)', () => {
      const state = makeState({ currentStep: 0 });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goNext();
      expect(store.getState().currentStep).toBe(0);
    });

    it('does not advance past the last step', () => {
      const state = makeState({
        currentStep: 4,
        selections: { platform: 'man-tgs', cabinSize: 'cabin-standard', equipmentLine: 'equip-premium', accessories: [] },
      });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goNext();
      expect(store.getState().currentStep).toBe(4);
    });

    it('does not advance when constraint violations exist', () => {
      const state = makeState({
        currentStep: 0,
        selections: { platform: 'man-tgs', cabinSize: null, equipmentLine: null, accessories: [] },
      });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine(true); // violations exist
      const nav = createNavigation(store, ruleEngine);

      nav.goNext();
      expect(store.getState().currentStep).toBe(0);
    });
  });

  describe('goBack()', () => {
    it('decrements currentStep when not at first step', () => {
      const state = makeState({ currentStep: 2 });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goBack();
      expect(store.getState().currentStep).toBe(1);
    });

    it('does not decrement below 0', () => {
      const state = makeState({ currentStep: 0 });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goBack();
      expect(store.getState().currentStep).toBe(0);
    });

    it('does not modify selections when going back', () => {
      const selections = { platform: 'man-tgs', cabinSize: 'cabin-standard', equipmentLine: 'equip-premium', accessories: ['acc-winch'] };
      const state = makeState({ currentStep: 3, selections });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goBack();
      const newState = store.getState();
      expect(newState.currentStep).toBe(2);
      expect(newState.selections).toEqual(selections);
    });
  });

  describe('goToStep(index)', () => {
    it('allows jumping to a completed step (index < currentStep)', () => {
      const state = makeState({ currentStep: 3 });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goToStep(1);
      expect(store.getState().currentStep).toBe(1);
    });

    it('allows jumping to the current step (no-op effectively)', () => {
      const state = makeState({ currentStep: 2 });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goToStep(2);
      expect(store.getState().currentStep).toBe(2);
    });

    it('does not allow jumping forward past current step', () => {
      const state = makeState({ currentStep: 1 });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goToStep(3);
      expect(store.getState().currentStep).toBe(1);
    });

    it('does not allow jumping to negative index', () => {
      const state = makeState({ currentStep: 2 });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goToStep(-1);
      expect(store.getState().currentStep).toBe(2);
    });

    it('allows jumping to step 0 from any step', () => {
      const state = makeState({ currentStep: 4 });
      const store = createMockStore(state);
      const ruleEngine = createMockRuleEngine();
      const nav = createNavigation(store, ruleEngine);

      nav.goToStep(0);
      expect(store.getState().currentStep).toBe(0);
    });
  });
});
