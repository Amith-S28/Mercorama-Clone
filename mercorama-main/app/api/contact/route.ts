import { NextRequest, NextResponse } from 'next/server';

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET) {
    // If secret not configured, skip verification (dev mode)
    console.warn('[mercorama] RECAPTCHA_SECRET_KEY not set — skipping verification');
    return true;
  }
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}`,
    });
    const data = await res.json();
    // v3: require score >= 0.5 (1.0 = very likely human, 0.0 = likely bot)
    if (!data.success) return false;
    if (typeof data.score === 'number') return data.score >= 0.5;
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { name, company, email, phone, inquiryType, message, recaptchaToken } = body as {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    inquiryType?: string;
    message?: string;
    recaptchaToken?: string;
  };

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
  }

  if (!recaptchaToken) {
    return NextResponse.json({ error: 'reCAPTCHA verification required' }, { status: 400 });
  }

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return NextResponse.json({ error: 'reCAPTCHA verification failed. Please try again.' }, { status: 400 });
  }

  // Log the submission (replace with Resend/SendGrid when email service is configured)
  console.log('[mercorama] Contact form submission:', {
    name, company, email, phone, inquiryType, message,
    receivedAt: new Date().toISOString(),
  });

  // TODO: Send email via Resend or similar service
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: 'noreply@mercorama.com', to: 'contact@mercorama.com', ... });

  return NextResponse.json({ success: true });
}
