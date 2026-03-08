/**
 * Session Manager - Manage Trade Republic sessions
 * Uses in-memory storage for serverless compatibility
 * In production, this should be backed by a database or Redis
 */

export interface TradeRepublicSession {
  phone: string;
  sessionId: string;
  refreshToken?: string;
  accessToken?: string;
  expiresAt: number;
  createdAt: number;
  lastUsed: number;
  metadata?: {
    deviceId?: string;
    platform?: string;
    userAgent?: string;
  };
}

// In-memory session storage (for demo purposes)
// In production, replace with Redis or database storage
const sessions = new Map<string, TradeRepublicSession>();

class SessionManager {
  /**
   * Save session
   */
  saveSession(session: TradeRepublicSession): void {
    sessions.set(session.phone, session);
  }

  /**
   * Load session
   */
  loadSession(phone: string): TradeRepublicSession | null {
    const session = sessions.get(phone);
    
    if (!session) {
      return null;
    }

    // Verify session is not expired
    if (session.expiresAt > Date.now()) {
      session.lastUsed = Date.now();
      return session;
    }

    // Session expired, delete it
    sessions.delete(phone);
    return null;
  }

  /**
   * Delete session
   */
  deleteSession(phone: string): void {
    sessions.delete(phone);
  }

  /**
   * Get all valid sessions
   */
  getValidSessions(): TradeRepublicSession[] {
    const now = Date.now();
    return Array.from(sessions.values()).filter(
      (session) => session.expiresAt > now
    );
  }

  /**
   * Clear expired sessions
   */
  clearExpiredSessions(): void {
    const now = Date.now();
    Array.from(sessions.keys()).forEach((phone) => {
      const session = sessions.get(phone)!;
      if (session.expiresAt <= now) {
        sessions.delete(phone);
      }
    });
  }

  /**
   * Update session token
   */
  updateSessionToken(phone: string, accessToken: string, refreshToken?: string): void {
    const session = sessions.get(phone);
    if (!session) {
      throw new Error(`Session not found for phone: ${phone}`);
    }

    session.accessToken = accessToken;
    if (refreshToken) {
      session.refreshToken = refreshToken;
    }
    session.lastUsed = Date.now();
    session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    this.saveSession(session);
  }

  /**
   * Create new session
   */
  createSession(phone: string, sessionId: string, options?: Partial<TradeRepublicSession>): TradeRepublicSession {
    const now = Date.now();
    const session: TradeRepublicSession = {
      phone,
      sessionId,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
      createdAt: now,
      lastUsed: now,
      ...options,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Check if session exists
   */
  hasSession(phone: string): boolean {
    return sessions.has(phone);
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

/**
 * Get or create session for phone
 */
export async function getOrCreateSession(
  phone: string,
  createFn?: () => Promise<TradeRepublicSession>
): Promise<TradeRepublicSession | null> {
  let session = sessionManager.loadSession(phone);

  if (!session && createFn) {
    session = await createFn();
    sessionManager.saveSession(session);
  }

  return session || null;
}
