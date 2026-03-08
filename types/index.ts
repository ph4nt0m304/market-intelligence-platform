// Global type definitions for Market Intelligence Platform

// Re-export Binance types for convenience
export type { MarketSnapshot, MarketPair, BinancePrice } from '@/lib/binance-service';

/**
 * Application configuration
 */
export interface AppConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  refreshInterval: number;
  timeZone: string;
}

/**
 * User session information
 */
export interface UserSession {
  phoneNumber: string;
  timestamp: string;
  sessionToken?: string;
  isAuthenticated: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Navigation item for menus
 */
export interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

/**
 * Notification type
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
}

/**
 * Theme configuration
 */
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  autoDetect: boolean;
}

/**
 * Table column definition
 */
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  key: string;
  value: any;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

/**
 * Sort configuration
 */
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * Error details
 */
export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Loading state for async operations
 */
export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: ErrorDetails;
  progress?: number;
}

/**
 * Form field error
 */
export interface FieldError {
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'custom';
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: FieldError[];
}

