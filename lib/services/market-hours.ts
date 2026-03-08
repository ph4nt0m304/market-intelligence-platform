/**
 * Market Hours Service
 * 
 * Handles market hours detection for Trade Republic / Lang & Schwarz
 * and determines when price comparisons are meaningful.
 */

import type { MarketState } from '@/lib/types/arbitrage';
import { MARKET_HOURS_CONFIG } from '@/lib/config/instruments';

/**
 * Check if a given date is a weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a given date is a German holiday
 * This is a simplified check - in production, use a proper holiday API
 */
function isGermanHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();
  
  // Fixed German holidays
  const fixedHolidays = [
    { month: 1, day: 1 },   // Neujahr
    { month: 5, day: 1 },   // Tag der Arbeit
    { month: 10, day: 3 },  // Tag der Deutschen Einheit
    { month: 12, day: 25 }, // 1. Weihnachtstag
    { month: 12, day: 26 }, // 2. Weihnachtstag
  ];
  
  for (const holiday of fixedHolidays) {
    if (month === holiday.month && day === holiday.day) {
      return true;
    }
  }
  
  // Easter-based holidays (simplified calculation)
  // In production, use a proper library for Easter calculation
  const easterDates: Record<number, { month: number; day: number }> = {
    2024: { month: 3, day: 31 },
    2025: { month: 4, day: 20 },
    2026: { month: 4, day: 5 },
    2027: { month: 3, day: 28 },
  };
  
  const easter = easterDates[year];
  if (easter) {
    const easterDate = new Date(year, easter.month - 1, easter.day);
    const goodFriday = new Date(easterDate);
    goodFriday.setDate(easterDate.getDate() - 2);
    const easterMonday = new Date(easterDate);
    easterMonday.setDate(easterDate.getDate() + 1);
    
    if (
      (month === goodFriday.getMonth() + 1 && day === goodFriday.getDate()) ||
      (month === easterMonday.getMonth() + 1 && day === easterMonday.getDate())
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Parse time string (HH:mm) to hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Get current time in a specific timezone
 */
function getTimeInTimezone(date: Date, timezone: string): Date {
  const localTime = date.toLocaleString('en-US', { timeZone: timezone });
  return new Date(localTime);
}

/**
 * Determine the market state for Trade Republic / Lang & Schwarz
 */
export function getTRMarketState(date: Date = new Date()): MarketState {
  const config = MARKET_HOURS_CONFIG.TRADE_REPUBLIC;
  const tradingDays = config.tradingDays as readonly number[];
  const localTime = getTimeInTimezone(date, config.timezone);
  
  // Check if it's a trading day
  const dayOfWeek = localTime.getDay();
  if (!tradingDays.includes(dayOfWeek)) {
    return 'CLOSED';
  }
  
  // Check for holidays
  if (isGermanHoliday(localTime)) {
    return 'CLOSED';
  }
  
  // Check time of day
  const currentHours = localTime.getHours();
  const currentMinutes = localTime.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  
  const open = parseTime(config.regularOpen);
  const close = parseTime(config.regularClose);
  const openTotalMinutes = open.hours * 60 + open.minutes;
  const closeTotalMinutes = close.hours * 60 + close.minutes;
  
  if (currentTotalMinutes < openTotalMinutes) {
    return 'PRE_MARKET';
  }
  
  if (currentTotalMinutes >= closeTotalMinutes) {
    return 'AFTER_HOURS';
  }
  
  return 'OPEN';
}

/**
 * Determine the market state for XETRA
 */
export function getXETRAMarketState(date: Date = new Date()): MarketState {
  const config = MARKET_HOURS_CONFIG.XETRA;
  const tradingDays = config.tradingDays as readonly number[];
  const localTime = getTimeInTimezone(date, config.timezone);
  
  const dayOfWeek = localTime.getDay();
  if (!tradingDays.includes(dayOfWeek)) {
    return 'CLOSED';
  }
  
  if (isGermanHoliday(localTime)) {
    return 'CLOSED';
  }
  
  const currentHours = localTime.getHours();
  const currentMinutes = localTime.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  
  const open = parseTime(config.regularOpen);
  const close = parseTime(config.regularClose);
  const openTotalMinutes = open.hours * 60 + open.minutes;
  const closeTotalMinutes = close.hours * 60 + close.minutes;
  
  if (currentTotalMinutes < openTotalMinutes) {
    return 'PRE_MARKET';
  }
  
  if (currentTotalMinutes >= closeTotalMinutes) {
    return 'AFTER_HOURS';
  }
  
  return 'OPEN';
}

/**
 * Binance is always open (24/7)
 */
export function getBinanceMarketState(): MarketState {
  return 'OPEN';
}

/**
 * Check if TR and Binance prices are comparable
 * Returns true if both markets are in a state where comparison is meaningful
 */
export function areMarketsComparable(date: Date = new Date()): {
  comparable: boolean;
  trState: MarketState;
  binanceState: MarketState;
  reason?: string;
  confidencePenalty: number;
} {
  const trState = getTRMarketState(date);
  const binanceState = getBinanceMarketState();
  
  // Binance is always open, so we only check TR
  if (trState === 'OPEN') {
    return {
      comparable: true,
      trState,
      binanceState,
      confidencePenalty: 0,
    };
  }
  
  if (trState === 'CLOSED') {
    return {
      comparable: false,
      trState,
      binanceState,
      reason: 'Trade Republic market is closed (weekend or holiday)',
      confidencePenalty: 1.0, // Full penalty - don't compare
    };
  }
  
  // Pre-market or after-hours
  return {
    comparable: true, // Still comparable but with reduced confidence
    trState,
    binanceState,
    reason: `Trade Republic is in ${trState === 'PRE_MARKET' ? 'pre-market' : 'after-hours'} - spreads may be wider`,
    confidencePenalty: 0.3, // 30% confidence penalty
  };
}

/**
 * Get time until next market open
 */
export function getTimeUntilTROpen(date: Date = new Date()): {
  isOpen: boolean;
  msUntilOpen?: number;
  nextOpenTime?: Date;
  formattedDuration?: string;
} {
  const trState = getTRMarketState(date);
  
  if (trState === 'OPEN') {
    return { isOpen: true };
  }
  
  const config = MARKET_HOURS_CONFIG.TRADE_REPUBLIC;
  const tradingDays = config.tradingDays as readonly number[];
  const localTime = getTimeInTimezone(date, config.timezone);
  const open = parseTime(config.regularOpen);
  
  // Find the next trading day
  const nextOpen = new Date(localTime);
  nextOpen.setHours(open.hours, open.minutes, 0, 0);
  
  // If we're past today's open, move to next day
  if (localTime >= nextOpen || trState === 'AFTER_HOURS') {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  // Skip weekends and holidays
  while (!tradingDays.includes(nextOpen.getDay()) || isGermanHoliday(nextOpen)) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  const msUntilOpen = nextOpen.getTime() - localTime.getTime();
  
  // Format duration
  const hours = Math.floor(msUntilOpen / (1000 * 60 * 60));
  const minutes = Math.floor((msUntilOpen % (1000 * 60 * 60)) / (1000 * 60));
  const formattedDuration = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m`;
  
  return {
    isOpen: false,
    msUntilOpen,
    nextOpenTime: nextOpen,
    formattedDuration,
  };
}

/**
 * Get time until market close
 */
export function getTimeUntilTRClose(date: Date = new Date()): {
  isOpen: boolean;
  msUntilClose?: number;
  closeTime?: Date;
  formattedDuration?: string;
} {
  const trState = getTRMarketState(date);
  
  if (trState !== 'OPEN') {
    return { isOpen: false };
  }
  
  const config = MARKET_HOURS_CONFIG.TRADE_REPUBLIC;
  const localTime = getTimeInTimezone(date, config.timezone);
  const close = parseTime(config.regularClose);
  
  const closeTime = new Date(localTime);
  closeTime.setHours(close.hours, close.minutes, 0, 0);
  
  const msUntilClose = closeTime.getTime() - localTime.getTime();
  
  const hours = Math.floor(msUntilClose / (1000 * 60 * 60));
  const minutes = Math.floor((msUntilClose % (1000 * 60 * 60)) / (1000 * 60));
  const formattedDuration = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m`;
  
  return {
    isOpen: true,
    msUntilClose,
    closeTime,
    formattedDuration,
  };
}

/**
 * Check if it's the weekend gap period
 * Friday after close to Sunday evening
 */
export function isWeekendGapPeriod(date: Date = new Date()): boolean {
  const config = MARKET_HOURS_CONFIG.TRADE_REPUBLIC;
  const localTime = getTimeInTimezone(date, config.timezone);
  const dayOfWeek = localTime.getDay();
  
  // Saturday
  if (dayOfWeek === 6) return true;
  
  // Sunday
  if (dayOfWeek === 0) return true;
  
  // Friday after close
  if (dayOfWeek === 5) {
    const close = parseTime(config.regularClose);
    const currentHours = localTime.getHours();
    const currentMinutes = localTime.getMinutes();
    if (currentHours > close.hours || 
        (currentHours === close.hours && currentMinutes >= close.minutes)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get a human-readable market status string
 */
export function getMarketStatusText(date: Date = new Date()): string {
  const trState = getTRMarketState(date);

  switch (trState) {
    case 'OPEN': {
      const closeInfo = getTimeUntilTRClose(date);
      return `Marche ouvert - ferme dans ${closeInfo.formattedDuration}`;
    }
    case 'CLOSED': {
      const openInfo = getTimeUntilTROpen(date);
      return `Marche ferme - ouvre dans ${openInfo.formattedDuration}`;
    }
    case 'PRE_MARKET': {
      const preOpenInfo = getTimeUntilTROpen(date);
      return `Pre-ouverture - ouvre dans ${preOpenInfo.formattedDuration}`;
    }
    case 'AFTER_HOURS': {
      const afterOpenInfo = getTimeUntilTROpen(date);
      return `Hors seance - ouvre dans ${afterOpenInfo.formattedDuration}`;
    }
    default:
      return 'Statut inconnu';
  }
}

