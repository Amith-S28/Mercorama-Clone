'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import type { AssessmentRecord, OptionKey } from '@/types';
import {
  getQuestionPillarMap,
  getQuestionsByIds,
  selectAssessmentQuestions,
} from '@/lib/question-pool';
import {
  buildPillarCompletion,
} from '@/lib/scoring-engine';
import { QuestionCard } from '@/components/questionnaire/QuestionCard';
import { PillarProgressBar } from '@/components/questionnaire/PillarProgressBar';
import { cn } from '@/lib/cn';
import { buttonSpring, snappy } from '@/lib/animation/presets';

export interface QuestionnaireWizardProps {
  smeId: string;
  seed?: number;
  onComplete: (assessment: AssessmentRecord) => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

export function QuestionnaireWizard({ smeId, seed, onComplete }: QuestionnaireWizardProps) {
  const selectedQuestionIds = useMemo(() => selectAssessmentQuestions(seed), [seed]);
  const questions = useMemo(
    () => getQuestionsByIds(selectedQuestionIds),
    [selectedQuestionIds]
  );
  const pillarMap = useMemo(() => getQuestionPillarMap(), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex >= questions.length - 1;
  const currentAnswered = Boolean(currentQuestion && answers[currentQuestion.id]);

  const pillarCompletion = useMemo(
    () => buildPillarCompletion(selectedQuestionIds, answers, pillarMap),
    [selectedQuestionIds, answers, pillarMap]
  );

  const handleSelect = useCallback((key: OptionKey) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: key }));
  }, [currentQuestion]);

  const goNext = () => {
    if (!currentAnswered || isLast) return;
    setDirection(1);
    setCurrentIndex((i) => i + 1);
  };

  const goBack = () => {
    if (currentIndex <= 0) return;
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    if (!currentAnswered) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/assessment/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smeId,
          answers,
          selectedQuestions: selectedQuestionIds,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to submit assessment');
      }
      const assessment = (await res.json()) as AssessmentRecord;
      onComplete(assessment);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No assessment questions available.</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="rounded-[var(--radius-card)] border border-[var(--border-low-contrast)] bg-[var(--bg-secondary)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
              Export readiness diagnostic
            </p>
            <p className="mt-1 font-mono text-sm text-[var(--text-secondary)]">
              {currentIndex + 1} / {questions.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Live Score Preview</p>
            <p className="font-mono text-2xl font-semibold text-[var(--text-tertiary)]">
              —
            </p>
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Hidden during assessment
            </p>
          </div>
        </div>
        <div className="mt-4">
          <PillarProgressBar completion={pillarCompletion} />
        </div>
      </header>

      <div className="relative min-h-[320px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] p-5">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={snappy}
          >
            <QuestionCard
              question={currentQuestion}
              selected={answers[currentQuestion.id]}
              onSelect={handleSelect}
              disabled={submitting}
              index={currentIndex}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {submitError && (
        <p className="text-sm text-[var(--accent-danger)]" role="alert">
          {submitError}
        </p>
      )}

      <footer className="flex items-center justify-between gap-3">
        <motion.button
          type="button"
          onClick={goBack}
          disabled={currentIndex === 0 || submitting}
          className="inline-flex items-center gap-2 rounded-[var(--radius-card)] px-3 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-40"
          {...buttonSpring}
        >
          <ArrowLeft size={16} />
          Previous
        </motion.button>

        {!isLast ? (
          <motion.button
            type="button"
            onClick={goNext}
            disabled={!currentAnswered || submitting}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-[var(--accent-premium)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-primary)] disabled:opacity-40'
            )}
            {...buttonSpring}
          >
            Next
            <ArrowRight size={16} />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!currentAnswered || submitting}
            className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-[var(--accent-success)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-primary)] disabled:opacity-40"
            {...buttonSpring}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Submit assessment
          </motion.button>
        )}
      </footer>
    </div>
  );
}
