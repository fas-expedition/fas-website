import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../src/assets/js/configurator/state.js';

// Minimal product data for testing
const mockProductData = {
  platforms: [
    { id: '4x4', name: { de: '4x4 Unimog', en: '4x4 Unimog' } },
    { id: '6x6', name: { de: '6x6 MAN TGS', en: '6x6 MAN TGS' } },
  ],
  cabinSizes: [
    { id: 'compact', name: { de: 'Kompakt', en: 'Compact' }, platformCompatibility: ['4x4', '6x6'] },
    { id: 'standard', name: { de: 'Standard', en: 'Standard' }, platformCompatibility: ['4x4', '6x6', '8x8'] },
  ],
  equipmentLines: [
    { id: 'expedition', name: { de: 'Expedition', en: 'Expedition' } },
    { id: 'luxury', name: { de: 'Luxury', en: 'Luxury' } },
  ],
  accessories: [
    { id: 'acc-winch', name: { de: 'Seilwinde', en: 'Winch' } },
    { id: 'acc-snorkel', name: { de: 'Schnorchel', en: 'Snorkel' } },
  ],
  rules: [],
};

describe('state.js - createStore', () => {
  describe('initial state', () => {
    it('returns an object with all expected methods', () => {
      const store = createStore(mockProductData);
      expect(store.getState).toBeTypeOf('function');
      expect(store.setState).toBeTypeOf('function');
      expect(store.subscribe).toBeTypeOf('function');
      expect(store.selectOption).toBeTypeOf('function');
      expect(store.toggleAccessory).toBeTypeOf('function');
      expect(store.clearDependents).toBeTypeOf('function');
    });

    it('has correct initial state shape', () => {
      const store = createStore(mockProductData);
      const state = store.getState();
      expect(state).toEqual({
        currentStep: 0,
        selections: {
          platform: null,
          cabinSize: null,
          equipmentLine: null,
          accessories: [],
        },
        contact: {
          name: '',
          email: '',
          phone: '',
          company: '',
          notes: '',
        },
        disabledOptions: [],
        autoSelected: [],
        ruleMessages: [],
      });
    });

    it('getState returns a copy, not a reference', () => {
      const store = createStore(mockProductData);
      const state1 = store.getState();
      const state2 = store.getState();
      expect(state1).not.toBe(state2);
      expect(state1.selections).not.toBe(state2.selections);
      expect(state1.selections.accessories).not.toBe(state2.selections.accessories);
    });
  });

  describe('setState', () => {
    it('merges partial state when given an object', () => {
      const store = createStore(mockProductData);
      store.setState({ currentStep: 2 });
      expect(store.getState().currentStep).toBe(2);
    });

    it('applies updater function when given a function', () => {
      const store = createStore(mockProductData);
      store.setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      expect(store.getState().currentStep).toBe(1);
    });

    it('notifies subscribers on setState', () => {
      const store = createStore(mockProductData);
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      store.setState({ currentStep: 3 });
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber.mock.calls[0][0].currentStep).toBe(3);
    });
  });

  describe('subscribe', () => {
    it('returns an unsubscribe function', () => {
      const store = createStore(mockProductData);
      const subscriber = vi.fn();
      const unsubscribe = store.subscribe(subscriber);
      expect(unsubscribe).toBeTypeOf('function');
    });

    it('subscriber receives new and previous state', () => {
      const store = createStore(mockProductData);
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      store.setState({ currentStep: 1 });
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({ currentStep: 1 }),
        expect.objectContaining({ currentStep: 0 })
      );
    });

    it('unsubscribe stops notifications', () => {
      const store = createStore(mockProductData);
      const subscriber = vi.fn();
      const unsubscribe = store.subscribe(subscriber);
      store.setState({ currentStep: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.setState({ currentStep: 2 });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('multiple subscribers all get notified', () => {
      const store = createStore(mockProductData);
      const sub1 = vi.fn();
      const sub2 = vi.fn();
      store.subscribe(sub1);
      store.subscribe(sub2);
      store.setState({ currentStep: 1 });
      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub2).toHaveBeenCalledTimes(1);
    });
  });

  describe('selectOption', () => {
    it('sets the selection for a step', () => {
      const store = createStore(mockProductData);
      store.selectOption('platform', '4x4');
      expect(store.getState().selections.platform).toBe('4x4');
    });

    it('notifies subscribers when selecting an option', () => {
      const store = createStore(mockProductData);
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      store.selectOption('platform', '6x6');
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('clears dependent steps when changing platform', () => {
      const store = createStore(mockProductData);
      store.selectOption('platform', '4x4');
      store.selectOption('cabinSize', 'compact');
      store.selectOption('equipmentLine', 'expedition');
      store.toggleAccessory('acc-winch');

      // Change platform
      store.selectOption('platform', '6x6');

      const state = store.getState();
      expect(state.selections.platform).toBe('6x6');
      expect(state.selections.cabinSize).toBeNull();
      expect(state.selections.equipmentLine).toBeNull();
      expect(state.selections.accessories).toEqual([]);
    });

    it('clears dependent steps when changing cabinSize', () => {
      const store = createStore(mockProductData);
      store.selectOption('platform', '4x4');
      store.selectOption('cabinSize', 'compact');
      store.selectOption('equipmentLine', 'expedition');
      store.toggleAccessory('acc-winch');

      // Change cabin size
      store.selectOption('cabinSize', 'standard');

      const state = store.getState();
      expect(state.selections.platform).toBe('4x4');
      expect(state.selections.cabinSize).toBe('standard');
      expect(state.selections.equipmentLine).toBeNull();
      expect(state.selections.accessories).toEqual([]);
    });

    it('does not clear dependents when selecting same value', () => {
      const store = createStore(mockProductData);
      store.selectOption('platform', '4x4');
      store.selectOption('cabinSize', 'compact');
      store.selectOption('equipmentLine', 'expedition');

      // Re-select same platform
      store.selectOption('platform', '4x4');

      const state = store.getState();
      expect(state.selections.cabinSize).toBe('compact');
      expect(state.selections.equipmentLine).toBe('expedition');
    });

    it('does not clear dependents on first selection (null -> value)', () => {
      const store = createStore(mockProductData);
      // First set cabinSize and equipmentLine manually for testing
      store.setState(prev => ({
        ...prev,
        selections: { ...prev.selections, cabinSize: 'compact', equipmentLine: 'expedition' }
      }));

      // First platform selection (from null)
      store.selectOption('platform', '4x4');

      const state = store.getState();
      expect(state.selections.cabinSize).toBe('compact');
      expect(state.selections.equipmentLine).toBe('expedition');
    });

    it('ignores invalid step names', () => {
      const store = createStore(mockProductData);
      store.selectOption('invalid', 'something');
      expect(store.getState().selections.platform).toBeNull();
    });

    it('ignores accessories step (use toggleAccessory instead)', () => {
      const store = createStore(mockProductData);
      store.selectOption('accessories', 'acc-winch');
      expect(store.getState().selections.accessories).toEqual([]);
    });

    it('ignores summary step', () => {
      const store = createStore(mockProductData);
      const stateBefore = store.getState();
      store.selectOption('summary', 'anything');
      expect(store.getState()).toEqual(stateBefore);
    });
  });

  describe('toggleAccessory', () => {
    it('adds an accessory when not present', () => {
      const store = createStore(mockProductData);
      store.toggleAccessory('acc-winch');
      expect(store.getState().selections.accessories).toEqual(['acc-winch']);
    });

    it('removes an accessory when already present', () => {
      const store = createStore(mockProductData);
      store.toggleAccessory('acc-winch');
      store.toggleAccessory('acc-winch');
      expect(store.getState().selections.accessories).toEqual([]);
    });

    it('can add multiple accessories', () => {
      const store = createStore(mockProductData);
      store.toggleAccessory('acc-winch');
      store.toggleAccessory('acc-snorkel');
      expect(store.getState().selections.accessories).toEqual(['acc-winch', 'acc-snorkel']);
    });

    it('removes only the toggled accessory', () => {
      const store = createStore(mockProductData);
      store.toggleAccessory('acc-winch');
      store.toggleAccessory('acc-snorkel');
      store.toggleAccessory('acc-winch');
      expect(store.getState().selections.accessories).toEqual(['acc-snorkel']);
    });

    it('notifies subscribers on toggle', () => {
      const store = createStore(mockProductData);
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      store.toggleAccessory('acc-winch');
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearDependents', () => {
    it('clears all steps after the given step index', () => {
      const store = createStore(mockProductData);
      store.selectOption('platform', '4x4');
      store.selectOption('cabinSize', 'compact');
      store.selectOption('equipmentLine', 'expedition');
      store.toggleAccessory('acc-winch');

      // Clear from step 0 (platform) — clears cabinSize, equipmentLine, accessories
      store.clearDependents(0);

      const state = store.getState();
      expect(state.selections.platform).toBe('4x4'); // Not cleared
      expect(state.selections.cabinSize).toBeNull();
      expect(state.selections.equipmentLine).toBeNull();
      expect(state.selections.accessories).toEqual([]);
    });

    it('clears from step 1 (cabinSize) — clears equipmentLine and accessories', () => {
      const store = createStore(mockProductData);
      store.selectOption('platform', '4x4');
      store.selectOption('cabinSize', 'compact');
      store.selectOption('equipmentLine', 'expedition');
      store.toggleAccessory('acc-winch');

      store.clearDependents(1);

      const state = store.getState();
      expect(state.selections.platform).toBe('4x4');
      expect(state.selections.cabinSize).toBe('compact'); // Not cleared
      expect(state.selections.equipmentLine).toBeNull();
      expect(state.selections.accessories).toEqual([]);
    });

    it('clears from step 2 (equipmentLine) — clears accessories only', () => {
      const store = createStore(mockProductData);
      store.selectOption('platform', '4x4');
      store.selectOption('cabinSize', 'compact');
      store.selectOption('equipmentLine', 'expedition');
      store.toggleAccessory('acc-winch');

      store.clearDependents(2);

      const state = store.getState();
      expect(state.selections.platform).toBe('4x4');
      expect(state.selections.cabinSize).toBe('compact');
      expect(state.selections.equipmentLine).toBe('expedition'); // Not cleared
      expect(state.selections.accessories).toEqual([]);
    });

    it('notifies subscribers when clearing dependents', () => {
      const store = createStore(mockProductData);
      store.selectOption('platform', '4x4');
      store.selectOption('cabinSize', 'compact');

      const subscriber = vi.fn();
      store.subscribe(subscriber);
      store.clearDependents(0);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });
});
