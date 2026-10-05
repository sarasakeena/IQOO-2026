import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task, FocusSession } from '../types';
import { loadTasks, saveTasks, loadSessions, saveSessions, todayStr, genId } from '../storage';

interface FocusTabProps {
  refreshKey: number;
}

const FOCUS_DURATION_SECONDS = 25 * 60; // 25 minutes
const FACE_DOWN_THRESHOLD = 1.5; // seconds

export default function FocusTab({ refreshKey }: FocusTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeSession, setActiveSession] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_DURATION_SECONDS);
  const [interruptions, setInterruptions] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [orientationPermission, setOrientationPermission] = useState<string>('unknown');
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceDownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<number>(0);

  // Load tasks & sessions
  const reloadData = useCallback(() => {
    const allTasks = loadTasks();
    const todayUndone = allTasks
      .filter((t) => t.dueDate === todayStr() && !t.done)
      .sort((a, b) => {
        const po = { high: 0, medium: 1, low: 2 };
        return po[a.priority] - po[b.priority];
      });
    setTasks(todayUndone);
    if (todayUndone.length > 0 && !currentTask) {
      setCurrentTask(todayUndone[0]);
    }
    setRecentSessions(loadSessions().slice(-5).reverse());
  }, [currentTask]);

  useEffect(() => {
    reloadData();
  }, [reloadData, refreshKey]);

  // ─── Countdown timer ───
  useEffect(() => {
    if (activeSession && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const completeSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveSession(false);

    if (currentTask) {
      const session: FocusSession = {
        id: genId(),
        taskId: currentTask.id,
        taskTitle: currentTask.title,
        startedAt: new Date(sessionStartRef.current).toISOString(),
        minutes: 25,
        interruptions,
        completed: true,
      };
      const sessions = loadSessions();
      saveSessions([...sessions, session]);

      // Mark task done
      const allTasks = loadTasks();
      const updated = allTasks.map((t) => (t.id === currentTask.id ? { ...t, done: true } : t));
      saveTasks(updated);
      setTasks(updated.filter((t) => t.dueDate === todayStr() && !t.done));
    }

    setTimeRemaining(FOCUS_DURATION_SECONDS);
    setInterruptions(0);
    setShowAlert(false);
    reloadData();
  }, [currentTask, interruptions, reloadData]);

  const startSession = useCallback(() => {
    if (!currentTask) return;
    sessionStartRef.current = Date.now();
    setActiveSession(true);
    setTimeRemaining(FOCUS_DURATION_SECONDS);
    setInterruptions(0);
    setShowAlert(false);
  }, [currentTask]);

  const stopSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveSession(false);

    if (currentTask) {
      const elapsed = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000));
      const session: FocusSession = {
        id: genId(),
        taskId: currentTask.id,
        taskTitle: currentTask.title,
        startedAt: new Date(sessionStartRef.current).toISOString(),
        minutes: elapsed,
        interruptions,
        completed: false,
      };
      const sessions = loadSessions();
      saveSessions([...sessions, session]);
    }

    setTimeRemaining(FOCUS_DURATION_SECONDS);
    setInterruptions(0);
    setShowAlert(false);
    reloadData();
  }, [currentTask, interruptions, reloadData]);

  // ─── Face-down detection ───
  useEffect(() => {
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const result = await (DeviceOrientationEvent as any).requestPermission();
          setOrientationPermission(result);
        } catch {
          setOrientationPermission('denied');
        }
      } else {
        setOrientationPermission('granted');
      }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta || 0;
      const gamma = e.gamma || 0;
      const faceDown = Math.abs(Math.abs(beta) - 180) < 35 && Math.abs(gamma) < 35;

      if (faceDown && !isFaceDown) {
        faceDownTimerRef.current = setTimeout(() => {
          setIsFaceDown(true);
          if (!activeSession) {
            startSession();
          }
        }, FACE_DOWN_THRESHOLD * 1000);
      } else if (!faceDown && isFaceDown) {
        setIsFaceDown(false);
        if (faceDownTimerRef.current) {
          clearTimeout(faceDownTimerRef.current);
        }
        if (activeSession) {
          triggerDistraction();
        }
      }
    };

    requestPermission();
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (faceDownTimerRef.current) clearTimeout(faceDownTimerRef.current);
    };
  }, [isFaceDown, activeSession, startSession]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && activeSession) {
        triggerDistraction();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [activeSession]);

  const triggerDistraction = useCallback(() => {
    setShowAlert(true);
    setInterruptions((prev) => prev + 1);
    if (navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 200]);
      } catch { }
    }
  }, []);

  const simulateFaceDown = () => {
    setIsFaceDown(true);
    if (!activeSession) {
      startSession();
    }
  };

  const simulatePickUp = () => {
    setIsFaceDown(false);
    if (activeSession) {
      triggerDistraction();
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeRemaining / FOCUS_DURATION_SECONDS;
  const circumference = 2 * Math.PI * 88;
  const strokeDashoffset = circumference * (1 - progress);

  // ─── DISTRACTION ALERT (White Backdrop with Amber Warning) ───
  if (showAlert && activeSession) {
    return (
      <div className="fixed inset-0 bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center z-50 p-6 animate-fade-in shake text-center">
        <div className="w-20 h-20 rounded-3xl bg-yellow-soft border-2 border-yellow flex items-center justify-center text-4xl mb-4 shadow-xl">
          ⚠️
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-calm-text mb-2">
          Distraction Detected!
        </h2>
        <p className="text-sm md:text-base text-calm-muted mb-2">
          You are currently in deep focus on:
        </p>
        <p className="text-lg md:text-xl font-bold text-calm-text bg-calm-elevated px-4 py-2 rounded-xl border border-calm-border mb-6 max-w-md shadow-sm">
          "{currentTask?.title}"
        </p>

        <div className="text-5xl md:text-6xl font-black text-calm-text mb-4 font-mono tracking-tight">
          {formatTime(timeRemaining)}
        </div>

        <p className="text-xs text-yellow-warm mb-8 bg-yellow-soft px-3 py-1.5 rounded-full border border-yellow-light font-semibold">
          ⚡ {interruptions} {interruptions === 1 ? 'interruption' : 'interruptions'} logged this session
        </p>

        <button
          onClick={() => setShowAlert(false)}
          className="px-8 py-4 bg-gradient-to-r from-purple to-yellow text-white font-black rounded-2xl text-base shadow-xl active:scale-95 transition-all"
        >
          ← Return to Deep Focus
        </button>
      </div>
    );
  }

  // ─── MAIN FOCUS SCREEN ───
  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 text-calm-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-calm-border flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-calm-text tracking-tight">Focus Zone</h1>
          <p className="text-xs text-calm-muted">Face-down deep work timer calibrated with calming colors</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-calm-muted font-semibold uppercase">Demo Controls:</span>
          <div
            className={`toggle-pill ${showDebug ? 'active' : ''}`}
            onClick={() => setShowDebug(!showDebug)}
          >
            <div className="toggle-knob" />
          </div>
        </div>
      </div>

      {/* Responsive Content Grid: 2-Column on Desktop/Laptop, Stacked on Mobile */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">

          {/* ─── Column 1: Timer & Active Session ─── */}
          <div className="glass-card rounded-3xl p-6 border border-calm-border flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
            {/* Ambient circular glow */}
            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-purple-soft/40 to-yellow-soft/30 blur-3xl pointer-events-none" />

            {!currentTask ? (
              <div className="flex flex-col items-center justify-center py-10">
                <span className="text-5xl mb-3">✨</span>
                <p className="text-base font-bold text-calm-text">All Tasks Completed!</p>
                <p className="text-xs text-calm-muted mt-1 max-w-xs">
                  You've completed every task for today. Head to Capture to add more.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                {/* Current Target Task Pill */}
                <div className="bg-calm-elevated border border-calm-border px-4 py-2 rounded-2xl mb-6 max-w-sm w-full shadow-inner">
                  <p className="text-[10px] uppercase font-bold text-purple tracking-wider mb-0.5">
                    Target Task
                  </p>
                  <p className="text-sm font-bold text-calm-text truncate">{currentTask.title}</p>
                </div>

                {/* SVG Circular Progress Ring with Purple & Warm Yellow Gradient */}
                <div className="relative w-56 h-56 md:w-64 md:h-64 mb-6">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100" cy="100" r="88"
                      stroke="#F0EAF8"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="100" cy="100" r="88"
                      stroke="url(#calmGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-linear shadow-md"
                    />
                    <defs>
                      <linearGradient id="calmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="60%" stopColor="#A78BFA" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Centered Countdown & Pulse */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-5xl font-black text-calm-text font-mono tracking-tight">
                      {formatTime(timeRemaining)}
                    </span>
                    <span className="text-xs text-calm-muted mt-1 uppercase font-semibold tracking-wider">
                      {activeSession ? 'Session Active' : '25 Min Focus'}
                    </span>
                    {activeSession && (
                      <div className="flex items-center gap-1.5 mt-2 bg-yellow-soft text-yellow-warm border border-yellow-light px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow animate-ping" />
                        <span>In The Flow</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full max-w-xs">
                  {!activeSession ? (
                    <button
                      onClick={startSession}
                      className="flex-1 py-3.5 bg-gradient-to-r from-purple via-purple-deep to-yellow hover:brightness-105 text-white font-black rounded-2xl text-sm shadow-lg shadow-purple/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>▶</span>
                      <span>Start Focus</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopSession}
                      className="flex-1 py-3.5 bg-calm-elevated hover:bg-calm-subtle text-calm-text font-bold rounded-2xl text-sm border border-calm-border active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>⏹</span>
                      <span>End Early</span>
                    </button>
                  )}
                </div>

                {/* Face-Down Status Pill in Calm Yellow */}
                {isFaceDown && (
                  <div className="flex items-center gap-2 mt-4 px-3.5 py-1 rounded-full bg-yellow-soft border border-yellow-light text-yellow-warm text-xs font-semibold animate-pulse shadow-sm">
                    <span>📱</span>
                    <span>Device is Face-Down · Zen Focus Active</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Column 2: Focus Queue & Interactive Demo Controls ─── */}
          <div className="flex flex-col gap-4">

            {/* Task Selection Queue */}
            <div className="glass-card rounded-2xl p-4 border border-calm-border shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-calm-text flex items-center gap-1.5 mb-2.5">
                <span className="text-purple">📋</span> Focus Task Queue
              </span>

              {tasks.length === 0 ? (
                <p className="text-xs text-calm-muted">No remaining tasks for today</p>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 4).map((t) => {
                    const isSelected = currentTask?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => !activeSession && setCurrentTask(t)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${isSelected
                            ? 'bg-purple-soft/50 border-purple-pastel shadow-sm'
                            : 'bg-calm-surface border-calm-border hover:border-purple-pastel/60'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${t.priority === 'high' ? 'bg-yellow' : t.priority === 'medium' ? 'bg-purple' : 'bg-calm-muted'}`} />
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-purple-deep' : 'text-calm-text'}`}>
                            {t.title}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-yellow-warm uppercase px-2 py-0.5 rounded-md bg-yellow-soft border border-yellow-light">
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Interactive Demo Simulation Controls */}
            {showDebug && (
              <div className="glass-card-active rounded-2xl p-4 border border-yellow-light shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-warm flex items-center gap-1.5">
                    <span>⚡</span> Presentation Simulator
                  </span>
                  <span className="text-[10px] text-calm-muted">Sensor simulation</span>
                </div>
                <p className="text-xs text-calm-text mb-3">
                  Simulate phone gyroscope sensors without physically flipping your laptop:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={simulateFaceDown}
                    className="py-2.5 px-3 rounded-xl bg-yellow-soft hover:bg-yellow-warm/20 text-yellow-warm border border-yellow-light text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>📱↓</span>
                    <span>Flip Face-Down</span>
                  </button>
                  <button
                    onClick={simulatePickUp}
                    disabled={!activeSession}
                    className="py-2.5 px-3 rounded-xl bg-purple-soft hover:bg-purple/15 text-purple border border-purple-pastel text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>📱↑</span>
                    <span>Pick Up Phone</span>
                  </button>
                </div>

                {/* Sensor Info */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-calm-border text-[10px] text-calm-muted font-mono">
                  <span>Face-Down: {isFaceDown ? '✅ TRUE' : '❌ FALSE'}</span>
                  <span>Session: {activeSession ? '✅ ACTIVE' : '❌ IDLE'}</span>
                  <span>Distractions: {interruptions}</span>
                </div>
              </div>
            )}

            {/* Recent Completed Sessions Log */}
            {recentSessions.length > 0 && (
              <div className="glass-card rounded-2xl p-4 border border-calm-border shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-calm-text flex items-center gap-1.5 mb-2">
                  <span className="text-purple">⏱️</span> Recent Sessions
                </span>
                <div className="space-y-1.5">
                  {recentSessions.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs text-calm-muted bg-calm-elevated p-2 rounded-lg border border-calm-border">
                      <span className="truncate max-w-[180px] text-calm-text font-medium">{s.taskTitle}</span>
                      <span className="text-purple font-mono font-bold">{s.minutes} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
