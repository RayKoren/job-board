// Phone validation utilities for consistent phone number handling across the site

export const phonePatterns = {
  // US phone number patterns
  full: /^\(\d{3}\) \d{3}-\d{4}$/,           // (307) 555-1234
  dashed: /^\d{3}-\d{3}-\d{4}$/,             // 307-555-1234
  raw: /^\d{10}$/,                           // 3075551234
  // Combined pattern for HTML input validation
  combined: "^\\(\\d{3}\\) \\d{3}-\\d{4}$|^\\d{3}-\\d{3}-\\d{4}$|^\\d{10}$"
};

/**
 * Validates if a phone number matches acceptable formats
 * @param phone - The phone number to validate
 * @returns boolean - True if valid, false otherwise
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || phone.trim() === '') return true; // Allow empty (optional fields)
  
  return phonePatterns.full.test(phone) || 
         phonePatterns.dashed.test(phone) || 
         phonePatterns.raw.test(phone);
};

/**
 * Formats a phone number to the preferred (XXX) XXX-XXXX format
 * @param phone - The phone number to format
 * @returns string - Formatted phone number or original if invalid
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Only format if we have exactly 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone; // Return original if not 10 digits
};

/**
 * Gets phone validation error message
 * @param phone - The phone number to validate
 * @returns string - Error message or empty string if valid
 */
export const getPhoneValidationError = (phone: string): string => {
  if (!phone || phone.trim() === '') return ''; // Allow empty
  
  if (!isValidPhone(phone)) {
    return 'Please enter a valid 10-digit phone number (e.g., (307) 555-1234)';
  }
  
  return '';
};

/**
 * Phone input props for consistent styling and validation
 */
export const phoneInputProps = {
  type: "tel" as const,
  maxLength: 20,
  pattern: phonePatterns.combined,
  placeholder: "e.g. (307) 555-1234"
};