import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  id: z.string().uuid(),
});

function resolveOrigin(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const host = request.headers.get('host');
  if (host) {
    const protocol = host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}`;
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = parsed.data;
  const origin = resolveOrigin(request);
  const printUrl = `${origin}/sandbox/agency/report/print/${encodeURIComponent(id)}`;

  let puppeteer: typeof import('puppeteer');
  try {
    puppeteer = await import('puppeteer');
  } catch {
    return NextResponse.json(
      {
        error: 'PDF generation unavailable',
        message: 'Puppeteer is not installed or failed to load.',
      },
      { status: 503 }
    );
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 60_000 });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="export-readiness-${id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Puppeteer launch failed';
    return NextResponse.json(
      {
        error: 'PDF generation failed',
        message,
      },
      { status: 503 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
