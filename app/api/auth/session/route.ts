import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/session-manager';

/**
 * GET /api/auth/session
 * Retrieve existing session for phone
 */
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    const session = sessionManager.loadSession(phone);

    if (!session) {
      return NextResponse.json(
        { session: null, message: 'No existing session found' },
        { status: 404 }
      );
    }

    // Don't expose sensitive tokens
    const safeSession = {
      phone: session.phone,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      lastUsed: session.lastUsed,
      metadata: session.metadata,
    };

    return NextResponse.json(
      { session: safeSession, message: 'Session loaded successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Session API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/session
 * Create or update session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, sessionId, accessToken, refreshToken } = body;

    if (!phone || !sessionId) {
      return NextResponse.json(
        { error: 'Phone and sessionId required' },
        { status: 400 }
      );
    }

    const session = sessionManager.createSession(phone, sessionId, {
      accessToken,
      refreshToken,
      metadata: {
        deviceId: request.headers.get('x-device-id') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    const safeSession = {
      phone: session.phone,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };

    return NextResponse.json(
      { session: safeSession, message: 'Session created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Session API] Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Delete session
 */
export async function DELETE(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    sessionManager.deleteSession(phone);

    return NextResponse.json(
      { message: 'Session deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Session API] Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
