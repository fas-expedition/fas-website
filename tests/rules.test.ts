import { describe, it, expect } from 'vitest';
import { createRuleEngine } from '../src/assets/js/configurator/rules.js';

const sampleRules = [
  {
    id: 'rule-4x4-no-extended',
    source: '4x4',
    type: 'excludes',
    target: 'extended',
    message: {
      de: 'Die 4x4-Plattform bietet nicht genügend Nutzlast für die XL-Wohnkabine.',
      en: 'The 4x4 platform does not provide sufficient payload for the XL living cabin.',
    },
  },
  {
    id: 'rule-4x4-no-military',
    source: '4x4',
    type: 'excludes',
    target: 'military',
    message: {
      de: 'Die Military-Ausstattung ist nur für 6x6- und 8x8-Plattformen verfügbar.',
      en: 'The Military equipment is only available for 6x6 and 8x8 platforms.',
    },
  },
  {
    id: 'rule-military-no-interior',
    source: 'military',
    type: 'excludes',
    target: 'acc-interior-upgrade',
    message: {
      de: 'Der Premium-Innenausbau ist nicht mit der Military-Ausstattung kombinierbar.',
      en: 'The Premium Interior Upgrade is not compatible with Military equipment.',
    },
  },
  {
    id: 'rule-solar-requires-luxury',
    source: 'acc-solar-upgrade',
    type: 'requires',
    target: 'luxury',
    message: {
      de: 'Die Solaranlage XL erfordert die Luxury-Ausstattung (Lithium-Batteriesystem benötigt).',
      en: 'The Solar System XL requires Luxury equipment (Lithium battery system needed).',
    },
  },
  {
    id: 'rule-recommend',
    source: '8x8',
    type: 'recommend',
    target: 'acc-camera-system',
    message: {
      de: 'Für die 8x8-Plattform empfehlen wir das 360°-Kamerasystem.',
      en: 'For the 8x8 platform, we recommend the 360° camera system.',
    },
  },
];

describe('rules.js — createRuleEngine', () => {
  describe('evaluate()', () => {
    it('returns empty results when no selections match any rule source', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: '6x6',
        cabinSize: 'standard',
        equipmentLine: 'expedition',
        accessories: [],
      });

      expect(result.messages).toEqual([]);
      expect(result.disabled).toEqual([]);
      expect(result.autoSelected).toEqual([]);
    });

    it('returns disabled targets for "excludes" rules when source is selected', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: '4x4',
        cabinSize: null,
        equipmentLine: null,
        accessories: [],
      });

      expect(result.disabled).toContain('extended');
      expect(result.disabled).toContain('military');
      expect(result.disabled).toHaveLength(2);
    });

    it('returns messages for triggered "excludes" rules', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate(
        { platform: '4x4', cabinSize: null, equipmentLine: null, accessories: [] },
        'en'
      );

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].type).toBe('excludes');
      expect(result.messages[0].message).toBe(
        'The 4x4 platform does not provide sufficient payload for the XL living cabin.'
      );
    });

    it('returns autoSelected targets for "requires" rules when target is NOT selected', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: '6x6',
        cabinSize: 'standard',
        equipmentLine: 'expedition',
        accessories: ['acc-solar-upgrade'],
      });

      expect(result.autoSelected).toContain('luxury');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('requires');
    });

    it('does NOT add to autoSelected when "requires" target is already selected', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: '6x6',
        cabinSize: 'standard',
        equipmentLine: 'luxury',
        accessories: ['acc-solar-upgrade'],
      });

      expect(result.autoSelected).toEqual([]);
      // Message is still shown (informational)
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('requires');
    });

    it('uses German locale by default', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: '4x4',
        cabinSize: null,
        equipmentLine: null,
        accessories: [],
      });

      expect(result.messages[0].message).toBe(
        'Die 4x4-Plattform bietet nicht genügend Nutzlast für die XL-Wohnkabine.'
      );
    });

    it('uses English locale when specified', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate(
        { platform: '4x4', cabinSize: null, equipmentLine: null, accessories: [] },
        'en'
      );

      expect(result.messages[0].message).toBe(
        'The 4x4 platform does not provide sufficient payload for the XL living cabin.'
      );
    });

    it('ignores "recommend" rule type (only handles requires/excludes)', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: '8x8',
        cabinSize: null,
        equipmentLine: null,
        accessories: [],
      });

      expect(result.messages).toEqual([]);
      expect(result.disabled).toEqual([]);
      expect(result.autoSelected).toEqual([]);
    });

    it('evaluates multiple rule types from different sources simultaneously', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: '6x6',
        cabinSize: 'standard',
        equipmentLine: 'military',
        accessories: ['acc-solar-upgrade'],
      });

      // military excludes acc-interior-upgrade
      expect(result.disabled).toContain('acc-interior-upgrade');
      // acc-solar-upgrade requires luxury (not selected)
      expect(result.autoSelected).toContain('luxury');
      // Should have messages for both
      expect(result.messages.length).toBe(2);
    });

    it('handles empty accessories array gracefully', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: null,
        cabinSize: null,
        equipmentLine: null,
        accessories: [],
      });

      expect(result.messages).toEqual([]);
      expect(result.disabled).toEqual([]);
      expect(result.autoSelected).toEqual([]);
    });

    it('handles undefined accessories gracefully', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.evaluate({
        platform: '4x4',
        cabinSize: null,
        equipmentLine: null,
        accessories: undefined as unknown as string[],
      });

      expect(result.disabled).toContain('extended');
      expect(result.disabled).toContain('military');
    });
  });

  describe('hasViolations()', () => {
    it('returns false when no selected option is in the disabled set', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.hasViolations(
        { platform: '6x6', cabinSize: 'standard', equipmentLine: 'expedition', accessories: [] },
        ['extended', 'military']
      );

      expect(result).toBe(false);
    });

    it('returns true when a selected option is in the disabled set', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.hasViolations(
        { platform: '4x4', cabinSize: 'extended', equipmentLine: null, accessories: [] },
        ['extended', 'military']
      );

      expect(result).toBe(true);
    });

    it('returns true when a selected accessory is in the disabled set', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.hasViolations(
        { platform: '6x6', cabinSize: 'standard', equipmentLine: 'military', accessories: ['acc-interior-upgrade'] },
        ['acc-interior-upgrade']
      );

      expect(result).toBe(true);
    });

    it('returns false when disabled array is empty', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.hasViolations(
        { platform: '4x4', cabinSize: 'extended', equipmentLine: 'military', accessories: ['acc-interior-upgrade'] },
        []
      );

      expect(result).toBe(false);
    });

    it('returns false when disabled is undefined', () => {
      const engine = createRuleEngine(sampleRules);
      const result = engine.hasViolations(
        { platform: '4x4', cabinSize: 'extended', equipmentLine: null, accessories: [] },
        undefined as unknown as string[]
      );

      expect(result).toBe(false);
    });
  });
});
