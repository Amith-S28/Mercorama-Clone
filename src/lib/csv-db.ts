import fs from 'fs';
import path from 'path';
import type { SmeRecord, AssessmentRecord, AdvisorNote, RoadmapItem, IndustrySector, ReadinessGrade, RoadmapBucket } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const SMES_CSV = path.join(DATA_DIR, 'smes.csv');
const ASSESSMENTS_CSV = path.join(DATA_DIR, 'assessments.csv');
const ROADMAP_CSV = path.join(DATA_DIR, 'roadmap.csv');
const NOTES_CSV = path.join(DATA_DIR, 'advisor_notes.csv');

// Standard RFC 4180 CSV Parser
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Standard RFC 4180 CSV Formatter
export function formatCSVLine(fields: string[]): string {
  return fields
    .map((field) => {
      const val = field === null || field === undefined ? '' : String(field);
      const escaped = val.replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    })
    .join(',');
}

// Ensure database files exist
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize SMES CSV
  if (!fs.existsSync(SMES_CSV)) {
    const headers = [
      'id', 'advisorId', 'name', 'province', 'industry', 'productDescription',
      'hsCode', 'exportQuantity', 'productionCost', 'unitPrice', 'targetProfitMargin',
      'contactEmail', 'primaryContact', 'website', 'hasLocalAgent', 'employeeRange',
      'revenueRange', 'targetCountry', 'targetCountryName', 'createdAt'
    ];
    fs.writeFileSync(SMES_CSV, formatCSVLine(headers) + '\n', 'utf-8');
  }

  // Initialize ASSESSMENTS CSV
  if (!fs.existsSync(ASSESSMENTS_CSV)) {
    const headers = [
      'id', 'smeId', 'overallScore', 'grade', 'pillarScores', 'answers',
      'selectedQuestions', 'aiReport', 'createdAt'
    ];
    fs.writeFileSync(ASSESSMENTS_CSV, formatCSVLine(headers) + '\n', 'utf-8');
  }

  // Initialize ROADMAP CSV
  if (!fs.existsSync(ROADMAP_CSV)) {
    const headers = [
      'id', 'assessmentId', 'advisorId', 'task', 'bucket', 'sortOrder', 'completed', 'createdAt'
    ];
    fs.writeFileSync(ROADMAP_CSV, formatCSVLine(headers) + '\n', 'utf-8');
  }

  // Initialize NOTES CSV
  if (!fs.existsSync(NOTES_CSV)) {
    const headers = [
      'id', 'assessmentId', 'advisorId', 'pillar', 'content', 'updatedAt'
    ];
    fs.writeFileSync(NOTES_CSV, formatCSVLine(headers) + '\n', 'utf-8');
  }
}

// SMES Read/Write
export function readSmesFromCSV(): SmeRecord[] {
  initDB();
  try {
    const content = fs.readFileSync(SMES_CSV, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const records: SmeRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 20) continue;
      records.push({
        id: fields[0],
        advisorId: fields[1],
        name: fields[2],
        province: fields[3],
        industry: fields[4] as IndustrySector,
        productDescription: fields[5],
        hsCode: fields[6],
        exportQuantity: Number(fields[7]),
        productionCost: Number(fields[8]),
        unitPrice: Number(fields[9]),
        targetProfitMargin: Number(fields[10]),
        contactEmail: fields[11] || null,
        primaryContact: fields[12] || null,
        website: fields[13] || null,
        hasLocalAgent: fields[14] === 'true',
        employeeRange: fields[15] || null,
        revenueRange: fields[16] || null,
        targetCountry: fields[17],
        targetCountryName: fields[18],
        createdAt: fields[19]
      });
    }
    return records;
  } catch (error) {
    console.error('Error reading SMES CSV:', error);
    return [];
  }
}

export function writeSmesToCSV(records: SmeRecord[]): void {
  initDB();
  try {
    const headers = [
      'id', 'advisorId', 'name', 'province', 'industry', 'productDescription',
      'hsCode', 'exportQuantity', 'productionCost', 'unitPrice', 'targetProfitMargin',
      'contactEmail', 'primaryContact', 'website', 'hasLocalAgent', 'employeeRange',
      'revenueRange', 'targetCountry', 'targetCountryName', 'createdAt'
    ];
    let content = formatCSVLine(headers) + '\n';
    for (const record of records) {
      const row = [
        record.id,
        record.advisorId,
        record.name,
        record.province,
        record.industry,
        record.productDescription,
        record.hsCode,
        String(record.exportQuantity),
        String(record.productionCost),
        String(record.unitPrice),
        String(record.targetProfitMargin),
        record.contactEmail ?? '',
        record.primaryContact ?? '',
        record.website ?? '',
        String(record.hasLocalAgent),
        record.employeeRange ?? '',
        record.revenueRange ?? '',
        record.targetCountry,
        record.targetCountryName,
        record.createdAt
      ];
      content += formatCSVLine(row) + '\n';
    }
    fs.writeFileSync(SMES_CSV, content, 'utf-8');
  } catch (error) {
    console.error('Error writing SMES CSV:', error);
  }
}

