/**
 * Unit tests for Panel Eligibility Rules Validation
 */

import {
  eligibilityRulesSchema,
  attributePredicateSchema,
  panelFormSchema,
  validateEligibilityRules,
  validateAttributePredicate,
  VALID_ROLES,
  VALID_CONSENTS,
  VALID_OPERATORS,
} from '../panel-eligibility';

describe('Panel Eligibility Validation', () => {
  describe('eligibilityRulesSchema', () => {
    it('should accept valid eligibility rules with all fields', () => {
      const validRules = {
        includeRoles: ['USER', 'PM'],
        includeVillages: ['vlg-001', 'vlg-002'],
        attributesPredicates: [
          { key: 'department', op: 'in', value: ['FOH', 'Reception'] },
        ],
        requiredConsents: ['research_contact'],
      };

      const result = eligibilityRulesSchema.safeParse(validRules);
      expect(result.success).toBe(true);
    });

    it('should accept eligibility rules with only roles', () => {
      const validRules = {
        includeRoles: ['RESEARCHER'],
      };

      const result = eligibilityRulesSchema.safeParse(validRules);
      expect(result.success).toBe(true);
    });

    it('should accept eligibility rules with only villages', () => {
      const validRules = {
        includeVillages: ['vlg-001'],
      };

      const result = eligibilityRulesSchema.safeParse(validRules);
      expect(result.success).toBe(true);
    });

    it('should accept eligibility rules with only consents', () => {
      const validRules = {
        requiredConsents: ['research_contact', 'usage_analytics'],
      };

      const result = eligibilityRulesSchema.safeParse(validRules);
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const invalidRules = {
        includeRoles: ['INVALID_ROLE'],
      };

      const result = eligibilityRulesSchema.safeParse(invalidRules);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const errorMessages = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessages).toContain('Invalid role');
      }
    });

    it('should reject empty roles array when specified', () => {
      const invalidRules = {
        includeRoles: [],
      };

      const result = eligibilityRulesSchema.safeParse(invalidRules);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const errorMessages = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessages).toContain('at least one role');
      }
    });

    it('should reject empty villages array when specified', () => {
      const invalidRules = {
        includeVillages: [],
      };

      const result = eligibilityRulesSchema.safeParse(invalidRules);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const errorMessages = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessages).toContain('at least one village');
      }
    });

    it('should reject invalid consent type', () => {
      const invalidRules = {
        requiredConsents: ['invalid_consent'],
      };

      const result = eligibilityRulesSchema.safeParse(invalidRules);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const errorMessages = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessages).toContain('Invalid consent type');
      }
    });

    it('should accept empty object (all optional)', () => {
      const emptyRules = {};

      const result = eligibilityRulesSchema.safeParse(emptyRules);
      expect(result.success).toBe(true);
    });
  });

  describe('attributePredicateSchema', () => {
    it('should accept valid "in" predicate with array value', () => {
      const validPredicate = {
        key: 'department',
        op: 'in',
        value: ['FOH', 'Reception'],
      };

      const result = attributePredicateSchema.safeParse(validPredicate);
      expect(result.success).toBe(true);
    });

    it('should accept valid "equals" predicate with string value', () => {
      const validPredicate = {
        key: 'role',
        op: 'equals',
        value: 'PM',
      };

      const result = attributePredicateSchema.safeParse(validPredicate);
      expect(result.success).toBe(true);
    });

    it('should accept valid "gt" predicate with number value', () => {
      const validPredicate = {
        key: 'tenure_days',
        op: 'gt',
        value: 90,
      };

      const result = attributePredicateSchema.safeParse(validPredicate);
      expect(result.success).toBe(true);
    });

    it('should accept valid "lt" predicate with number value', () => {
      const validPredicate = {
        key: 'age',
        op: 'lt',
        value: 65,
      };

      const result = attributePredicateSchema.safeParse(validPredicate);
      expect(result.success).toBe(true);
    });

    it('should accept valid "contains" predicate with string value', () => {
      const validPredicate = {
        key: 'email',
        op: 'contains',
        value: '@clubmed.com',
      };

      const result = attributePredicateSchema.safeParse(validPredicate);
      expect(result.success).toBe(true);
    });

    it('should reject "in" operator with non-array value', () => {
      const invalidPredicate = {
        key: 'department',
        op: 'in',
        value: 'FOH',
      };

      const result = attributePredicateSchema.safeParse(invalidPredicate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject "gt" operator with string value', () => {
      const invalidPredicate = {
        key: 'tenure_days',
        op: 'gt',
        value: 'ninety',
      };

      const result = attributePredicateSchema.safeParse(invalidPredicate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject empty key', () => {
      const invalidPredicate = {
        key: '',
        op: 'equals',
        value: 'test',
      };

      const result = attributePredicateSchema.safeParse(invalidPredicate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject invalid operator', () => {
      const invalidPredicate = {
        key: 'test',
        op: 'invalid_op',
        value: 'test',
      };

      const result = attributePredicateSchema.safeParse(invalidPredicate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('panelFormSchema', () => {
    it('should accept valid panel form data', () => {
      const validData = {
        name: 'Test Panel',
        description: 'A test research panel',
        sizeTarget: 100,
        eligibilityRules: {
          includeRoles: ['USER'],
          requiredConsents: ['research_contact'],
        },
      };

      const result = panelFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject name that is too short', () => {
      const invalidData = {
        name: 'AB',
        eligibilityRules: { includeRoles: ['USER'] },
      };

      const result = panelFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const errorMessages = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessages).toContain('at least 3 characters');
      }
    });

    it('should reject name that is too long', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        eligibilityRules: { includeRoles: ['USER'] },
      };

      const result = panelFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const errorMessages = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessages).toContain('100 characters');
      }
    });

    it('should reject negative size target', () => {
      const invalidData = {
        name: 'Test Panel',
        sizeTarget: -10,
        eligibilityRules: { includeRoles: ['USER'] },
      };

      const result = panelFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const errorMessages = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessages).toContain('positive');
      }
    });

    it('should reject non-integer size target', () => {
      const invalidData = {
        name: 'Test Panel',
        sizeTarget: 10.5,
        eligibilityRules: { includeRoles: ['USER'] },
      };

      const result = panelFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const errorMessages = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessages).toContain('whole number');
      }
    });

    it('should accept null size target', () => {
      const validData = {
        name: 'Test Panel',
        sizeTarget: null,
        eligibilityRules: { includeRoles: ['USER'] },
      };

      const result = panelFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateEligibilityRules helper', () => {
    it('should return success for valid rules', () => {
      const validRules = {
        includeRoles: ['USER', 'PM'],
        requiredConsents: ['research_contact'],
      };

      const result = validateEligibilityRules(validRules);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validRules);
    });

    it('should return formatted errors for invalid rules', () => {
      const invalidRules = {
        includeRoles: ['INVALID_ROLE'],
      };

      const result = validateEligibilityRules(invalidRules);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      if (result.errors) {
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateAttributePredicate helper', () => {
    it('should return success for valid predicate', () => {
      const validPredicate = {
        key: 'department',
        op: 'in' as const,
        value: ['FOH'],
      };

      const result = validateAttributePredicate(validPredicate);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validPredicate);
    });

    it('should return formatted errors for invalid predicate', () => {
      const invalidPredicate = {
        key: '',
        op: 'in' as const,
        value: 'not-an-array', // 'in' operator requires array
      };

      const result = validateAttributePredicate(invalidPredicate);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('constant exports', () => {
    it('should export valid roles', () => {
      expect(VALID_ROLES).toEqual(['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR']);
    });

    it('should export valid consents', () => {
      expect(VALID_CONSENTS).toEqual(['research_contact', 'usage_analytics', 'email_updates']);
    });

    it('should export valid operators', () => {
      expect(VALID_OPERATORS).toEqual(['in', 'equals', 'contains', 'gt', 'lt']);
    });
  });
});
