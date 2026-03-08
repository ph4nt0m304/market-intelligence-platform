import { NextRequest, NextResponse } from 'next/server';
import { 
  initiateLogin, 
  verifyDevicePin, 
  getSession, 
  storeSession,
  type TRSession 
} from '@/lib/trade-republic-api';

// Fallback demo mode for testing without Trade Republic
const DEMO_MODE = process.env.TR_DEMO_MODE === 'true';
const demoVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

/**
 * POST /api/auth/sms
 * Step 1: Initiate login - calls Trade Republic API to send SMS
 * 
 * Body: { phone: string, pin: string }
 * 
 * In DEMO_MODE (TR_DEMO_MODE=true), generates a fake code instead
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, pin } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Numero de telephone requis' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Format de numero invalide. Utilisez le format international (+49...)' },
        { status: 400 }
      );
    }

    // Demo mode - generate fake code
    if (DEMO_MODE) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      demoVerificationCodes.set(cleanPhone, {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      console.log(`[DEMO MODE] Code for ${cleanPhone}: ${code}`);
      
      return NextResponse.json({
        success: true,
        message: 'SMS envoye (mode demo)',
        demoMode: true,
        debugCode: code, // Only in demo mode
      });
    }

    // Production mode - call Trade Republic API
    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN Trade Republic requis' },
        { status: 400 }
      );
    }

    const result = await initiateLogin(cleanPhone, pin);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SMS envoye par Trade Republic',
      processId: result.processId,
      countdownInSeconds: result.countdownInSeconds || 60,
    });

  } catch (error) {
    console.error('[SMS API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'envoi du SMS' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/sms
 * Step 2: Verify the device PIN received by SMS
 * 
 * Body: { phone: string, code: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: 'Numero et code requis' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\s/g, '');

    // Demo mode verification
    if (DEMO_MODE) {
      const stored = demoVerificationCodes.get(cleanPhone);
      
      if (!stored) {
        return NextResponse.json(
          { success: false, error: 'Aucun code envoye pour ce numero' },
          { status: 404 }
        );
      }

      if (stored.expiresAt < Date.now()) {
        demoVerificationCodes.delete(cleanPhone);
        return NextResponse.json(
          { success: false, error: 'Code expire' },
          { status: 410 }
        );
      }

      if (stored.code !== code) {
        return NextResponse.json(
          { success: false, error: 'Code incorrect' },
          { status: 401 }
        );
      }

      demoVerificationCodes.delete(cleanPhone);
      
      // Create a demo session
      const demoSession: TRSession = {
        phoneNumber: cleanPhone,
        trSessionToken: `demo_session_${Date.now()}`,
        rawCookies: [],
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      
      storeSession(demoSession);

      return NextResponse.json({
        success: true,
        message: 'Connexion reussie (mode demo)',
        demoMode: true,
      });
    }

    // Production mode - verify with Trade Republic
    const result = await verifyDevicePin(cleanPhone, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion Trade Republic reussie',
      session: {
        phoneNumber: result.session?.phoneNumber,
        expiresAt: result.session?.expiresAt,
      },
    });

  } catch (error) {
    console.error('[SMS API] Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur de verification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/sms
 * Check if there's a valid session for the phone number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Numero requis' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const session = getSession(cleanPhone);

    if (!session) {
      return NextResponse.json({
        success: false,
        hasSession: false,
      });
    }

    return NextResponse.json({
      success: true,
      hasSession: true,
      expiresAt: session.expiresAt,
      demoMode: DEMO_MODE,
    });

  } catch (error) {
    console.error('[SMS API] Session check error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur de verification de session' },
      { status: 500 }
    );
  }
}
