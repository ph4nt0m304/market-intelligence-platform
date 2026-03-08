import { NextRequest, NextResponse } from 'next/server';

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

/**
 * POST /api/auth/sms
 * Request SMS verification code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Numero de telephone requis' },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Format de numero invalide. Utilisez le format international (+49...)' },
        { status: 400 }
      );
    }

    // Check for rate limiting (max 3 requests per 5 minutes)
    const existing = verificationCodes.get(cleanPhone);
    if (existing && existing.attempts >= 3 && existing.expiresAt > Date.now()) {
      const remainingTime = Math.ceil((existing.expiresAt - Date.now()) / 60000);
      return NextResponse.json(
        { success: false, error: `Trop de tentatives. Reessayez dans ${remainingTime} minute(s).` },
        { status: 429 }
      );
    }

    // In production, this would call the Trade Republic API to send SMS
    // For demo purposes, we'll generate a verification code
    // 
    // Real Trade Republic API call would look like:
    // const response = await fetch(`${TR_API_URL}/api/v1/auth/web/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ phoneNumber: cleanPhone, pin: '****' })
    // });

    // Generate a 4-digit code for demo
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store the code with 5 minute expiry
    verificationCodes.set(cleanPhone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: (existing?.attempts || 0) + 1,
    });

    console.log(`[SMS API] Code de verification pour ${cleanPhone}: ${code}`);

    // In production, integrate with SMS provider (Twilio, etc.) or Trade Republic API
    // For now, we'll return success and log the code

    return NextResponse.json({
      success: true,
      message: 'SMS envoye avec succes',
      // Only include code in development for testing
      ...(process.env.NODE_ENV === 'development' && { debugCode: code }),
    });

  } catch (error) {
    console.error('[SMS API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'envoi du SMS. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/sms
 * Verify SMS code
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
    const stored = verificationCodes.get(cleanPhone);

    if (!stored) {
      return NextResponse.json(
        { success: false, error: 'Aucun code envoye pour ce numero. Demandez un nouveau code.' },
        { status: 404 }
      );
    }

    if (stored.expiresAt < Date.now()) {
      verificationCodes.delete(cleanPhone);
      return NextResponse.json(
        { success: false, error: 'Code expire. Demandez un nouveau code.' },
        { status: 410 }
      );
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { success: false, error: 'Code incorrect. Verifiez et reessayez.' },
        { status: 401 }
      );
    }

    // Code is valid - delete it to prevent reuse
    verificationCodes.delete(cleanPhone);

    return NextResponse.json({
      success: true,
      message: 'Code verifie avec succes',
    });

  } catch (error) {
    console.error('[SMS API] Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la verification. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}
