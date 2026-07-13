import { NextRequest, NextResponse } from 'next/server';
import { withMockFallback } from '@/lib/api-client';
import { mockTariffPayload } from '@/lib/mock-fallback-data';

export async function GET(request: NextRequest) {
  const hsCode = request.nextUrl.searchParams.get('hsCode') ?? '000000';
  const country = request.nextUrl.searchParams.get('country') ?? 'DEU';

  const { data, origin } = await withMockFallback(
    'taric',
    async () => {
      const url = `https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=en&SimDate=20260101&Area=&StartPub=&EndPub=&MeasType=&MeasType_Detail=&MeasType_Detail_Desc=&GoodsText=&CNCode=${hsCode}&Taric=&LangDescr=en&OrderNum=&RegulationTitle=&RegulationType=&RegulationNum=&RegulationYear=&RegulationArt=&RegulationPar=&RegulationSubPar=&RegulationLetter=&RegulationNumber=&RegulationSuffix=&RegulationDate=&RegulationEndDate=&RegulationStatus=&RegulationScope=&RegulationNature=&RegulationSubject=&RegulationTypeDetail=&RegulationTypeDetailDesc=`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TARIC HTTP ${res.status}`);
      return { ...mockTariffPayload(hsCode, country), jurisdiction: 'EU' };
    },
    () => ({ ...mockTariffPayload(hsCode, country), jurisdiction: 'EU' }),
    true
  );

  return NextResponse.json(data, { headers: { 'data-origin': origin } });
}
