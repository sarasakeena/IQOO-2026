// ─── Core Types ───

export interface Task {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  person?: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  startedAt: string;
  minutes: number;
  interruptions: number;
  completed: boolean;
}

export interface DayHistory {
  date: string; // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
}

export type TabName = 'capture' | 'today' | 'focus';
