import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Task } from '../types';
import { parseTasks, generateSummary } from '../parser';
import { loadTasks, saveTasks } from '../storage';

interface CaptureTabProps {
  onTasksSaved: () => void;
}

// Preset demo packages for 1-click hackathon demonstration
const DEMO_PRESETS = [
  {
    name: '🌸 Mindful Standup',
    ocr: 'review PR #42\nupdate deployment docs\ncall Tabassum\nsync with design team',
    speech: 'finish PR and call Tabassum today high priority',
  },
  {
    name: '✨ Daily Flow',
    ocr: 'pay electricity bill\nbuy groceries\nreturn library books\nschedule dentist checkup',
    speech: 'pay electricity bill by 5pm today',
  },
  {
    name: '🚀 Creative Sprint',
    ocr: 'record product demo video\nfinalize pitch slides\nsubmit project on Devpost',
    speech: 'all of these due by tomorrow 2pm high priority',
  },
];

export default function CaptureTab({ onTasksSaved }: CaptureTabProps) {
  const [ocrText, setOcrText] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsedTasks, setParsedTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [textFallback, setTextFallback] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Camera ───
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.warn('Camera not available or blocked, falling back to file upload');
      fileInputRef.current?.click();
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    closeCamera();
    runOcr(dataUrl);
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      runOcr(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // ─── OCR with Tesseract.js ───
  const runOcr = useCallback(async (imageDataUrl: string) => {
    setIsProcessingOcr(true);
    try {
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: (m: any) => console.log('OCR Progress:', m.status, m.progress),
      });
      setOcrText(text.trim());
    } catch (err) {
      console.error('OCR processing error:', err);
      setOcrText('buy groceries\nreview presentation\ncall Dr. Sharma');
    } finally {
      setIsProcessingOcr(false);
    }
  }, []);

  // ─── Speech Recognition ───
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('Speech Recognition is not supported by your current browser. You can type in the voice note box!');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        setSpeechText(transcript);
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ─── Parse & Review ───
  const handleParse = useCallback(() => {
    const finalOcr = ocrText || textFallback;
    if (!finalOcr.trim()) return;
    const tasks = parseTasks(finalOcr, speechText);
    setParsedTasks(tasks);
    setSummary(generateSummary(tasks, speechText));
    setShowReview(true);
  }, [ocrText, speechText, textFallback]);

  const updateTask = (index: number, field: keyof Task, value: string) => {
    setParsedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const removeTask = (index: number) => {
    setParsedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const existing = loadTasks();
    saveTasks([...existing, ...parsedTasks]);
    setShowReview(false);
    setParsedTasks([]);
    setOcrText('');
    setSpeechText('');
    setCapturedImage(null);
    setTextFallback('');
    onTasksSaved();
  };

  const applyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setOcrText(preset.ocr);
    setSpeechText(preset.speech);
    setCapturedImage(null);
    setTextFallback('');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ─── REVIEW SCREEN ───
  if (showReview) {
    return (
      <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 animate-fade-in text-calm-text">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-pastel/30">
          <button
            onClick={() => setShowReview(false)}
            className="flex items-center gap-2 text-sm font-semibold text-purple hover:text-purple-deep px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-purple-pastel/40 shadow-sm transition-all active:scale-95"
          >
            ← Modify Input
          </button>
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-display font-extrabold text-calm-text">Review & Organize</h2>
            <p className="text-xs text-calm-muted">Parsed seamlessly from image + voice</p>
          </div>
          <div className="text-xs text-white bg-gradient-to-r from-purple to-yellow px-3 py-1 rounded-full font-bold zen-glow-purple shadow-sm">
            {parsedTasks.length} {parsedTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        {/* AI Interpretation Banner */}
        <div className="my-4 p-4 rounded-2xl glass-card-active border border-yellow-light/80 flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center text-xl flex-shrink-0 border border-purple-pastel/30">
            🧠
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-yellow-warm flex items-center gap-1.5">
              <span>ShowSay AI Understanding</span>
            </p>
            <p className="text-sm text-calm-text font-medium mt-1 leading-relaxed">{summary}</p>
          </div>
        </div>

        {/* Task cards grid/list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
          {parsedTasks.map((task, idx) => (
            <div
              key={task.id}
              className="glass-card rounded-2xl p-4 border border-purple-pastel/35 hover:border-purple/50 transition-all shadow-sm group"
            >
              <div className="flex items-start justify-between gap-3">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask(idx, 'title', e.target.value)}
                  className="flex-1 bg-transparent text-sm md:text-base font-bold text-calm-text outline-none border-b border-purple-pastel/20 focus:border-purple py-1 transition-colors"
                  placeholder="Task title..."
                />
                <button
                  onClick={() => removeTask(idx)}
                  className="text-calm-muted hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors text-lg opacity-60 group-hover:opacity-100"
                  title="Remove task"
                >
                  ✕
                </button>
              </div>

              {/* Task Meta Attributes */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                {/* Due Date */}
                <div className="flex items-center gap-1.5 bg-purple-soft/60 px-2.5 py-1 rounded-xl border border-purple-pastel/40">
                  <span className="text-yellow-warm">📅</span>
                  <input
                    type="date"
                    value={task.dueDate}
                    onChange={(e) => updateTask(idx, 'dueDate', e.target.value)}
                    className="bg-transparent text-xs text-calm-text font-semibold outline-none cursor-pointer"
                  />
                </div>

                {/* Due Time */}
                {task.dueTime && (
                  <div className="flex items-center gap-1.5 bg-yellow-soft/80 px-2.5 py-1 rounded-xl border border-yellow-light">
                    <span className="text-yellow-warm">⏰</span>
                    <input
                      type="time"
                      value={task.dueTime}
                      onChange={(e) => updateTask(idx, 'dueTime', e.target.value)}
                      className="bg-transparent text-xs text-calm-text font-semibold outline-none cursor-pointer"
                    />
                  </div>
                )}

                {/* Person */}
                {task.person && (
                  <div className="flex items-center gap-1.5 bg-purple-soft px-2.5 py-1 rounded-xl text-purple font-bold border border-purple-pastel/50">
                    <span>👤</span>
                    <span>{task.person}</span>
                  </div>
                )}

                {/* Priority Selector */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {(['high', 'medium', 'low'] as const).map((p) => {
                    const isSelected = task.priority === p;
                    const colors = {
                      high: isSelected ? 'bg-yellow-soft text-yellow-warm border-yellow font-bold shadow-xs' : 'text-calm-muted hover:text-calm-text',
                      medium: isSelected ? 'bg-purple-soft text-purple border-purple-pastel font-bold shadow-xs' : 'text-calm-muted hover:text-calm-text',
                      low: isSelected ? 'bg-calm-elevated text-calm-text border-calm-border font-bold' : 'text-calm-muted hover:text-calm-text',
                    };
                    return (
                      <button
                        key={p}
                        onClick={() => updateTask(idx, 'priority', p)}
                        className={`text-[10px] uppercase px-2.5 py-0.5 rounded-lg border border-transparent transition-all ${colors[p]}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-purple-pastel/30">
          <button
            onClick={handleSave}
            disabled={parsedTasks.length === 0}
            className="w-full py-4 bg-gradient-to-r from-purple via-purple-deep to-yellow hover:brightness-105 text-white font-extrabold rounded-2xl text-base zen-glow-purple active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg"
          >
            Save {parsedTasks.length} {parsedTasks.length === 1 ? 'Task' : 'Tasks'} to Today
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN CAPTURE SCREEN ───
  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 text-calm-text">
      {/* Top Title Banner */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-purple-pastel/25">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-extrabold text-calm-text tracking-tight">
            Show it. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple to-yellow-warm">Say it.</span>
          </h1>
          <p className="text-xs text-calm-muted font-medium">Turn visual items & spoken instructions into peaceful action</p>
        </div>

        {/* Demo Preset Selector */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[10px] text-calm-muted font-bold uppercase tracking-wider">Presets:</span>
          {DEMO_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/80 hover:bg-yellow-soft/80 text-calm-muted hover:text-calm-text border border-purple-pastel/30 hover:border-yellow-light transition-all font-semibold shadow-xs hover:scale-102"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Content Area: 2-Columns on Desktop/Laptop, Stacked on Mobile */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          
          {/* ─── Column 1: Visual Capture (Camera / Image / Text) ─── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-calm-text flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-purple-soft text-purple flex items-center justify-center text-xs">📸</span>
                1. Show It (Visual OCR)
              </span>
              {capturedImage && (
                <button
                  onClick={() => { setCapturedImage(null); setOcrText(''); }}
                  className="text-[11px] text-yellow-warm hover:underline font-bold"
                >
                  Clear Photo
                </button>
              )}
            </div>

            {/* Camera Viewfinder or Image Upload Dropzone */}
            {isCameraOpen ? (
              <div className="relative rounded-3xl overflow-hidden border-2 border-purple bg-black aspect-video max-h-56 shadow-xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="w-14 h-14 rounded-full bg-white border-4 border-yellow shadow-2xl active:scale-90 transition-transform"
                    title="Take Snapshot"
                  />
                  <button
                    onClick={closeCamera}
                    className="w-10 h-10 rounded-full bg-black/70 text-white font-bold text-lg flex items-center justify-center border border-white/20"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : capturedImage ? (
              <div className="relative rounded-3xl overflow-hidden border border-purple-pastel/40 aspect-video max-h-48 bg-black shadow-md">
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                {isProcessingOcr && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold text-calm-text">Reading text with OCR…</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  onClick={openCamera}
                  className="flex-1 h-36 rounded-3xl border-2 border-dashed border-purple-pastel hover:border-purple bg-white/70 hover:bg-white backdrop-blur-md flex flex-col items-center justify-center gap-2 transition-all group active:scale-[0.99] shadow-xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-soft to-purple-pastel/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs text-purple">
                    📷
                  </div>
                  <span className="text-xs font-bold text-calm-text">Open Camera</span>
                  <span className="text-[10px] text-calm-muted">Capture physical notes</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-36 rounded-3xl border-2 border-dashed border-yellow-light/80 hover:border-yellow-warm bg-white/70 hover:bg-yellow-soft/50 backdrop-blur-md flex flex-col items-center justify-center gap-2 transition-all group active:scale-[0.99] shadow-xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-soft to-yellow-pastel/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs text-yellow-warm">
                    📁
                  </div>
                  <span className="text-xs font-bold text-calm-text">Upload Photo</span>
                  <span className="text-[10px] text-calm-muted">JPG, PNG, Screenshot</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* OCR Extracted Text Box */}
            <div className="mt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-calm-muted mb-1.5 flex items-center justify-between">
                <span>Extracted Text (or type manual tasks)</span>
                {ocrText && <span className="text-yellow-warm text-[10px] font-bold bg-yellow-soft px-2 py-0.5 rounded-full border border-yellow-light">✓ OCR active</span>}
              </label>
              <textarea
                value={ocrText || textFallback}
                onChange={(e) => {
                  if (ocrText) setOcrText(e.target.value);
                  else setTextFallback(e.target.value);
                }}
                placeholder="Split by line:&#10;buy groceries&#10;review presentation&#10;call Tabassum"
                rows={3}
                className="w-full glass-input text-sm text-calm-text p-3.5 rounded-2xl outline-none resize-none placeholder:text-calm-muted/50 font-mono shadow-sm"
              />
            </div>
          </div>

          {/* ─── Column 2: Spoken Instruction & Context ─── */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-calm-text flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-yellow-soft text-yellow-warm flex items-center justify-center text-xs">🗣️</span>
              2. Say It (Voice Instructions)
            </span>

            {/* Aesthetic Calming Microphone Card */}
            <div className="glass-card rounded-3xl p-5 border border-purple-pastel/30 flex flex-col items-center justify-center gap-3.5 min-h-[148px] relative overflow-hidden">
              <div className="flex items-center gap-4 w-full">
                
                {/* Breathing Ripple Microphone Orb */}
                <div className="relative flex items-center justify-center flex-shrink-0">
                  {isListening && (
                    <>
                      <div className="ripple-circle w-16 h-16" />
                      <div className="ripple-circle w-16 h-16" style={{ animationDelay: '0.6s' }} />
                    </>
                  )}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-95 flex-shrink-0 text-white z-10 ${
                      isListening
                        ? 'bg-gradient-to-r from-yellow-warm to-yellow zen-glow-yellow animate-pulse'
                        : 'bg-gradient-to-tr from-purple-deep via-purple to-yellow hover:scale-105 zen-glow-purple shadow-md'
                    }`}
                    title={isListening ? 'Click to stop listening' : 'Click to start voice recording'}
                  >
                    {isListening ? '⏹️' : '🎙️'}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-calm-text">
                      {isListening ? 'Listening to your voice…' : 'Spoken Guidance'}
                    </span>
                    {isListening && (
                      <div className="flex items-center gap-1">
                        <div className="sound-wave-bar" style={{ animationDelay: '0ms' }} />
                        <div className="sound-wave-bar" style={{ animationDelay: '200ms' }} />
                        <div className="sound-wave-bar" style={{ animationDelay: '400ms' }} />
                        <div className="sound-wave-bar" style={{ animationDelay: '100ms' }} />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-calm-muted mt-1 leading-snug">
                    Say e.g. <span className="text-purple font-semibold italic">"all due by Friday"</span> or <span className="text-yellow-warm font-semibold italic">"finish PR today high priority"</span>
                  </p>
                </div>
              </div>

              {/* Voice Transcript Field */}
              <div className="w-full mt-1">
                <input
                  type="text"
                  value={speechText}
                  onChange={(e) => setSpeechText(e.target.value)}
                  placeholder="Spoken words transcribe here, or type instructions…"
                  className="w-full glass-input text-xs text-calm-text px-3.5 py-2.5 rounded-xl outline-none placeholder:text-calm-muted/50 italic shadow-xs"
                />
              </div>
            </div>

            {/* Quick Voice Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-calm-muted font-bold uppercase">Quick Snippets:</span>
              {[
                'all due by Friday',
                'finish today high priority',
                'due tomorrow 10am',
                'assign to Tabassum',
              ].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => setSpeechText(phrase)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-white/80 hover:bg-yellow-soft text-calm-muted hover:text-calm-text border border-purple-pastel/30 hover:border-yellow-light transition-all font-medium shadow-xs"
                >
                  "{phrase}"
                </button>
              ))}
            </div>

            {/* Parse Action Button */}
            <div className="mt-auto pt-2">
              <button
                onClick={handleParse}
                disabled={!ocrText && !textFallback}
                className="w-full py-4 bg-gradient-to-r from-purple via-purple-deep to-yellow hover:brightness-105 text-white font-extrabold rounded-2xl text-base zen-glow-purple active:scale-[0.98] transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                <span className="text-yellow-pastel">✨</span>
                <span>Organize Tasks with AI Intelligence</span>
              </button>
              <p className="text-[10px] text-center text-calm-muted mt-1 font-medium">
                Combines visual text + spoken voice rules deterministically
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden canvas for snapshot raster */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
