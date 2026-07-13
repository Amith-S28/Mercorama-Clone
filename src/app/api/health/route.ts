import { NextResponse } from 'next/server';
import { checkApiHealth } from '@/lib/health-check';

export async function GET() {
  const services = await checkApiHealth();
  return NextResponse.json({
    services,
    checkedAt: new Date().toISOString(),
  });
}
