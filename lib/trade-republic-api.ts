/**
 * Trade Republic API Client
 * Based on NightOwl07/trade-republic-api
 * 
 * Handles authentication flow:
 * 1. POST /api/v1/auth/web/login with phone + PIN -> returns processId
 * 2. User receives SMS with device PIN
 * 3. POST /api/v1/auth/web/login/{processId}/{devicePin} -> returns session cookies
 */

import { WebSocket } from 'ws';

// Constants
const TR_API_HOST = 'https://api.traderepublic.com';
const TR_WS_HOST = 'wss://api.traderepublic.com';
const WS_CONNECT_VERSION = '31';
const HTTP_TIMEOUT_MS = 15000;
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Types
export interface TRSession {
  phoneNumber: string;
  trSessionToken: string;
  trRefreshToken?: string;
  rawCookies: string[];
  createdAt: number;
  expiresAt: number;
}

export interface TRLoginInitResponse {
  processId?: string;
  countdownInSeconds?: number;
  error?: string;
}

export interface TRLoginVerifyResponse {
  success: boolean;
  session?: TRSession;
  error?: string;
}

export interface TRSubscription {
  id: number;
  type: string;
  callback: (data: unknown) => void;
}

// In-memory session store (use Redis/DB in production)
const sessionStore = new Map<string, TRSession>();
const pendingLogins = new Map<string, { processId: string; phoneNumber: string; pin: string; expiresAt: number }>();

/**
 * Extract cookie value from raw cookie strings
 */
function extractCookieValue(cookies: string[], name: string): string | undefined {
  const joined = cookies.join('; ');
  const match = joined.match(new RegExp(`(?:^|;)\\s*${name}=([^;]+)`));
  return match?.[1];
}

/**
 * Make HTTP request to Trade Republic API
 */
