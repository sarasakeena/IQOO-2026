# 📸 ShowSay — Show it. Say it. Done.

> **Calm, Multimodal Productivity Web App Prototype for Hackathon 2026 (Productivity Track)**  
> Capture tasks from physical photos and spoken context simultaneously. Plan mindfully. Stay in deep flow.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![OCR Engine](https://img.shields.io/badge/OCR-Tesseract.js-blue)](https://github.com/naptha/tesseract.js)

---

## 🌸 Overview

Traditional task management apps require tedious manual typing, drop-down clicking, and date picking. **ShowSay** transforms task capture into a frictionless, calming 5-second ritual:
1. **Show It**: Point your camera at a whiteboard, sticky note, document, or grocery receipt (or upload an image).
2. **Say It**: Speak your context naturally (e.g. *"finish all of these by Friday, call Tabassum today high priority"*).
3. **Done**: ShowSay's deterministic rule engine merges OCR text with spoken directives, resolves dates/times/assignees, and organizes your day intelligently.

---

## ✨ Key Features & Tabs

### 1. 📸 Capture Tab (Multimodal Task Ingestion)
- **Live Camera & Photo Upload**: Real-time viewfinder with environment/rear lens auto-detection, canvas raster snapshotting, and drag-and-drop file upload.
- **Client-Side OCR**: Uses **Tesseract.js** to extract task line items directly inside the browser with zero cloud server dependencies.
- **Voice Context Recording**: Uses the browser's **Web Speech API** (`SpeechRecognition`) with an animated concentric ripple visualizer, sound wave equalizer bars, and manual text fallback.
- **1-Click Demo Presets**: Includes instant demo presets (*"🌸 Mindful Standup"*, *"✨ Daily Flow"*, *"🚀 Creative Sprint"*) for reliable live presentations without camera/mic permissions friction.
- **Review & Confirm Screen**: Displays ShowSay's AI interpretation banner, editable task title inputs, interactive date/time pickers, assignee tags, and priority toggles.

### 2. 📋 Today Tab (Mindful Task Prioritization)
- **Calm Prioritization**: Sorts tasks deterministically by urgency: High (`🔥`) → Medium (`⚡`) → Gentle (`🌱`), followed by scheduled due time.
- **Real-Time Progress**: Flow completion progress bar and quick metric counters (Completed, High Focus, Daily Pace).
- **Interactive Task Cards**: Tactile check rings with celebratory animation, inline editing, and quick delete.
- **Filter Pills**: Filter tasks effortlessly by *All Tasks*, *In Flow*, *Finished*, or *🔥 High Focus*.
- **Intelligent Day Assistant**:
  - **Plan My Day**: Analyzes historical velocity and auto-reschedules tasks to match realistic completion capacity.
  - **End My Day**: Mindfully sweeps unfinished tasks to tomorrow and archives today's results into 7-day history.
- **7-Day Velocity Wave Chart**: Apple Health-inspired rounded capsule chart visualizing daily completed vs. planned tasks.

### 3. 🎯 Focus Tab (Face-Down Zen Timer)
- **25-Minute Deep Work Timer**: SVG circular countdown ring featuring a soothing dual-tone gradient stroke with ambient breathing aura.
- **Face-Down Detection**: Listens to the **DeviceOrientation API** (`beta` & `gamma` angles) to automatically trigger deep focus mode when your phone rests face-down on a desk.
- **Distraction Defense**: Detects phone pickups and browser tab switching (`visibilitychange`), triggering a full-screen **Mindful Pause Shield** with vibration haptic alerts and interruption counting.
- **Presentation Simulator**: Integrated developer buttons (`📱↓ Flip Face-Down` & `📱↑ Pick Up Phone`) to demonstrate gyroscope sensor reactions seamlessly on any laptop.

---

## 🎨 Aesthetic Design System

ShowSay is designed with a **calming, aesthetic pastel palette** inspired by modern wellness and productivity tools (*Calm, Amie, Apple Health*):
- **Background**: Soft light lavender-to-white ambient gradient (`#F5EEFE` → `#FAF7FE` → `#FFFFFF`) with floating background aura orbs.
- **Accents**: Calming iris purple (`#7C3AED` / `#8B5CF6`) and warm chamomile butter yellow (`#F59E0B` / `#FEF3C7`).
- **Typography**: Humanist geometric typography powered by **Plus Jakarta Sans** and **Outfit** from Google Fonts.
- **Depth & Surfaces**: Frosted glassmorphism (`backdrop-blur-2xl bg-white/85`), soft multi-layered diffused shadows, and rounded squircle cards.

### 💻📱 Responsive Multi-Device Modes
- **💻 Laptop Studio Mode**: Expands into a spacious responsive dashboard (`max-w-5xl`) with desktop top navigation, live status clock, and keyboard shortcuts (`[1]` Capture, `[2]` Today, `[3]` Focus).
- **📱 Phone Mockup Mode**: Renders an authentic **390px iPhone-style device frame** with dynamic island notch, camera sensor, 5G status bar, and home indicator — perfect for projecting mobile demos to hackathon judges.
- **📱 Real Mobile Devices**: Full-bleed edge-to-edge native mobile app feel with bottom navigation bar and safe-area padding.

---

## 🧠 Deterministic Parser Specifications

ShowSay uses a fast, deterministic, pure-function rule parser (`src/parser.ts`):
1. **OCR Line Splitting**: Splits OCR text by newline characters, trims noise, and filters out empty lines.
2. **Relative Date Resolution**: Recognizes terms like `"today"`, `"tomorrow"`, and weekday names (`"monday"`, `"friday"`, etc.) and resolves them to exact ISO `YYYY-MM-DD` dates.
3. **Time Parsing**: Extracts explicit times like `"5pm"`, `"14:00"`, `"10:30am"` and normalizes to 24-hour `HH:mm` format.
4. **Assignee Extraction**: Identifies patterns like `"call Tabassum"`, `"email Priya"`, or `"assign to Alex"` and tags the assignee.
5. **Priority Inference**:
   - Spoken words like *"urgent"*, *"high priority"*, *"asap"* elevate tasks to `high`.
   - Normal items default to `medium` or `low`.

---

## 🛠️ Tech Stack & Architecture

| Technology | Purpose |
| :--- | :--- |
| **React 18** | Declarative Component Architecture & State Management |
| **Vite 6** | Ultra-fast HMR Dev Server & Production Bundler |
| **TypeScript** | Strict End-to-End Type Safety |
| **Tailwind CSS 3.4** | Custom Design System & Responsive Utilities |
| **Tesseract.js** | Client-Side Optical Character Recognition (OCR) |
| **Web Speech API** | Native Browser Speech-to-Text Recognition |
| **DeviceOrientation API** | Gyroscope & Physical Face-Down Detection |
| **LocalStorage** | Offline-First, Zero-Backend Persistent Storage |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or pnpm

### Installation & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/ShowSay.git
cd ShowSay

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Production Build

```bash
# Run TypeScript type check & build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📋 Hackathon Demo Script (3-Minute Walkthrough)

1. **Introduction (30s)**:
   - Show the tagline: *"Show it. Say it. Done."*
   - Mention the problem: Manual task entry has too much friction.
2. **Capture Demo (60s)**:
   - Click the preset *"🌸 Mindful Standup"*.
   - Point out OCR text + voice instruction (`"finish PR and call Tabassum today high priority"`).
   - Click **✨ Organize Tasks with AI Intelligence**.
   - Show the review screen: Note that *"call Tabassum"* has person assigned, priority is set to High, and date is resolved to today. Click **Save Tasks**.
3. **Today Screen & Intelligence (45s)**:
   - View prioritized list in Today tab. Toggle completion rings.
   - Click **Plan My Day** or **End My Day** to reveal ShowSay's capacity explanation and 7-day velocity chart.
4. **Focus Screen & Sensor (45s)**:
   - Switch to Focus tab. Click **Begin Zen Focus**.
   - In the presentation simulator, click **📱↓ Flip Face-Down** (shows active state), then click **📱↑ Pick Up Phone** to trigger the **Mindful Pause Shield** with distraction detection!

---

## 📄 License

MIT License. Created for Hackathon 2026.
