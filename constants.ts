export const APP_NAME = "LegalEase";

// Input Validation Constants
export const MIN_INPUT_LENGTH = 10;
export const MAX_INPUT_LENGTH = 3000; // Prevent massive payloads
export const DISALLOWED_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/gm, // Basic XSS prevention
  /javascript:/i,
  /on\w+=/i // Event handlers
];

// Rate Limiting (Client-side throttle to be polite)
// Note: Real security rate limiting must happen on the backend/WAF.
export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 5; 

// Gemini Configuration
export const GEMINI_MODEL = "gemini-3-flash-preview";

export const SAMPLE_LEGAL_TEXT = `The Tenant shall indemnify and hold the Landlord harmless from and against any and all claims, liabilities, judgments, costs, expenses, and damages, including reasonable attorneys' fees, arising out of or in connection with the Tenant's use and occupancy of the Premises, except to the extent caused by the gross negligence or willful misconduct of the Landlord.`;