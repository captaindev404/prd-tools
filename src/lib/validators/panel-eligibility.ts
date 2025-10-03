/**
 * Zod validation schemas for Panel Eligibility Rules
 * Based on DSL spec in dsl/global.yaml (lines 162-169)
 */

import { z } from 'zod';

/**
 * Valid role values from Prisma schema
 */
export const VALID_ROLES = ['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR'] as const;

/**
 * Valid consent types from DSL
 */
export const VALID_CONSENTS = ['research_contact', 'usage_analytics', 'email_updates'] as const;

/**
 * Valid attribute predicate operators
 */
export const VALID_OPERATORS = ['in', 'equals', 'contains', 'gt', 'lt'] as const;

/**
 * Schema for attribute predicate validation
 */
export const attributePredicateSchema = z.object({
  key: z.string().min(1, 'Attribute key is required'),
  op: z.enum(VALID_OPERATORS, {
    message: 'Invalid operator. Must be one of: in, equals, contains, gt, lt',
  }),
  value: z.union([
    z.string().min(1, 'Value is required'),
    z.array(z.string().min(1, 'Array values cannot be empty')).min(1, 'At least one value required for array'),
    z.number(),
  ], {
    message: 'Value must be a string, number, or array of strings',
  }),
}).refine(
  (data) => {
    // 'in' operator requires array value
    if (data.op === 'in') {
      return Array.isArray(data.value) && data.value.length > 0;
    }
    // 'gt' and 'lt' operators require number value
    if (data.op === 'gt' || data.op === 'lt') {
      return typeof data.value === 'number';
    }
    return true;
  },
  {
    message: "'in' operator requires array value, 'gt'/'lt' operators require number value",
    path: ['value'],
  }
);

/**
 * Schema for eligibility rules validation
 */
export const eligibilityRulesSchema = z.object({
  includeRoles: z
    .array(z.enum(VALID_ROLES, {
      message: 'Invalid role. Must be one of: USER, PM, PO, RESEARCHER, ADMIN, MODERATOR',
    }))
    .optional()
    .refine(
      (roles) => !roles || roles.length > 0,
      { message: 'If include_roles is specified, it must contain at least one role' }
    ),

  includeVillages: z
    .array(z.string().min(1, 'Village ID cannot be empty'))
    .optional()
    .refine(
      (villages) => !villages || villages.length > 0,
      { message: 'If include_villages is specified, it must contain at least one village' }
    ),

  attributesPredicates: z
    .array(attributePredicateSchema)
    .optional()
    .refine(
      (predicates) => !predicates || predicates.length > 0,
      { message: 'If attribute predicates are specified, at least one predicate is required' }
    ),

  requiredConsents: z
    .array(z.enum(VALID_CONSENTS, {
      message: 'Invalid consent type. Must be one of: research_contact, usage_analytics, email_updates',
    }))
    .optional()
    .refine(
      (consents) => !consents || consents.length > 0,
      { message: 'If required_consents is specified, at least one consent is required' }
    ),
});

/**
 * Type inference from schema
 */
export type EligibilityRulesInput = z.infer<typeof eligibilityRulesSchema>;
export type AttributePredicateInput = z.infer<typeof attributePredicateSchema>;

/**
 * Schema for panel creation/update with eligibility rules
 */
export const panelFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Panel name must be at least 3 characters')
    .max(100, 'Panel name must not exceed 100 characters'),

  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),

  sizeTarget: z
    .number()
    .int('Size target must be a whole number')
    .positive('Size target must be a positive number')
    .optional()
    .nullable(),

  eligibilityRules: eligibilityRulesSchema,
});

export type PanelFormInput = z.infer<typeof panelFormSchema>;

/**
 * Validate eligibility rules and return formatted errors
 */
export function validateEligibilityRules(rules: unknown): {
  success: boolean;
  data?: EligibilityRulesInput;
  errors?: Record<string, string[]>;
} {
  const result = eligibilityRulesSchema.safeParse(rules);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into field-specific error messages
  const errors: Record<string, string[]> = {};
  if (result.error && result.error.issues) {
    result.error.issues.forEach((err) => {
      const path = err.path.join('.') || 'root';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });
  }

  return { success: false, errors };
}

/**
 * Validate individual attribute predicate
 */
export function validateAttributePredicate(predicate: unknown): {
  success: boolean;
  data?: AttributePredicateInput;
  errors?: Record<string, string[]>;
} {
  const result = attributePredicateSchema.safeParse(predicate);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  if (result.error && result.error.issues) {
    result.error.issues.forEach((err) => {
      const path = err.path.join('.') || 'root';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });
  }

  return { success: false, errors };
}
