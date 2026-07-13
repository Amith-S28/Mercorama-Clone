import { NextRequest, NextResponse } from 'next/server';
import { readAssessmentsFromCSV } from '@/lib/csv-db';

export async function GET(request: NextRequest) {
  const smeId = request.nextUrl.searchParams.get('smeId');

  try {
    const assessments = readAssessmentsFromCSV();
    
    if (smeId) {
      const record = assessments.find((a) => a.smeId === smeId);
      return NextResponse.json(record ?? null);
    }
    
    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments from CSV:', error);
    return NextResponse.json([], { status: 500 });
  }
}
