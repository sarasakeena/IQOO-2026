import React, { useState, useCallback, useEffect } from 'react';
import { TabName } from './types';
import CaptureTab from './components/CaptureTab';
import TodayTab from './components/TodayTab';
import FocusTab from './components/FocusTab';
import { clearAll } from './storage';

interface TabItem {
  id: TabName;
  label: string;
  icon: string;
  badge?: string;
  description: string;
}

const tabs: TabItem[] = [
  { id: 'capture', label: 'Capture', icon: '📸', description: 'Photo OCR & Voice Note' },
  { id: 'today', label: 'Today', icon: '📋', description: 'Mindful Daily Flow' },
  { id: 'focus', label: 'Focus', icon: '🎯', description: 'Face-down Zen Timer' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('capture');
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'laptop' | 'phone'>('laptop');
  const [currentTime, setCurrentTime] = useState('');

  // Live clock for header
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation (1: Capture, 2: Today, 3: Focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setActiveTab('capture');
      if (e.key === '2') setActiveTab('today');
      if (e.key === '3') setActiveTab('focus');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTasksSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setActiveTab('today');
  }, []);

  const handleResetData = () => {
    if (window.confirm('Reset all demo data and history?')) {
      clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="w-full h-screen ambient-bg flex flex-col overflow-hidden text-calm-text select-none font-sans relative">
      {/* ─── Aesthetic Ambient Floating Glow Orbs ─── */}
      <div className="absolute top-[-100px] left-[-80px] w-96 h-96 rounded-full bg-purple-pastel/30 blur-3xl pointer-events-none animate-breathe" />
      <div className="absolute bottom-[-100px] right-[-80px] w-96 h-96 rounded-full bg-yellow-light/35 blur-3xl pointer-events-none animate-pulse-slow" />

      {/* ─── Desktop Header (Aesthetic Frosted Glass) ─── */}
      <header className="hidden md:flex items-center justify-between px-6 py-3.5 border-b border-white/80 glass-panel z-20 flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-deep via-purple to-yellow flex items-center justify-center text-xl zen-glow-purple text-white shadow-md">
            📸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-display font-extrabold tracking-tight text-calm-text">ShowSay</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-yellow-soft text-yellow-warm border border-yellow-light/80 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow animate-ping" />
                Calm Edition
              </span>
            </div>
            <p className="text-xs text-calm-muted font-medium">Show it. Say it. Done.</p>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar with Calm Purple & Yellow Highlights */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-purple-pastel/40 shadow-sm">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple to-yellow text-white zen-glow-purple font-bold shadow-md'
                    : 'text-calm-muted hover:text-calm-text hover:bg-purple-soft/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-yellow-pastel' : 'opacity-40'}`}>
                  [{idx + 1}]
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side: Time Pill & Viewport Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs text-calm-muted bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-purple-pastel/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-yellow animate-pulse" />
            <span className="font-mono text-calm-text font-bold">{currentTime}</span>
          </div>

          {/* View Mode Toggle: Laptop vs Phone Frame */}
          <div className="flex items-center bg-white/80 backdrop-blur-md p-1 rounded-xl border border-purple-pastel/30 shadow-sm">
            <button
              onClick={() => setViewMode('laptop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'laptop'
                  ? 'bg-white text-calm-text shadow-sm font-bold border border-purple-pastel/30'
                  : 'text-calm-muted hover:text-calm-text'
              }`}
              title="Wide responsive dashboard for laptop"
            >
              <span>💻</span>
              <span className="hidden sm:inline">Laptop</span>
            </button>
            <button
              onClick={() => setViewMode('phone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'phone'
                  ? 'bg-white text-calm-text shadow-sm font-bold border border-purple-pastel/30'
                  : 'text-calm-muted hover:text-calm-text'
              }`}
              title="390px mobile phone simulation"
            >
              <span>📱</span>
              <span className="hidden sm:inline">Phone</span>
            </button>
          </div>

          <button
            onClick={handleResetData}
            className="text-xs text-calm-muted hover:text-purple px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white border border-purple-pastel/30 transition-all shadow-sm font-medium"
            title="Reset demo tasks & 7-day history"
          >
            Reset
          </button>
        </div>
      </header>

      {/* ─── Main Content Canvas (Aesthetic Frosted Layout) ─── */}
      <main className="flex-1 overflow-hidden flex items-center justify-center p-0 md:p-5 z-10">
        {viewMode === 'laptop' ? (
          <div className="w-full h-full md:max-w-5xl md:h-[calc(100vh-92px)] flex flex-col md:rounded-3xl overflow-hidden glass-panel border border-white/90 shadow-2xl relative">
            {/* Active Tab Component */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'capture' && <CaptureTab onTasksSaved={handleTasksSaved} />}
              {activeTab === 'today' && <TodayTab refreshKey={refreshKey} />}
              {activeTab === 'focus' && <FocusTab refreshKey={refreshKey} />}
            </div>

            {/* Mobile Bottom Navigation Bar (Shown on Mobile screens when width < 768px) */}
            <nav className="md:hidden flex-shrink-0 bg-white/90 backdrop-blur-2xl border-t border-purple-pastel/30 py-2 px-3 z-30 shadow-lg">
              <div className="flex items-center justify-around">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
                        isActive ? 'text-purple font-bold' : 'text-calm-muted'
                      }`}
                    >
                      <div className={`text-xl transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                        {tab.icon}
                      </div>
                      <span className="text-[10px] font-semibold tracking-wider uppercase">
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="w-5 h-1 rounded-full bg-gradient-to-r from-purple to-yellow zen-glow-purple" />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        ) : (
          /* Phone Frame Mode (390px Phone Mockup on Ambient Gradient) */
          <div className="phone-frame flex flex-col bg-white/90 backdrop-blur-2xl">
            {/* Dynamic Island Notch */}
            <div className="phone-notch">
              <div className="phone-sensor" />
              <div className="phone-camera-lens" />
            </div>

            {/* Phone Status Bar info */}
            <div className="pt-3 px-6 pb-1 flex justify-between items-center text-[11px] text-calm-muted font-mono z-40">
              <span className="text-calm-text font-bold">{currentTime || '9:41'}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-purple font-bold">5G</span>
                <span>📶</span>
                <span>🔋 100%</span>
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-hidden relative pt-2">
              {activeTab === 'capture' && <CaptureTab onTasksSaved={handleTasksSaved} />}
              {activeTab === 'today' && <TodayTab refreshKey={refreshKey} />}
              {activeTab === 'focus' && <FocusTab refreshKey={refreshKey} />}
            </div>

            {/* Phone Bottom Tab Bar */}
            <nav className="bg-white/90 backdrop-blur-2xl border-t border-purple-pastel/30 py-2.5 px-3 z-30">
              <div className="flex items-center justify-around">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                        isActive ? 'text-purple font-bold' : 'text-calm-muted'
                      }`}
                    >
                      <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                        {tab.icon}
                      </span>
                      <span className="text-[9px] font-semibold tracking-wider uppercase">
                        {tab.label}
                      </span>
                      {isActive && <div className="w-5 h-0.5 rounded-full bg-gradient-to-r from-purple to-yellow zen-glow-purple" />}
                    </button>
                  );
                })}
              </div>
              {/* Home indicator bar */}
              <div className="w-28 h-1 bg-purple-pastel/40 rounded-full mx-auto mt-2" />
            </nav>
          </div>
        )}
      </main>
    </div>
  );
}
