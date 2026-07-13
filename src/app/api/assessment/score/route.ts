import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildAiReport } from '@/lib/ai-report-builder';
import { readSmesFromCSV, readAssessmentsFromCSV, writeAssessmentsToCSV } from '@/lib/csv-db';
import { getQuestionPillarMap } from '@/lib/question-pool';
import { calculateReadinessScore } from '@/lib/scoring-engine';
import type { AssessmentRecord, OptionKey } from '@/types';

const optionKeySchema = z.enum(['A', 'B', 'C', 'D']);

const scoreRequestSchema = z.object({
  smeId: z.string().min(1),
  answers: z.record(z.string(), optionKeySchema),
  selectedQuestions: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = scoreRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { smeId, answers, selectedQuestions } = parsed.data;
  const questionPillarMap = getQuestionPillarMap();

  const missing = selectedQuestions.filter((id) => !answers[id]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'All selected questions must have answers', missing },
      { status: 400 }
    );
  }

  const scoring = calculateReadinessScore({
    selectedQuestions,
    resolvedAnswers: answers as Record<string, OptionKey>,
    questionPillarMap,
  });

  const smeContext = await resolveSmeContext(smeId);
  const aiReport = buildAiReport({
    smeName: smeContext.name,
    targetCountryName: smeContext.targetCountryName,
    overallScore: scoring.overallScore,
    grade: scoring.grade,
    pillarScores: scoring.pillarScores,
    gaps: scoring.gaps,
  });

  try {
    const assessments = readAssessmentsFromCSV();
    
    // Generate sequential ID
    const seq = assessments.length + 1;
    const sequentialId = `ASM-${String(seq).padStart(6, '0')}`;

    const newAssessment: AssessmentRecord = {
      id: sequentialId,
      smeId,
      overallScore: scoring.overallScore,
      grade: scoring.grade,
      pillarScores: scoring.pillarScores,
      answers: answers as Record<string, OptionKey>,
      selectedQuestions,
      aiReport,
      createdAt: new Date().toISOString(),
    };

    assessments.unshift(newAssessment);
    writeAssessmentsToCSV(assessments);

    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error) {
    console.error('Error saving assessment to CSV:', error);
    return NextResponse.json({ error: 'Failed to score and save assessment' }, { status: 500 });
  }
}

async function resolveSmeContext(smeId: string): Promise<{ name: string; targetCountryName: string }> {
  const fallback = { name: 'Client SME', targetCountryName: 'target market' };

  try {
    const smes = readSmesFromCSV();
    const sme = smes.find((s) => s.id === smeId);
    if (sme) {
      return { name: sme.name, targetCountryName: sme.targetCountryName };
    }
  } catch (error) {
    console.error('Error resolving SME context:', error);
  }

  return fallback;
}
