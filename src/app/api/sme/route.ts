import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { getAdvisorId } from '@/lib/auth';
import { readSmesFromCSV, writeSmesToCSV } from '@/lib/csv-db';
import type { SmeRecord } from '@/types';

const industrySchema = z.enum([
  'Food, Beverage & CPG',
  'Seafood & Ocean Economy',
  'Advanced Manufacturing & Industrial',
  'Defence, Dual-Use & Critical Supply Chains',
  'Other / Unsure',
]);

const createSmeSchema = z.object({
  name: z.string().min(2),
  province: z.string().min(1),
  industry: industrySchema,
  productDescription: z.string().min(5),
  hsCode: z.string().min(4),
  exportQuantity: z.number().int().positive(),
  productionCost: z.number().positive(),
  unitPrice: z.number().positive(),
  targetProfitMargin: z.number().min(0).max(100),
  contactEmail: z.string().email().nullable().optional(),
  primaryContact: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  hasLocalAgent: z.boolean().optional(),
  employeeRange: z.string().nullable().optional(),
  revenueRange: z.string().nullable().optional(),
  targetCountry: z.string().length(3),
  targetCountryName: z.string().min(1),
});

export async function GET() {
  const advisorId = await getAdvisorId();
  try {
    const smes = readSmesFromCSV();
    // Filter by advisorId
    const filtered = smes.filter((sme) => sme.advisorId === advisorId);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching SMEs from CSV:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createSmeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  try {
    const smes = readSmesFromCSV();
    
    // Generate sequential ID
    const seq = smes.length + 1;
    const sequentialId = `SME-${String(seq).padStart(6, '0')}`;

    const newSme: SmeRecord = {
      id: sequentialId,
      advisorId: env.MOCK_ADVISOR_ID,
      name: input.name,
      province: input.province,
      industry: input.industry,
      productDescription: input.productDescription,
      hsCode: input.hsCode,
      exportQuantity: input.exportQuantity,
      productionCost: input.productionCost,
      unitPrice: input.unitPrice,
      targetProfitMargin: input.targetProfitMargin,
      contactEmail: input.contactEmail ?? null,
      primaryContact: input.primaryContact ?? null,
      website: input.website ?? null,
      hasLocalAgent: input.hasLocalAgent ?? false,
      employeeRange: input.employeeRange ?? null,
      revenueRange: input.revenueRange ?? null,
      targetCountry: input.targetCountry,
      targetCountryName: input.targetCountryName,
      createdAt: new Date().toISOString(),
    };

    smes.unshift(newSme); // Prepend new SME
    writeSmesToCSV(smes);

    return NextResponse.json(newSme, { status: 201 });
  } catch (error) {
    console.error('Error saving SME to CSV:', error);
    return NextResponse.json({ error: 'Failed to save SME' }, { status: 500 });
  }
}
