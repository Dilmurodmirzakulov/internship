/**
 * Safely formats a date string to locale date string
 * @param {string|Date} dateString - The date string or Date object to format
 * @param {string} fallback - The fallback text to show if date is invalid
 * @returns {string} Formatted date string or fallback
 */
export const formatDate = (dateString, fallback = 'Not set') => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleDateString();
  } catch (error) {
    return fallback;
  }
};

/**
 * Safely formats a date string with specific locale and options
 * @param {string|Date} dateString - The date string or Date object to format
 * @param {string} locale - The locale to use (default: 'en-US')
 * @param {object} options - Intl.DateTimeFormat options
 * @param {string} fallback - The fallback text to show if date is invalid
 * @returns {string} Formatted date string or fallback
 */
export const formatDateWithOptions = (dateString, locale = 'en-US', options = {}, fallback = 'Not set') => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    return fallback;
  }
};

/**
 * Checks if a date string is valid
 * @param {string|Date} dateString - The date string or Date object to validate
 * @returns {boolean} True if date is valid, false otherwise
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}; 