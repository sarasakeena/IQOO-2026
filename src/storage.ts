import { Task, FocusSession, DayHistory } from './types';

// ─── localStorage helpers ───

const KEYS = {
  tasks: 'showsay_tasks',
  sessions: 'showsay_sessions',
  history: 'showsay_history',
  seeded: 'showsay_seeded',
};

export function loadTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.tasks) || '[]');
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
}

export function loadSessions(): FocusSession[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.sessions) || '[]');
  } catch {
    return [];
  }
}

export function saveSessions(sessions: FocusSession[]) {
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
}

export function loadHistory(): DayHistory[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.history) || '[]');
  } catch {
    return [];
  }
}

export function saveHistory(history: DayHistory[]) {
  localStorage.setItem(KEYS.history, JSON.stringify(history));
}

export function isSeeded(): boolean {
  return localStorage.getItem(KEYS.seeded) === 'true';
}

export function markSeeded() {
  localStorage.setItem(KEYS.seeded, 'true');
}

export function clearAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// ─── Date helpers ───

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function dateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

export function formatDate(isoDate: string): string {
  const today = todayStr();
  const tomorrow = tomorrowStr();
  if (isoDate === today) return 'Today';
  if (isoDate === tomorrow) return 'Tomorrow';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
