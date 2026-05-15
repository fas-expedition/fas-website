// rules.js - Constraint rule engine for option dependencies and exclusions

/**
 * Create a rule engine that evaluates constraint rules against current selections.
 * Rules are read purely from data — no hardcoded logic.
 * @param {Array} rules - Array of rule objects from product data
 * @returns {{ evaluate: Function, hasViolations: Function }}
 */
export function createRuleEngine(rules) {
  /**
   * Evaluate all rules given the current selections.
   * Only processes 'excludes' and 'requires' rules. 'recommend' rules are ignored.
   * @param {Object} selections - { platform, cabinSize, equipmentLine, accessories }
   * @param {string} [locale='de'] - Locale for message resolution
   * @returns {{ messages: Array, disabled: Array, autoSelected: Array }}
   */
  function evaluate(selections, locale = 'de') {
    const messages = [];
    const disabled = new Set();
    const autoSelected = new Set();

    // Collect all currently selected option IDs
    const accessories = selections.accessories || [];
    const allSelected = [
      selections.platform,
      selections.cabinSize,
      selections.equipmentLine,
      ...accessories
    ].filter(Boolean);

    for (const rule of rules) {
      // Only apply rule if its source is currently selected
      if (!allSelected.includes(rule.source)) continue;

      // Skip 'recommend' rules — only handle excludes and requires
      if (rule.type === 'recommend') continue;

      if (rule.type === 'excludes') {
        disabled.add(rule.target);
        messages.push({
          type: 'excludes',
          source: rule.source,
          target: rule.target,
          message: rule.message[locale] || rule.message.de || '',
        });
      } else if (rule.type === 'requires') {
        // If the required target is not already selected, mark it
        if (!allSelected.includes(rule.target)) {
          autoSelected.add(rule.target);
        }
        messages.push({
          type: 'requires',
          source: rule.source,
          target: rule.target,
          message: rule.message[locale] || rule.message.de || '',
        });
      }
    }

    return {
      messages: [...messages],
      disabled: [...disabled],
      autoSelected: [...autoSelected],
    };
  }

  /**
   * Check if any currently selected option is in the disabled set.
   * A violation means the user has a selection that conflicts with rules.
   * @param {Object} selections - { platform, cabinSize, equipmentLine, accessories }
   * @param {Array} disabled - Array of disabled option IDs
   * @returns {boolean}
   */
  function hasViolations(selections, disabled) {
    if (!disabled || disabled.length === 0) return false;
    const accessories = selections.accessories || [];
    const allSelected = [
      selections.cabinSize,
      selections.equipmentLine,
      ...accessories
    ].filter(Boolean);
    return allSelected.some(id => disabled.includes(id));
  }

  return { evaluate, hasViolations };
}