async function trRequest(
  path: string,
  payload?: Record<string, unknown>,
  method: string = 'POST',
  cookies?: string[]
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  if (cookies && cookies.length > 0) {
    headers['Cookie'] = cookies.map((c) => c.split(';')[0]).join('; ');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(`${TR_API_HOST}${path}`, {
      method,
      headers,
      body: method !== 'GET' && payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Step 1: Initiate login - sends SMS to phone
 * Returns processId needed for step 2
 */
export async function initiateLogin(phoneNumber: string, pin: string): Promise<TRLoginInitResponse> {
  console.log(`[TR API] Initiating login for ${phoneNumber}`);

  try {
    const response = await trRequest('/api/v1/auth/web/login', {
      phoneNumber,
      pin,
    });

    const data = await response.json();
    console.log(`[TR API] Login init response:`, { status: response.status, hasProcessId: !!data.processId });

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        return { error: 'PIN incorrect. Verifiez votre PIN Trade Republic.' };
      }
      if (response.status === 429) {
        return { error: 'Trop de tentatives. Attendez quelques minutes.' };
      }
      return { error: data.message || data.error || `Erreur ${response.status}` };
    }

    if (!data.processId) {
      return { error: 'Reponse invalide de Trade Republic (pas de processId)' };
    }

    // Store pending login for verification step
    pendingLogins.set(phoneNumber, {
      processId: data.processId,
      phoneNumber,
      pin,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return {
      processId: data.processId,
      countdownInSeconds: data.countdownInSeconds || 60,
    };
  } catch (error) {
    console.error('[TR API] Login init error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: 'Timeout - Trade Republic ne repond pas' };
    }
    return { error: 'Impossible de contacter Trade Republic' };
  }
}

/**
 * Step 2: Verify device PIN (from SMS) and get session
 */
export async function verifyDevicePin(phoneNumber: string, devicePin: string): Promise<TRLoginVerifyResponse> {
  console.log(`[TR API] Verifying device PIN for ${phoneNumber}`);

  const pending = pendingLogins.get(phoneNumber);
  if (!pending) {
    return { success: false, error: 'Aucune connexion en cours. Recommencez depuis le debut.' };
  }

  if (pending.expiresAt < Date.now()) {
    pendingLogins.delete(phoneNumber);
    return { success: false, error: 'Code expire. Recommencez la connexion.' };
  }

  try {
    const response = await trRequest(
      `/api/v1/auth/web/login/${pending.processId}/${devicePin}`,
      undefined,
      'POST'
    );

    console.log(`[TR API] Verify response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Code SMS incorrect' };
      }
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.message || `Erreur ${response.status}` };
    }

    // Extract cookies from response
    const rawCookies: string[] = [];
    const setCookieHeader = response.headers.get('set-cookie');
    
    if (setCookieHeader) {
      // Parse multiple cookies (they might be comma-separated or in multiple headers)
      rawCookies.push(...setCookieHeader.split(/,(?=\s*[A-Za-z0-9_-]+=)/g));
    }

    // Also try getSetCookie if available (Node.js 18+)
    const headersAny = response.headers as { getSetCookie?: () => string[] };
    if (typeof headersAny.getSetCookie === 'function') {
      const cookies = headersAny.getSetCookie();
      if (cookies.length > 0) {
        rawCookies.length = 0;
        rawCookies.push(...cookies);
      }
    }

    console.log(`[TR API] Received ${rawCookies.length} cookies`);

    const trSessionToken = extractCookieValue(rawCookies, 'tr_session');
    const trRefreshToken = extractCookieValue(rawCookies, 'tr_refresh');

    if (!trSessionToken) {
      console.error('[TR API] No tr_session cookie found');
      return { success: false, error: 'Session non recue de Trade Republic' };
    }

    // Create session object
    const session: TRSession = {
      phoneNumber,
      trSessionToken,
      trRefreshToken,
      rawCookies,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
    };

    // Store session
    sessionStore.set(phoneNumber, session);
    pendingLogins.delete(phoneNumber);

    console.log(`[TR API] Session created for ${phoneNumber}`);

    return { success: true, session };
  } catch (error) {
    console.error('[TR API] Verify error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Timeout - Trade Republic ne repond pas' };
    }
    return { success: false, error: 'Erreur de verification' };
  }
}

/**
 * Get stored session for a phone number
 */
export function getSession(phoneNumber: string): TRSession | null {
  const session = sessionStore.get(phoneNumber);
  if (!session) return null;

  // Check if expired
  if (session.expiresAt < Date.now()) {
    sessionStore.delete(phoneNumber);
    return null;
  }

  return session;
}

/**
 * Validate session is still active with Trade Republic
 */
export async function validateSession(session: TRSession): Promise<boolean> {
  try {
    const response = await trRequest(
      '/api/v1/auth/web/session',
      undefined,
      'GET',
      session.rawCookies
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clear session (logout)
 */
export function clearSession(phoneNumber: string): void {
  sessionStore.delete(phoneNumber);
  pendingLogins.delete(phoneNumber);
}

/**
 * Store session (for restoring from client)
 */
export function storeSession(session: TRSession): void {
  sessionStore.set(session.phoneNumber, session);
}

/**
 * Create WebSocket connection to Trade Republic
 */
export function createWebSocketConnection(session: TRSession): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(TR_WS_HOST);

    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('WebSocket connection timeout'));
    }, 10000);

    ws.on('open', () => {
      clearTimeout(timeout);
      console.log('[TR WS] Connected');

      // Send connect message
      const connectMessage = JSON.stringify({ locale: 'en' });
      ws.send(`connect ${WS_CONNECT_VERSION} ${connectMessage}`);

      resolve(ws);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error('[TR WS] Error:', error);
      reject(error);
    });
  });
}

/**
 * Subscribe to a topic on the WebSocket
 */
export function subscribe(
  ws: WebSocket,
  session: TRSession,
  subscriptionId: number,
  message: { type: string; [key: string]: unknown }
): void {
  const payload = {
    token: session.trSessionToken,
    ...message,
  };
  ws.send(`sub ${subscriptionId} ${JSON.stringify(payload)}`);
}

/**
 * Unsubscribe from a topic
 */
export function unsubscribe(ws: WebSocket, subscriptionId: number): void {
  ws.send(`unsub ${subscriptionId}`);
}

/**
 * Create a message for subscription
 */
export function createMessage<T extends string>(
  type: T,
  data?: Record<string, unknown>
): { type: T; [key: string]: unknown } {
  return { type, ...data };
}

// Message types available
export const MessageTypes = {
  TICKER: 'ticker',
  PORTFOLIO: 'compactPortfolioByType',
  ORDERS: 'orders',
  CASH: 'cash',
  AVAILABLE_CASH: 'availableCash',
  WATCHLISTS: 'watchlists',
  INSTRUMENT: 'instrument',
  NEON_SEARCH: 'neonSearch',
  AGGREGATE_HISTORY: 'aggregateHistoryLight',
  TIMELINE: 'timelineTransactions',
} as const;
