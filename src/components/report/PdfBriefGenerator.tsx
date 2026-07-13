'use client';

import { useState } from 'react';

interface PdfBriefGeneratorProps {
  assessmentId: string;
  label?: string;
  className?: string;
}

export function PdfBriefGenerator({
  assessmentId,
  label = 'Download PDF Brief',
  className,
}: PdfBriefGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assessmentId }),
      });

      if (!response.ok) {
        let message = `PDF request failed (${response.status})`;
        try {
          const payload = (await response.json()) as { message?: string; error?: string };
          message = payload.message ?? payload.error ?? message;
        } catch {
          // keep default message
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `export-readiness-${assessmentId.slice(0, 8)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading || !assessmentId}
        style={{
          padding: '0.625rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Generating PDF…' : label}
      </button>
      {error ? (
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--status-down)' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
