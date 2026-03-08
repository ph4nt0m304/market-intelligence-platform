import { NextRequest, NextResponse } from 'next/server';
import { 
  initiateLogin, 
  verifyDevicePin, 
  getSession, 
} from '@/lib/trade-republic-api';

/**
 * POST /api/auth/sms
 * Step 1: Initiate login - calls Trade Republic API to send SMS
 * 
 * Body: { phone: string, pin: string }
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

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN Trade Republic requis (4 chiffres)' },
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

    // Call Trade Republic API
    console.log(`[SMS API] Calling initiateLogin for ${cleanPhone}`);
    const result = await initiateLogin(cleanPhone, pin);
    console.log(`[SMS API] Result:`, { 
      hasProcessId: !!result.processId, 
      hasError: !!result.error,
      error: result.error,
      details: result.details,
    });

    if (result.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          details: result.details,
          debug: {
            timestamp: new Date().toISOString(),
            phone: cleanPhone,
            apiHost: 'api.traderepublic.com',
          }
        },
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

    // Verify with Trade Republic
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
    });

  } catch (error) {
    console.error('[SMS API] Session check error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur de verification de session' },
      { status: 500 }
    );
  }
}
