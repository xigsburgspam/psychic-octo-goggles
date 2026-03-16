/**
 * Input sanitization utilities
 */

/**
 * Strip HTML tags and dangerous characters from a string
 */
/**
 * Strip HTML tags from text.
 * For dangerous tags (script, style, etc.) also removes their inner content.
 */
function sanitizeText(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str
    .slice(0, maxLen)
    // Remove script/style blocks entirely (tag + content)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove all remaining HTML tags (keeps inner text)
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    // Remove bare angle brackets
    .replace(/[<>]/g, '')
    // Remove JS protocol
    .replace(/javascript:/gi, '')
    // Remove inline event handlers
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Sanitize an array of interest strings
 */
function sanitizeInterests(arr, maxItems = 10) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map(i => sanitizeText(String(i), 30).toLowerCase())
    .filter(i => i.length >= 2 && i.length <= 30)
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe
}

/**
 * Sanitize a nickname
 */
function sanitizeNickname(str) {
  if (typeof str !== 'string') return 'Anonymous';
  return str
    .slice(0, 30)
    .replace(/<\/?[a-zA-Z][^>]*>/g, '') // strip HTML tags
    .replace(/[<>'"]/g, '')              // strip remaining special chars
    .trim() || 'Anonymous';
}

module.exports = { sanitizeText, sanitizeInterests, sanitizeNickname };
