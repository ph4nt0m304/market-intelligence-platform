// Application constants and configuration

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.traderepublic.com',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.traderepublic.com',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Dashboard Configuration
 */
export const DASHBOARD_CONFIG = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  PERFORMANCE_DAYS: 30,
  CHART_HEIGHT: 300,
  TABLE_PAGE_SIZE: 10,
} as const;

/**
 * Routes
 */
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  SETTINGS: '/dashboard/settings',
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  SESSION: 'tradeSession',
  THEME: 'theme',
  PREFERENCES: 'preferences',
  WATCHLIST: 'watchlist',
  API_STATE: 'apiState',
} as const;

/**
 * Session Configuration
 */
export const SESSION_CONFIG = {
  STORAGE_KEY: STORAGE_KEYS.SESSION,
  EXPIRY_TIME: 24 * 60 * 60 * 1000, // 24 hours
  AUTO_LOGOUT: true,
} as const;

/**
 * Notification Messages
 */
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Successfully logged in',
    LOGOUT: 'Successfully logged out',
    TRADE: 'Trade executed successfully',
    SAVE: 'Changes saved successfully',
  },
  ERROR: {
    LOGIN_FAILED: 'Login failed. Please check your credentials.',
    NETWORK: 'Network error. Please try again.',
    INVALID_INPUT: 'Please check your input and try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
  },
  INFO: {
    LOADING: 'Loading...',
    PROCESSING: 'Processing...',
  },
} as const;

/**
 * Time Formats
 */
export const TIME_FORMATS = {
  SHORT_DATE: 'MMM d, yyyy',
  LONG_DATE: 'MMMM d, yyyy',
  TIME: 'h:mm a',
  DATE_TIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
} as const;

/**
 * Market Hours (in hours)
 */
export const MARKET_HOURS = {
  OPEN: 9.5, // 9:30 AM
  CLOSE: 16, // 4:00 PM
  TIMEZONE: 'America/New_York',
} as const;

/**
 * Asset Types
 */
export const ASSET_TYPES = {
  STOCK: 'STOCK',
  ETF: 'ETF',
  BOND: 'BOND',
  CRYPTO: 'CRYPTO',
  OPTION: 'OPTION',
  FUTURE: 'FUTURE',
} as const;

/**
 * Trade Types
 */
export const TRADE_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

/**
 * Order Status
 */
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  OPEN: 'OPEN',
  FILLED: 'FILLED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;

/**
 * Color Palette
 */
export const COLORS = {
  PRIMARY: '#22c55e', // Green
  DESTRUCTIVE: '#ff4444', // Red
  WARNING: '#f59e0b', // Amber
  INFO: '#3b82f6', // Blue
  SUCCESS: '#22c55e', // Green
  BACKGROUND: '#f8f8f8', // Light gray
  FOREGROUND: '#1a1a1a', // Dark gray
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  PIN_MIN_LENGTH: 4,
  PIN_MAX_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  DEMO_MODE: true, // Enable demo mode with mock data
  ENABLE_WEBSOCKET: false, // Disable WebSocket for now
  ENABLE_TRADING: false, // Disable live trading
  ENABLE_NOTIFICATIONS: true, // Enable notifications
  ENABLE_DARK_MODE: true, // Enable dark mode
} as const;

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Cache Configuration
 */
export const CACHE = {
  PORTFOLIO_TTL: 5 * 60 * 1000, // 5 minutes
  PRICES_TTL: 1 * 60 * 1000, // 1 minute
  MARKET_DATA_TTL: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Error Codes
 */
export const ERROR_CODES = {
  AUTHENTICATION_FAILED: 'AUTH_001',
  INVALID_CREDENTIALS: 'AUTH_002',
  SESSION_EXPIRED: 'AUTH_003',
  NETWORK_ERROR: 'NET_001',
  API_ERROR: 'API_001',
  VALIDATION_ERROR: 'VAL_001',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Environment
 */
export const ENVIRONMENT = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  VERSION: '1.0.0',
} as const;
