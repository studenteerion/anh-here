/**
 * Email validation utilities
 * Uses a robust regex pattern that follows RFC 5322 standards
 */

/**
 * Comprehensive email validation regex
 * 
 * This regex validates:
 * - Local part (before @): alphanumeric, dots, hyphens, underscores, plus signs
 * - Domain part (after @): valid domain with TLD
 * - Prevents common invalid formats
 * 
 * Rejects:
 * - Multiple consecutive dots (..)
 * - Dots at start or end of local part
 * - Invalid characters
 * - Missing or invalid TLD
 * - Too short TLD (minimum 2 characters)
 * 
 * Based on RFC 5322 Official Standard with practical constraints
 */
const EMAIL_REGEX = /^(?!\.)[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+(?<!\.)@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * Additional validation rules for email format
 */
const EMAIL_VALIDATION_RULES = {
  minLength: 5,        // Minimum: a@b.c
  maxLength: 254,      // RFC 5321 maximum
  maxLocalLength: 64,  // RFC 5321 local part maximum
  minTldLength: 2,     // Minimum TLD length (e.g., .it, .uk)
  maxTldLength: 63,    // Maximum TLD length
} as const;

/**
 * Validates an email address format
 * 
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * validateEmailFormat('user@example.com') // true
 * validateEmailFormat('invalid@') // false
 * validateEmailFormat('test..user@example.com') // false (consecutive dots)
 * validateEmailFormat('.user@example.com') // false (starts with dot)
 * validateEmailFormat('user.@example.com') // false (ends with dot)
 */
export function validateEmailFormat(email: string): boolean {
  // Check null/undefined
  if (!email) {
    return false;
  }

  // Trim whitespace
  email = email.trim();

  // Check length constraints
  if (
    email.length < EMAIL_VALIDATION_RULES.minLength ||
    email.length > EMAIL_VALIDATION_RULES.maxLength
  ) {
    return false;
  }

  // Check for @ symbol (must have exactly one)
  const atIndex = email.indexOf('@');
  if (atIndex === -1 || email.indexOf('@', atIndex + 1) !== -1) {
    return false;
  }

  // Split into local and domain parts
  const [localPart, domainPart] = email.split('@');

  // Validate local part length
  if (localPart.length > EMAIL_VALIDATION_RULES.maxLocalLength) {
    return false;
  }

  // Check for consecutive dots
  if (localPart.includes('..') || domainPart.includes('..')) {
    return false;
  }

  // Validate with regex
  if (!EMAIL_REGEX.test(email)) {
    return false;
  }

  // Extract and validate TLD
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) {
    return false;
  }

  const tld = domainParts[domainParts.length - 1];
  if (
    tld.length < EMAIL_VALIDATION_RULES.minTldLength ||
    tld.length > EMAIL_VALIDATION_RULES.maxTldLength
  ) {
    return false;
  }

  // Additional check: ensure TLD is alphabetic only
  return /^[a-zA-Z]+$/.test(tld);

}

/**
 * Validates and normalizes an email address
 * 
 * @param email - Email address to validate and normalize
 * @returns Normalized email in lowercase, or null if invalid
 * 
 * @example
 * normalizeEmail('User@Example.COM') // 'user@example.com'
 * normalizeEmail('  test@test.com  ') // 'test@test.com'
 * normalizeEmail('invalid@') // null
 */
export function normalizeEmail(email: string): string | null {
  if (!validateEmailFormat(email)) {
    return null;
  }

  // Convert to lowercase and trim
  return email.trim().toLowerCase();
}

/**
 * Gets detailed validation error message for an email
 * 
 * @param email - Email to validate
 * @returns Error message if invalid, null if valid
 */
export function getEmailValidationError(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length < EMAIL_VALIDATION_RULES.minLength) {
    return `Email must be at least ${EMAIL_VALIDATION_RULES.minLength} characters`;
  }

  if (trimmedEmail.length > EMAIL_VALIDATION_RULES.maxLength) {
    return `Email must not exceed ${EMAIL_VALIDATION_RULES.maxLength} characters`;
  }

  const atIndex = trimmedEmail.indexOf('@');
  if (atIndex === -1) {
    return 'Email must contain @ symbol';
  }

  if (trimmedEmail.indexOf('@', atIndex + 1) !== -1) {
    return 'Email must contain exactly one @ symbol';
  }

  const [localPart, domainPart] = trimmedEmail.split('@');

  if (localPart.length > EMAIL_VALIDATION_RULES.maxLocalLength) {
    return `Email local part must not exceed ${EMAIL_VALIDATION_RULES.maxLocalLength} characters`;
  }

  if (localPart.startsWith('.')) {
    return 'Email cannot start with a dot';
  }

  if (localPart.endsWith('.')) {
    return 'Email local part cannot end with a dot';
  }

  if (localPart.includes('..')) {
    return 'Email cannot contain consecutive dots';
  }

  if (!domainPart || domainPart.length === 0) {
    return 'Email must have a domain';
  }

  if (domainPart.includes('..')) {
    return 'Domain cannot contain consecutive dots';
  }

  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) {
    return 'Email domain must have a valid TLD';
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < EMAIL_VALIDATION_RULES.minTldLength) {
    return `TLD must be at least ${EMAIL_VALIDATION_RULES.minTldLength} characters`;
  }

  if (!/^[a-zA-Z]+$/.test(tld)) {
    return 'TLD must contain only letters';
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return 'Invalid email format';
  }

  return null; // Valid
}
