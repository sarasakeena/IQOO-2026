import { Task, DayHistory } from './types';
import { todayStr, tomorrowStr, dateStr, genId, loadHistory, saveHistory, loadTasks, saveTasks, markSeeded, isSeeded } from './storage';

// ─── Seed 7 days of realistic demo data ───

const SAMPLE_TASKS = [
  'Buy groceries', 'Review presentation slides', 'Call dentist', 'Pay electricity bill',
  'Reply to Priya\'s email', 'Submit expense report', 'Fix leaky faucet', 'Read 20 pages',
  'Meal prep for the week', 'Update resume', 'Book flight tickets', 'Water the plants',
  'Clean kitchen', 'Schedule team sync', 'Pick up dry cleaning', 'Write blog post',
  'Backup phone photos', 'Return library books', 'Check car tyre pressure', 'Order vitamins',
];

export function seedDemoData() {
  if (isSeeded()) return;

  const history: DayHistory[] = [];
  const existingTasks = loadTasks();

  // Create 7 days of history (past 7 days)
  for (let i = 7; i >= 1; i--) {
    const date = dateStr(-i);
    const total = 3 + Math.floor(Math.random() * 4); // 3-6 tasks per day
    const completed = Math.min(total, 2 + Math.floor(Math.random() * 3)); // 2-4 completed
    history.push({ date, totalTasks: total, completedTasks: completed });
  }

  saveHistory(history);

  // Add some tasks for today
  const todayTasks: Task[] = [
    { id: genId(), title: 'Finish quarterly report', dueDate: todayStr(), dueTime: '14:00', priority: 'high', done: false, createdAt: new Date().toISOString() },
    { id: genId(), title: 'Call Dr. Sharma', dueDate: todayStr(), dueTime: '10:00', person: 'Dr. Sharma', priority: 'high', done: false, createdAt: new Date().toISOString() },
    { id: genId(), title: 'Review pull request', dueDate: todayStr(), priority: 'medium', done: false, createdAt: new Date().toISOString() },
    { id: genId(), title: 'Buy groceries', dueDate: todayStr(), dueTime: '18:00', priority: 'medium', done: true, createdAt: new Date().toISOString() },
    { id: genId(), title: 'Reply to Tabassum', dueDate: todayStr(), person: 'Tabassum', priority: 'low', done: false, createdAt: new Date().toISOString() },
  ];

  saveTasks([...existingTasks, ...todayTasks]);
  markSeeded();
}

// ─── Pure functions for Today tab ───

/**
 * Compute average tasks completed per day from history.
 */
export function averageCompletion(history: DayHistory[]): number {
  if (history.length === 0) return 3; // default
  const total = history.reduce((sum, h) => sum + h.completedTasks, 0);
  return Math.round(total / history.length);
}

/**
 * Sort tasks by priority (high > medium > low) then by dueTime.
 */
function sortByPriorityAndTime(tasks: Task[]): Task[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
  });
}

/**
 * "End my day": Move unfinished tasks to tomorrow.
 * Returns { movedTasks, explanation }.
 */
export function endMyDay(
  tasks: Task[],
  history: DayHistory[]
): { updatedTasks: Task[]; movedCount: number; explanation: string } {
  const today = todayStr();
  const tomorrow = tomorrowStr();
  const todayTasks = tasks.filter((t) => t.dueDate === today);
  const doneTasks = todayTasks.filter((t) => t.done);
  const undoneTasks = sortByPriorityAndTime(todayTasks.filter((t) => !t.done));
  const avg = averageCompletion(history);

  // Move all undone to tomorrow
  const updatedTasks = tasks.map((t) => {
    if (t.dueDate === today && !t.done) {
      return { ...t, dueDate: tomorrow };
    }
    return t;
  });

  // Record today in history
  const newHistoryEntry: DayHistory = {
    date: today,
    totalTasks: todayTasks.length,
    completedTasks: doneTasks.length,
  };

  const updatedHistory = [...history.filter((h) => h.date !== today), newHistoryEntry];
  saveHistory(updatedHistory);

  const explanation = `You finished ${doneTasks.length} of ${todayTasks.length} tasks. You usually finish about ${avg} per day, so I moved ${undoneTasks.length} task${undoneTasks.length !== 1 ? 's' : ''} to tomorrow.`;

  return { updatedTasks, movedCount: undoneTasks.length, explanation };
}

/**
 * "Plan my day": Cap today's tasks at typical completion count.
 * Returns { updatedTasks, movedCount, explanation }.
 */
export function planMyDay(
  tasks: Task[],
  history: DayHistory[]
): { updatedTasks: Task[]; movedCount: number; explanation: string } {
  const today = todayStr();
  const tomorrow = tomorrowStr();
  const todayTasks = tasks.filter((t) => t.dueDate === today && !t.done);
  const avg = averageCompletion(history);

  if (todayTasks.length <= avg) {
    return {
      updatedTasks: tasks,
      movedCount: 0,
      explanation: `You have ${todayTasks.length} tasks today — that's within your usual ${avg}. You're all set!`,
    };
  }

  // Sort by priority, keep top `avg`, move rest to tomorrow
  const sorted = sortByPriorityAndTime(todayTasks);
  const keep = new Set(sorted.slice(0, avg).map((t) => t.id));
  const movedCount = sorted.length - avg;

  const updatedTasks = tasks.map((t) => {
    if (t.dueDate === today && !t.done && !keep.has(t.id)) {
      return { ...t, dueDate: tomorrow };
    }
    return t;
  });

  const explanation = `You usually finish about ${avg} tasks per day. I kept your top ${avg} by priority and moved ${movedCount} to tomorrow.`;

  return { updatedTasks, movedCount, explanation };
}
