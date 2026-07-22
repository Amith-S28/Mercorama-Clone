import { SavedAnalysis, DashboardData, AnalysisType } from './types';

const STORAGE_KEY = 'traderyt_analyses';
const MAX_ANALYSES = 50; // Keep last 50 analyses

export function getDashboardData(): DashboardData {
  if (typeof window === 'undefined') {
    return { analyses: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { analyses: [] };
    }
    
    const data = JSON.parse(stored) as DashboardData;
    return data;
  } catch (error) {
    console.error('[v0] Failed to parse localStorage data:', error);
    return { analyses: [] };
  }
}

export function saveAnalysis(analysis: SavedAnalysis): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const data = getDashboardData();
    
    // Add new analysis at the beginning
    data.analyses.unshift(analysis);
    
    // Keep only the most recent analyses
    if (data.analyses.length > MAX_ANALYSES) {
      data.analyses = data.analyses.slice(0, MAX_ANALYSES);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[v0] Failed to save analysis to localStorage:', error);
  }
}

export function clearAllAnalyses(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[v0] Failed to clear localStorage:', error);
  }
}

export function getAnalysisByType(type: AnalysisType): SavedAnalysis[] {
  const data = getDashboardData();
  return data.analyses.filter(a => a.type === type);
}

export function getRecentAnalyses(limit: number = 5): SavedAnalysis[] {
  const data = getDashboardData();
  return data.analyses.slice(0, limit);
}

export function getMostUsedIncoterm(): string | null {
  const data = getDashboardData();
  const incotermAnalyses = data.analyses.filter(a => a.type === 'incoterm');
  
  if (incotermAnalyses.length === 0) {
    return null;
  }

  // Count frequency of each Incoterm
  const frequency: Record<string, number> = {};
  incotermAnalyses.forEach(analysis => {
    const incoterm = (analysis.inputs as any).incoterm;
    frequency[incoterm] = (frequency[incoterm] || 0) + 1;
  });

  // Find most common
  let mostUsed = '';
  let maxCount = 0;
  Object.entries(frequency).forEach(([incoterm, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsed = incoterm;
    }
  });

  return mostUsed;
}

export function getMostCommonHSCode(): string | null {
  const data = getDashboardData();
  const hscodeAnalyses = data.analyses.filter(a => a.type === 'hscode');
  
  if (hscodeAnalyses.length === 0) {
    return null;
  }

  // Count frequency of each HS Code
  const frequency: Record<string, number> = {};
  hscodeAnalyses.forEach(analysis => {
    const hsCode = (analysis.results as any).hsCode;
    if (hsCode) {
      frequency[hsCode] = (frequency[hsCode] || 0) + 1;
    }
  });

  // Find most common
  let mostCommon = '';
  let maxCount = 0;
  Object.entries(frequency).forEach(([code, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = code;
    }
  });

  return mostCommon || null;
}
