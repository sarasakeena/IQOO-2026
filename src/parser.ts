import { Task } from './types';
import { todayStr, tomorrowStr, genId } from './storage';

// ─── Deterministic rule-based task parser (pure function) ───

interface ParseContext {
  globalDeadline?: string;   // YYYY-MM-DD from speech
  globalTime?: string;       // HH:mm from speech
  globalPriority?: Task['priority'];
}

// Maps for transliterated Tamil/Hindi time words
const TOMORROW_WORDS = ['tomorrow', 'naalaikku', 'naalaiku', 'kal', 'naalai', 'agaami'];
const TODAY_WORDS = ['today', 'inru', 'inniki', 'aaj', 'ippo'];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_VARIANTS: Record<string, number> = {};
WEEKDAYS.forEach((d, i) => {
  WEEKDAY_VARIANTS[d] = i;
  // Handle "friday-kulla", "friday-ku", "friday-la" etc.
  WEEKDAY_VARIANTS[d + '-kulla'] = i;
  WEEKDAY_VARIANTS[d + '-ku'] = i;
  WEEKDAY_VARIANTS[d + '-la'] = i;
  WEEKDAY_VARIANTS[d + 'kulla'] = i;
  // Short forms
  WEEKDAY_VARIANTS[d.slice(0, 3)] = i;
});

function getNextWeekday(dayIndex: number): string {
  const now = new Date();
  const current = now.getDay();
  let diff = dayIndex - current;
  if (diff <= 0) diff += 7;
  const target = new Date(now);
  target.setDate(target.getDate() + diff);
  return target.toISOString().slice(0, 10);
}

function extractDate(text: string): string | undefined {
  const lower = text.toLowerCase().trim();

  // "by Friday", "before Friday", "Friday-kulla"
  for (const [variant, dayIdx] of Object.entries(WEEKDAY_VARIANTS)) {
    if (lower.includes(variant)) {
      return getNextWeekday(dayIdx);
    }
  }

  for (const word of TOMORROW_WORDS) {
    if (lower.includes(word)) return tomorrowStr();
  }

  for (const word of TODAY_WORDS) {
    if (lower.includes(word)) return todayStr();
  }

  return undefined;
}

function extractTime(text: string): string | undefined {
  const lower = text.toLowerCase();

  // "morning", "kaalaiyil" (Tamil: in the morning)
  if (/\b(morning|kaalaiyil|kaalai|subah|subha)\b/.test(lower)) return '09:00';

  // "evening", "maalai" (Tamil), "shaam" (Hindi)
  if (/\b(evening|maalai|shaam|sham)\b/.test(lower)) return '18:00';

  // "afternoon", "madhiyam" (Tamil), "dopahar" (Hindi)
  if (/\b(afternoon|madhiyam|madhyanam|dopahar)\b/.test(lower)) return '14:00';

  // "night", "raathri" (Tamil), "raat" (Hindi)
  if (/\b(night|raathri|raat|iravu)\b/.test(lower)) return '21:00';

  // Match "5pm", "5:30pm", "17:00"
  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3];
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  return undefined;
}

function extractPerson(text: string): string | undefined {
  // "call Tabassum", "tell Ravi", "remind Priya", "ask John"
  const match = text.match(/\b(?:call|tell|remind|ask|ping|message|text|email)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
  if (match) return match[1];
  return undefined;
}

function extractPriority(text: string): Task['priority'] {
  const lower = text.toLowerCase();
  if (/\b(urgent|asap|important|critical|high\s*priority|!{2,})\b/.test(lower)) return 'high';
  if (/\b(low\s*priority|whenever|someday|later)\b/.test(lower)) return 'low';
  return 'medium';
}

function cleanTaskTitle(text: string): string {
  // Remove date/time phrases from the title
  let cleaned = text
    .replace(/\b(by|before|until|till)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(-kulla|-ku|-la|kulla)?\b/gi, '')
    .replace(/\b(today|tomorrow|naalaikku|naalaiku|kal|naalai|inru|inniki|aaj|ippo|agaami)\b/gi, '')
    .replace(/\b(morning|evening|afternoon|night|kaalaiyil|kaalai|subah|maalai|shaam|raathri|raat|iravu|madhiyam|dopahar)\b/gi, '')
    .replace(/\b(urgent|asap|important|critical|high\s*priority|low\s*priority)\b/gi, '')
    .replace(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/gi, '')
    .replace(/[!]{2,}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned || text.trim();
}

/**
 * Parse speech text to extract global context (deadline, time, priority).
 */
function parseSpeechContext(speech: string): ParseContext {
  const ctx: ParseContext = {};
  ctx.globalDeadline = extractDate(speech);
  ctx.globalTime = extractTime(speech);
  ctx.globalPriority = extractPriority(speech);
  return ctx;
}

/**
 * Parse OCR text + speech text into a list of tasks.
 * Pure function: no side effects.
 */
export function parseTasks(ocrText: string, speechText: string): Task[] {
  const ctx = parseSpeechContext(speechText);

  // Split OCR text into lines; each non-empty line = one task
  const lines = ocrText
    .split(/[\n\r]+/)
    .map((l) => l.replace(/^[\s\-•*\d.)\]]+/, '').trim()) // Strip bullets, numbering
    .filter((l) => l.length > 2); // Skip very short lines

  if (lines.length === 0) return [];

  return lines.map((line) => {
    const lineDueDate = extractDate(line) || ctx.globalDeadline || todayStr();
    const lineDueTime = extractTime(line) || ctx.globalTime;
    const person = extractPerson(line);
    const linePriority = extractPriority(line);
    // Use line priority if it's non-default, otherwise use global
    const priority = linePriority !== 'medium' ? linePriority : (ctx.globalPriority !== 'medium' ? ctx.globalPriority || 'medium' : 'medium');

    return {
      id: genId(),
      title: cleanTaskTitle(line),
      dueDate: lineDueDate,
      dueTime: lineDueTime,
      person,
      priority,
      done: false,
      createdAt: new Date().toISOString(),
    };
  });
}

/**
 * Generate a human-readable summary of how the input was understood.
 */
export function generateSummary(tasks: Task[], speechText: string): string {
  if (tasks.length === 0) return 'No tasks found.';

  const parts: string[] = [];
  parts.push(`Found ${tasks.length} task${tasks.length > 1 ? 's' : ''}`);

  const dates = [...new Set(tasks.map((t) => t.dueDate))];
  if (dates.length === 1) {
    const d = dates[0];
    if (d === todayStr()) parts.push('all due today');
    else if (d === tomorrowStr()) parts.push('all due tomorrow');
    else parts.push(`all due ${new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}`);
  }

  const people = tasks.map((t) => t.person).filter(Boolean);
  if (people.length > 0) {
    parts.push(`involving ${[...new Set(people)].join(', ')}`);
  }

  if (speechText) {
    parts.push(`from your voice note`);
  }

  return parts.join(', ') + '.';
}
