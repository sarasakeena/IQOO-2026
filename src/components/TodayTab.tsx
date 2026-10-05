import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { loadTasks, saveTasks, loadHistory, todayStr } from '../storage';
import { seedDemoData, endMyDay, planMyDay, averageCompletion } from '../intelligence';

interface TodayTabProps {
  refreshKey: number;
}

type FilterType = 'all' | 'pending' | 'completed' | 'high';

export default function TodayTab({ refreshKey }: TodayTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [history, setHistory] = useState<ReturnType<typeof loadHistory>>([]);

  const loadData = useCallback(() => {
    seedDemoData();
    setTasks(loadTasks());
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const today = todayStr();
  const todayTasks = tasks
    .filter((t) => t.dueDate === today)
    .sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      const pd = po[a.priority] - po[b.priority];
      if (pd !== 0) return pd;
      return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
    });

  const doneTasks = todayTasks.filter((t) => t.done);
  const remainingTasks = todayTasks.filter((t) => !t.done);
  const highPriorityTasks = todayTasks.filter((t) => t.priority === 'high');

  const filteredTasks = todayTasks.filter((t) => {
    if (activeFilter === 'pending') return !t.done;
    if (activeFilter === 'completed') return t.done;
    if (activeFilter === 'high') return t.priority === 'high';
    return true;
  });

  const toggleDone = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasks(updated);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  };

  const handleEndDay = () => {
    const currentHist = loadHistory();
    const result = endMyDay(tasks, currentHist);
    setTasks(result.updatedTasks);
    saveTasks(result.updatedTasks);
    setHistory(loadHistory());
    setExplanation(result.explanation);
    setShowExplanation(true);
  };

  const handlePlanDay = () => {
    const currentHist = loadHistory();
    const result = planMyDay(tasks, currentHist);
    setTasks(result.updatedTasks);
    saveTasks(result.updatedTasks);
    setExplanation(result.explanation);
    setShowExplanation(true);
  };

  const completionPct = todayTasks.length > 0 ? Math.round((doneTasks.length / todayTasks.length) * 100) : 0;
  const avgTasks = averageCompletion(history);

  const priorityStyles = {
    high: { badge: 'bg-yellow-soft text-yellow-warm border-yellow/60 font-bold', label: '🔥 High Priority' },
    medium: { badge: 'bg-purple-soft text-purple border-purple-pastel font-semibold', label: '⚡ Medium' },
    low: { badge: 'bg-calm-elevated text-calm-muted border-calm-border font-medium', label: '🌱 Gentle' },
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 text-calm-text">
      {/* ─── Header & Metrics Bar ─── */}
      <div className="pb-3.5 border-b border-purple-pastel/25 mb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-display font-extrabold text-calm-text tracking-tight">Today's Flow</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-soft text-purple border border-purple-pastel/60 shadow-xs">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-xs text-calm-muted mt-0.5 font-medium">Find your calm rhythm • Prioritized with ease</p>
          </div>

          {/* Quick Metrics Badges in Yellow, Purple & White */}
          <div className="flex items-center gap-2">
            <div className="glass-card px-3.5 py-1.5 rounded-2xl border border-purple-pastel/30 flex items-center gap-2 shadow-xs">
              <span className="text-xs text-calm-muted font-medium">Completed:</span>
              <span className="text-xs font-bold text-purple">{doneTasks.length}/{todayTasks.length}</span>
            </div>
            <div className="glass-card px-3.5 py-1.5 rounded-2xl border border-yellow-light/80 flex items-center gap-2 shadow-xs bg-yellow-soft/60">
              <span className="text-xs text-calm-muted font-medium">High Focus:</span>
              <span className="text-xs font-bold text-yellow-warm">{highPriorityTasks.length}</span>
            </div>
            <div className="glass-card px-3.5 py-1.5 rounded-2xl border border-purple-pastel/30 flex items-center gap-2 shadow-xs">
              <span className="text-xs text-calm-muted font-medium">Daily Pace:</span>
              <span className="text-xs font-bold text-calm-text">{avgTasks}/day</span>
            </div>
          </div>
        </div>

        {/* Progress Bar with Dual-Tone Gradient */}
        <div className="mt-3.5">
          <div className="flex justify-between items-center text-[11px] text-calm-muted mb-1.5 font-medium">
            <span className="font-bold text-calm-text">{completionPct}% Flow Complete</span>
            <span>{remainingTasks.length} {remainingTasks.length === 1 ? 'task' : 'tasks'} remaining</span>
          </div>
          <div className="h-2.5 w-full bg-white/70 rounded-full overflow-hidden p-0.5 border border-purple-pastel/30 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple via-purple-pastel to-yellow rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Responsive 2-Column Grid (Laptop) / Stacked (Mobile) ─── */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4">
          
          {/* ─── Task List Column (Spans 2 columns on lg+) ─── */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `All Tasks (${todayTasks.length})` },
                { id: 'pending', label: `In Flow (${remainingTasks.length})` },
                { id: 'completed', label: `Finished (${doneTasks.length})` },
                { id: 'high', label: `🔥 High (${highPriorityTasks.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as FilterType)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    activeFilter === f.id
                      ? 'bg-gradient-to-r from-purple to-yellow text-white font-bold zen-glow-purple shadow-sm'
                      : 'bg-white/80 text-calm-muted hover:text-calm-text hover:bg-white border border-purple-pastel/30 shadow-xs'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Task Cards */}
            {filteredTasks.length === 0 ? (
              <div className="glass-card rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-2.5 border border-purple-pastel/30 my-auto shadow-sm">
                <span className="text-4xl animate-bounce">✨</span>
                <p className="text-base font-display font-bold text-calm-text">
                  {todayTasks.length === 0 ? 'Your slate is wonderfully clear' : 'No tasks match this filter'}
                </p>
                <p className="text-xs text-calm-muted max-w-xs leading-relaxed">
                  {todayTasks.length === 0 ? 'Take a mindful pause or head over to Capture to add what matters today' : 'Try selecting another view from the pills above'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => {
                  const style = priorityStyles[task.priority];
                  return (
                    <div
                      key={task.id}
                      className={`glass-card rounded-2xl p-4 border transition-all ${
                        task.done
                          ? 'border-purple-pastel/20 opacity-60 bg-white/50'
                          : 'border-purple-pastel/35 hover:border-purple/60 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Checkbox Ring */}
                        <button
                          onClick={() => toggleDone(task.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 active:scale-90 ${
                            task.done
                              ? 'bg-gradient-to-r from-purple to-yellow border-yellow text-white shadow-xs'
                              : 'border-purple-pastel hover:border-purple'
                          }`}
                          title={task.done ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {task.done && <span className="text-xs font-bold text-white">✓</span>}
                        </button>

                        {/* Title and details */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate transition-all ${
                              task.done ? 'line-through text-calm-muted' : 'text-calm-text font-bold'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-calm-muted">
                            {task.dueTime && (
                              <span className="flex items-center gap-1 bg-yellow-soft/80 px-2 py-0.5 rounded-md border border-yellow-light text-calm-text font-semibold">
                                <span className="text-yellow-warm">⏰</span> {task.dueTime}
                              </span>
                            )}
                            {task.person && (
                              <span className="flex items-center gap-1 bg-purple-soft px-2 py-0.5 rounded-md text-purple border border-purple-pastel/40 font-semibold">
                                <span>👤</span> {task.person}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase border ${style.badge}`}>
                              {style.label}
                            </span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-calm-muted/50 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Smart Assistant & 7-Day Chart Column ─── */}
          <div className="flex flex-col gap-3">
            {/* AI Scheduling Explanation Banner */}
            {showExplanation && explanation && (
              <div className="glass-card-active rounded-2xl p-4 border border-yellow-light shadow-md animate-bounce-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl">🧠</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-yellow-warm">ShowSay Mindful Reasoning</p>
                      <p className="text-xs text-calm-text font-medium mt-1 leading-relaxed">{explanation}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="text-calm-muted hover:text-calm-text text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Smart Actions Panel in Calm Purple & Yellow */}
            <div className="glass-card rounded-3xl p-5 border border-purple-pastel/30 flex flex-col gap-2.5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-calm-text flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-yellow-soft text-yellow-warm flex items-center justify-center text-xs">⚡</span>
                Intelligent Daily Flow
              </span>
              <p className="text-xs text-calm-muted leading-relaxed">
                Smart scheduling calibrated against your natural completion capacity.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={handlePlanDay}
                  className="py-3 px-3 rounded-2xl bg-purple-soft hover:bg-purple/15 text-purple border border-purple-pastel text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm"
                >
                  <span>📋</span>
                  <span>Plan My Day</span>
                </button>
                <button
                  onClick={handleEndDay}
                  className="py-3 px-3 rounded-2xl bg-yellow-soft hover:bg-yellow-warm/20 text-yellow-warm border border-yellow-light text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm"
                >
                  <span>🌙</span>
                  <span>End My Day</span>
                </button>
              </div>
            </div>

            {/* 7-Day Completion Velocity Chart */}
            <div className="glass-card rounded-3xl p-5 border border-purple-pastel/30 flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-calm-text flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-purple-soft text-purple flex items-center justify-center text-xs">📊</span>
                  7-Day Velocity
                </span>
                <span className="text-[10px] text-purple font-bold bg-purple-soft px-2 py-0.5 rounded-full border border-purple-pastel/40">Avg: {avgTasks}/day</span>
              </div>

              {/* Bar Chart (Rounded Wellness Capsules) */}
              <div className="h-28 flex items-end justify-between gap-2 pt-3 pb-1 px-1">
                {history.map((h) => {
                  const maxH = Math.max(...history.map((item) => item.totalTasks), 6);
                  const heightPct = Math.round((h.completedTasks / maxH) * 100);
                  const totalHeightPct = Math.round((h.totalTasks / maxH) * 100);
                  const dayName = new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });

                  return (
                    <div key={h.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="w-full max-w-[18px] bg-purple-soft/50 rounded-full relative flex flex-col justify-end overflow-hidden border border-purple-pastel/25 shadow-inner" style={{ height: `${totalHeightPct}%` }}>
                        <div
                          className="w-full bg-gradient-to-t from-purple via-purple-pastel to-yellow rounded-full transition-all group-hover:brightness-105 shadow-xs"
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-calm-muted group-hover:text-purple font-bold">{dayName}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-center text-calm-muted font-medium">
                Completed vs planned rhythm over the past week
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
