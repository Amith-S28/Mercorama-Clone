import { NextResponse } from 'next/server';
import { callLocalSLM } from '@/lib/claude';

interface IncotermRecommendRequest {
  portOfLoading: string;
  portOfDischarge: string;
  originCountry: string;
  destinationCountry: string;
  cargoType: string;
  cargoValue: number;
  mode: 'sea' | 'air' | 'road' | 'rail';
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IncotermRecommendRequest;

    const recommendation = recommendIncoterms(body);

    // Enrich the primary recommendation summary via local SLM (Ollama)
    try {
      const slmPrompt =
        `You are a trade finance expert. In 2 sentences, explain why ${recommendation.primaryIncoterm.code} ` +
        `(${recommendation.primaryIncoterm.label}) is the best Incoterm for shipping ` +
        `${body.cargoType} worth USD ${body.cargoValue.toLocaleString()} ` +
        `from ${body.portOfLoading} to ${body.portOfDischarge}. Be concise and practical.`;

      const slmSummary = await callLocalSLM(slmPrompt);
      if (slmSummary) {
        recommendation.primaryIncoterm.summary = slmSummary;
      }
    } catch (slmErr) {
      // SLM enrichment is best-effort — fall back to rule-based summary silently
      console.warn('[mercorama] SLM enrichment skipped:', slmErr);
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Incoterm recommend error', error);
    return NextResponse.json(
      { error: 'Failed to recommend Incoterms' },
      { status: 400 },
    );
  }
}

function recommendIncoterms(ctx: IncotermRecommendRequest) {
  const cargoType = ctx.cargoType.toLowerCase();
  const value = ctx.cargoValue ?? 0;

  if (value >= 50000) {
    return {
      primaryIncoterm: {
        code: 'CIP',
        label: 'CIP – Carriage and Insurance Paid To',
        confidence: 'high',
        summary:
          'High-value cargo where the seller arranges freight and insurance up to the named place.',
        reasons: [
          'Seller provides carriage and insurance, reducing risk for the buyer.',
          'Incoterms 2020 requires broader insurance cover under CIP.',
          'Export clearance remains with the seller at origin.',
        ],
      },
      secondaryIncoterm: {
        code: 'FCA',
        label: 'FCA – Free Carrier',
        confidence: 'medium',
        summary:
          'Alternative when the buyer prefers to control main carriage while the seller handles export clearance.',
        reasons: [
          'Works well when the buyer has strong carrier relationships.',
          'Seller still handles export formalities at origin.',
        ],
      },
      notes: [
        'Consider CIP when the buyer wants more protection on high-value cargo.',
      ],
    };
  }

  if (
    cargoType.includes('bulk') ||
    cargoType.includes('grain') ||
    cargoType.includes('ore')
  ) {
    return {
      primaryIncoterm: {
        code: 'FOB',
        label: 'FOB – Free On Board',
        confidence: 'medium',
        summary:
          'Common for bulk commodities loaded directly on the vessel at the port of shipment.',
        reasons: [
          'Risk transfers when the goods are on board at the loading port.',
          'Buyer controls the main ocean carriage.',
        ],
      },
      secondaryIncoterm: {
        code: 'CFR',
        label: 'CFR – Cost and Freight',
        confidence: 'medium',
        summary:
          'Seller also arranges and pays for main ocean freight, risk still transfers at loading port.',
        reasons: ['Useful when the seller has better freight rates.'],
      },
      notes: [
        'For containerized bulk, FCA or CIP may still be more appropriate than FOB.',
      ],
    };
  }

  return {
    primaryIncoterm: {
      code: 'FCA',
      label: 'FCA – Free Carrier',
      confidence: 'high',
      summary:
        'Typical choice for containerized cargo handed over to the carrier before loading on the vessel.',
      reasons: [
        'Better than FOB for containers delivered to a terminal or forwarder.',
        'Seller handles export clearance at origin.',
        'Buyer controls main carriage from the loading port.',
      ],
    },
    secondaryIncoterm: {
      code: 'CIP',
      label: 'CIP – Carriage and Insurance Paid To',
      confidence: 'medium',
      summary:
        'Seller arranges freight and insurance to the named destination, buyer handles import.',
      reasons: [
        'Reduces logistics complexity for the buyer.',
        'Helpful for medium-value or sensitive cargo.',
      ],
    },
    notes: ['FOB is traditionally for non-container bulk cargo loaded on board.'],
  };
}
