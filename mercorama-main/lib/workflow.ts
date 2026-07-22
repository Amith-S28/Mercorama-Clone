// lib/workflow.ts
// Cross-tool workflow state — localStorage-backed.
// Enables continuity between Deal Wizard → FTA Diversify → Export Compass.

export interface WorkflowState {
  product?: string;
  category?: string;
  hsCode?: string;
  incoterm?: string;
  selectedProvince?: string;
  selectedCountry?: string;
  selectedMarket?: string;
  ftaMarkets?: string[];
  compassMarkets?: string[];
  source?: 'deal' | 'fta' | 'compass';
  updatedAt?: string;
}

const WORKFLOW_KEY = 'mercorama_workflow';

export function getWorkflow(): WorkflowState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WORKFLOW_KEY);
    return raw ? (JSON.parse(raw) as WorkflowState) : {};
  } catch {
    return {};
  }
}

export function setWorkflow(data: Partial<WorkflowState>): void {
  if (typeof window === 'undefined') return;
  const current = getWorkflow();
  const merged: WorkflowState = { ...current, ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(WORKFLOW_KEY, JSON.stringify(merged));
}

export function clearWorkflow(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WORKFLOW_KEY);
}

// Source labels for the context banner
export const SOURCE_LABELS: Record<string, string> = {
  deal: 'Continuing from Deal Wizard',
  fta: 'Markets selected from FTA analysis',
  compass: 'Building deal from Export Compass',
};