// ASSESSMENTS Read/Write
export function readAssessmentsFromCSV(): AssessmentRecord[] {
  initDB();
  try {
    const content = fs.readFileSync(ASSESSMENTS_CSV, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const records: AssessmentRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 9) continue;
      records.push({
        id: fields[0],
        smeId: fields[1],
        overallScore: Number(fields[2]),
        grade: fields[3] as ReadinessGrade,
        pillarScores: JSON.parse(fields[4] || '{}'),
        answers: JSON.parse(fields[5] || '{}'),
        selectedQuestions: JSON.parse(fields[6] || '[]'),
        aiReport: fields[7] ? JSON.parse(fields[7]) : null,
        createdAt: fields[8]
      });
    }
    return records;
  } catch (error) {
    console.error('Error reading Assessments CSV:', error);
    return [];
  }
}

export function writeAssessmentsToCSV(records: AssessmentRecord[]): void {
  initDB();
  try {
    const headers = [
      'id', 'smeId', 'overallScore', 'grade', 'pillarScores', 'answers',
      'selectedQuestions', 'aiReport', 'createdAt'
    ];
    let content = formatCSVLine(headers) + '\n';
    for (const record of records) {
      const row = [
        record.id,
        record.smeId,
        String(record.overallScore),
        record.grade,
        JSON.stringify(record.pillarScores),
        JSON.stringify(record.answers),
        JSON.stringify(record.selectedQuestions),
        record.aiReport ? JSON.stringify(record.aiReport) : '',
        record.createdAt
      ];
      content += formatCSVLine(row) + '\n';
    }
    fs.writeFileSync(ASSESSMENTS_CSV, content, 'utf-8');
  } catch (error) {
    console.error('Error writing Assessments CSV:', error);
  }
}

// ROADMAP Read/Write
export function readRoadmapFromCSV(): RoadmapItem[] {
  initDB();
  try {
    const content = fs.readFileSync(ROADMAP_CSV, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const records: RoadmapItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 8) continue;
      records.push({
        id: fields[0],
        assessmentId: fields[1],
        advisorId: fields[2],
        task: fields[3],
        bucket: fields[4] as RoadmapBucket,
        sortOrder: Number(fields[5]),
        completed: fields[6] === 'true',
        createdAt: fields[7]
      });
    }
    return records;
  } catch (error) {
    console.error('Error reading Roadmap CSV:', error);
    return [];
  }
}

export function writeRoadmapToCSV(records: RoadmapItem[]): void {
  initDB();
  try {
    const headers = ['id', 'assessmentId', 'advisorId', 'task', 'bucket', 'sortOrder', 'completed', 'createdAt'];
    let content = formatCSVLine(headers) + '\n';
    for (const record of records) {
      const row = [
        record.id,
        record.assessmentId,
        record.advisorId,
        record.task,
        record.bucket,
        String(record.sortOrder),
        String(record.completed),
        record.createdAt
      ];
      content += formatCSVLine(row) + '\n';
    }
    fs.writeFileSync(ROADMAP_CSV, content, 'utf-8');
  } catch (error) {
    console.error('Error writing Roadmap CSV:', error);
  }
}

// ADVISOR NOTES Read/Write
export function readNotesFromCSV(): AdvisorNote[] {
  initDB();
  try {
    const content = fs.readFileSync(NOTES_CSV, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const records: AdvisorNote[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 6) continue;
      records.push({
        id: fields[0],
        assessmentId: fields[1],
        advisorId: fields[2],
        pillar: fields[3],
        content: fields[4],
        updatedAt: fields[5]
      });
    }
    return records;
  } catch (error) {
    console.error('Error reading Notes CSV:', error);
    return [];
  }
}

export function writeNotesToCSV(records: AdvisorNote[]): void {
  initDB();
  try {
    const headers = ['id', 'assessmentId', 'advisorId', 'pillar', 'content', 'updatedAt'];
    let content = formatCSVLine(headers) + '\n';
    for (const record of records) {
      const row = [
        record.id,
        record.assessmentId,
        record.advisorId,
        record.pillar,
        record.content,
        record.updatedAt
      ];
      content += formatCSVLine(row) + '\n';
    }
    fs.writeFileSync(NOTES_CSV, content, 'utf-8');
  } catch (error) {
    console.error('Error writing Notes CSV:', error);
  }
}
