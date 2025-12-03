/**
 * Get start of day (00:00:00)
 */
export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day (23:59:59)
 */
export const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return startOfDay(date1).getTime() === startOfDay(date2).getTime();
};

/**
 * Check if date is Sunday
 */
export const isSunday = (date: Date): boolean => {
  return date.getDay() === 0;
};

/**
 * Check if date is Saturday
 */
export const isSaturday = (date: Date): boolean => {
  return date.getDay() === 6;
};

/**
 * Check if date is weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  return isSaturday(date) || isSunday(date);
};

/**
 * Calculate day difference between two dates
 */
export const dayDiff = (futureDate: Date, baseDate: Date): number => {
  const future = startOfDay(futureDate).getTime();
  const base = startOfDay(baseDate).getTime();
  return Math.round((future - base) / (1000 * 60 * 60 * 24));
};

/**
 * Count working days between two dates (Monday-Saturday, inclusive)
 * Excludes Sundays
 */
export const workingDaysBetween = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (!isSunday(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Count total days between two dates (inclusive)
 */
export const totalDaysBetween = (startDate: Date, endDate: Date): number => {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Add working days to a date (skips Sundays)
 */
export const addWorkingDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    if (!isSunday(result)) {
      addedDays++;
    }
  }

  return result;
};

/**
 * Check if date is in the past
 */
export const isPast = (date: Date): boolean => {
  return date < new Date();
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: Date): boolean => {
  return date > new Date();
};

/**
 * Format date to Indonesian locale
 */
export const formatDateID = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Format date time to Indonesian locale
 */
export const formatDateTimeID = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Validate date range (end must be after start)
 */
export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  return endDate > startDate;
};
