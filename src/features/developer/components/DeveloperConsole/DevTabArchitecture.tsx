import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  CpuChipIcon,
  Squares2x2Icon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  SaveIcon,
  CommandLineIcon,
} from '@/shared/Icons';

export const DevTabArchitecture: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'blueprint' | 'dev_dashboard' | 'tenant_console' | 'sidebar'
  >('blueprint');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Mermaid diagram copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const diagrams = {
    blueprint: {
      title: 'Arsitektur e-Mam (Offline First & Sync Engine)',
      description:
        'Diagram arsitektur inti e-Mam System menggambarkan aliran data offline-first yang ketat: UI hanya berinteraksi dengan IndexedDB (Dexie) melalui Repository Layer, sedangkan Firestore hanya diakses dan dikelola secara eksklusif oleh Sync Engine.',
      textRepresentation: `
┌────────────────────────────────────────────────────────────────────────────┐
│                         e-Mam SYSTEM ENTERPRISE BLUEPRINT                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│       UI COMPONENTS (Pure Presentation: Form, Render, Event)               │
│                            │                                               │
│                            ▼                                               │
│       HOOK LAYER (Orchestration, State, Loading, Subscriptions)            │
│                            │                                               │
│                            ▼                                               │
│       SERVICE LAYER (Business Logic, Validation, RBAC, Decisions)          │
│                            │                                               │
│                            ▼                                               │
│       REPOSITORY LAYER (Abstraction: Dexie Only Access, Mapping)           │
│                            │                                               │
│                            ▼                                               │
│       IndexedDB (Dexie Operational DB - Reads, Queries, Dashboard)         │
│                            │                                               │
│                            ▼                                               │
│       SYNC QUEUE (Local FIFO Queue in Dexie - Offline Mutation Log)        │
│                            │                                               │
│                            ▼                                               │
│       SYNC ENGINE (Single Source of Cloud I/O - Conflict Resolver)         │
│                            │                                               │
│                            ▼                                               │
│       FIRESTORE CLOUD DATABASE (Source of Truth, Delta Sync Backup)         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
            `,
      mermaid: `graph TD
    UI[UI Components] -->|Render & Event| Hook[Hook Layer]
    Hook -->|Orchestrate| Service[Service Layer]
    Service -->|Business Logic| Repo[Repository Layer]
    Repo -->|Local Read/Write| Dexie[(IndexedDB - Dexie)]
    Repo -->|Queue Change| Queue[Sync Queue - Dexie]
    Queue -->|Process FIFO| SyncEngine[Sync Engine]
    SyncEngine -->|Only Firestore I/O| Firestore[(Firestore Cloud)]
    
    style UI fill:#38bdf8,stroke:#0369a1,stroke-width:2px,color:#0f172a
    style Hook fill:#818cf8,stroke:#4338ca,stroke-width:2px,color:#fff
    style Service fill:#a78bfa,stroke:#6d28d9,stroke-width:2px,color:#fff
    style Repo fill:#c084fc,stroke:#7e22ce,stroke-width:2px,color:#fff
    style Dexie fill:#34d399,stroke:#047857,stroke-width:2px,color:#0f172a
    style Queue fill:#fbcfe8,stroke:#be185d,stroke-width:2px,color:#0f172a
    style SyncEngine fill:#fbbf24,stroke:#b45309,stroke-width:2px,color:#0f172a
    style Firestore fill:#f87171,stroke:#b91c1c,stroke-width:2px,color:#fff`,
    },
    dev_dashboard: {
      title: 'Dashboard Developer Console (Miro Reference)',
      description:
        'Tata letak fungsional dan visual kernel monitoring Developer Console. Digunakan oleh developer sistem untuk melacak sinkronisasi data, mengelola toggles fitur global, mengaudit skema multi-tenant, dan melakukan perbaikan database (Self-Healing).',
      textRepresentation: `
┌────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPER DASHBOARD (Miro Map)                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Header] e-Mam System Console v8.0.5     [Kernel Status: Connected]        │
│                                                                            │
│  ┌──────────────────────────┐ ┌──────────────────────────────────────────┐ │
│  │   Sidebar Navigation     │ │  Active Tab View Workspace               │ │
│  │  ──────────────────────  │ │  ────────────────────────────            │ │
│  │  - Broadcast System      │ │  - Metrics & Database Collections        │ │
│  │  - Feature Toggles & RBAC│ │  - Interactive Firestore Monitor         │ │
│  │  - Versioning & Migrations│ │  - Schema Exploration Table              │ │
│  │  - Schema & Data Explorer│ │  - WhatsApp Test & Logs Integrations      │ │
│  │  - Multi-Tenant Isolation│ │  - User Impersonation Center             │ │
│  │  - QR & Sync Audit Panel │ │  - Local DB Self-Healing Actions        │ │
│  │  - Firestore Gov Center  │ │                                          │ │
│  └──────────────────────────┘ └──────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
            `,
      mermaid: `graph LR
    Dev[Developer Core] --> Auth{Developer Access Check}
    Auth -->|Denied| AccessDenied[Access Denied View]
    Auth -->|Allowed| DevConsole[Developer Console Workspace]
    
    subgraph Tabs [Console Modules]
        DevConsole --> Broadcast[Broadcast System Alerts]
        DevConsole --> FeatureLocks[Feature Locks & RBAC Matrix]
        DevConsole --> Migrations[Master Version & Schema Migrations]
        DevConsole --> SchemaExplorer[IndexedDB Browser & Firestore stats]
        DevConsole --> Tenants[Global Tenant Configurations]
        DevConsole --> Diagnostics[QR, Points & Sync Audit Logs]
        DevConsole --> SelfHealing[Local Database Reset & Cache Rebuild]
    end`,
    },
    tenant_console: {
      title: 'Tenant Madrasah Console Map',
      description:
        'Struktur isolasi tenant multi-madrasah pada tingkat database dan routing UI. Memastikan isolasi data yang ketat antara madrasah yang berbeda, di mana setiap operasi query ke Dexie dan Firestore secara default terikat secara deterministik oleh Tenant ID.',
      textRepresentation: `
┌────────────────────────────────────────────────────────────────────────────┐
│                        TENANT MADRASAH CONSOLE (Miro Map)                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     Active Madrasah Space Context                    │  │
│  │  Tenant ID: [MDR-001]                                                │  │
│  │  Madrasah: Madrasah Aliyah Al-Imam                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────┐ ┌───────────────────┐ ┌────────────────────┐  │
│  │   Academic Scope        │ │   Student Scope   │ │   Security & Auth  │  │
│  │  ─────────────────────  │ │  ───────────────  │ │  ─────────────────  │  │
│  │  - Year & Academic Term │ │  - Attendance Reg │ │  - Role-Based RBAC │  │
│  │  - Subjects & Rombel    │ │  - Point System   │ │  - Audit logging   │  │
│  │  - KBM Schedule & Rooms │ │  - Official Letter│ │  - Session token   │  │
│  └─────────────────────────┘ └───────────────────┘ └────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
            `,
      mermaid: `graph TD
    Client[Incoming Client Request] --> Guard{Tenant Resolver}
    Guard -->|Extract active tenantId| Match[Isolate Context]
    Match -->|Scope Dexie Queries| DBLoc[Dexie Index: tenantId+X]
    Match -->|Scope Sync SyncEngine| CloudSync[Firestore Query Filter: tenantId]
    
    subgraph Multi-Tenant Database Segregation
        DBLoc -->|Query| Student[students]
        DBLoc -->|Query| Teacher[teachers]
        DBLoc -->|Query| Class[classes]
        DBLoc -->|Query| Schedule[schedules]
    end`,
    },
    sidebar: {
      title: 'Sidebar Tenant Madrasah Hierarchy',
      description:
        'Skema navigasi dinamis madrasah yang menyesuaikan diri berdasarkan konfigurasi fitur terdaftar serta hak izin peran (RBAC) pengguna. Navigasi disusun secara hirarkis dari dasbor umum hingga modul manajerial khusus.',
      textRepresentation: `
┌─────────────────────────────────────────────────────────┐
│                  SIDEBAR TENANT MADRASAH                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Header] Logo Madrasah                                 │
│  [Header] Madrasah Aliyah Al-Imam                       │
│                                                         │
│  ── UTAMA (General Pages) ───────────────────────────── │
│  - Dashboard (Home & Live Metrics Overview)             │
│  - Kehadiran Hari Ini (Real-time Absensi List)          │
│                                                         │
│  ── KBM & AKADEMIK (Academic Domain) ────────────────── │
│  - Kelas & Rombongan Belajar                            │
│  - Jadwal KBM Mingguan                                  │
│  - Cetak Rapor & Kelulusan                              │
│                                                         │
│  ── MANAJEMEN SISWA (Student Operations) ────────────── │
│  - Registrasi & Pendaftaran                             │
│  - Kedisiplinan & Catatan Poin                          │
│  - Surat Keterangan / Izin                              │
│                                                         │
│  ── KERNEL & KONTROL (Admin Domain) ─────────────────── │
│  - Pengaturan Madrasah & Tenant                         │
│  - Konsol Developer                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
            `,
      mermaid: `graph TD
    Sidebar[Sidebar Generator] --> Access[Evaluate User Role & Active Features]
    Access -->|Build Navigation| GroupUtama[Utama Group]
    Access -->|Build Navigation| GroupAkademik[Akademik Group]
    Access -->|Build Navigation| GroupSiswa[Siswa Group]
    Access -->|Build Navigation| GroupAdmin[Admin Group]
    
    GroupUtama --> NavHome[Home Dashboard]
    GroupUtama --> NavToday[Today's Live Attendance]
    
    GroupAkademik --> NavClasses[Classes & Rombel]
    GroupAkademik --> NavSchedules[Weekly Schedules]
    GroupAkademik --> NavReports[Reports & Cards]
    
    GroupSiswa --> NavRegistration[Registration]
    GroupSiswa --> NavPoints[Disciplines & Points]
    GroupSiswa --> NavLetters[Letters & Requests]
    
    GroupAdmin --> NavSettings[Madrasah Config]
    GroupAdmin --> NavConsole[Developer Console]`,
    },
  };

  return (
    <div
      id="architecture-tab-workspace"
      className="flex flex-col h-full overflow-hidden bg-[#FAFBFF] dark:bg-[#030712] font-sans"
    >
      {/* Upper Info Banner */}
      <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900/40 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/10">
              <CpuChipIcon className="w-3.5 h-3.5" /> Core Architecture Standards
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight uppercase">
              Architecture Reference Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Standardisasi desain enterprise offline-first, isolasi multi-tenant, serta diagram
              alir kernel e-Mam System.
            </p>
          </div>
        </div>
      </div>

      {/* Inner Tabs Navigation */}
      <div className="px-4 md:px-6 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/20 flex gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection('blueprint')}
          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all shrink-0 flex items-center gap-2 ${activeSection === 'blueprint' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}
        >
          <CpuChipIcon className="w-4 h-4" /> e-Mam Core Blueprint
        </button>
        <button
          onClick={() => setActiveSection('dev_dashboard')}
          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all shrink-0 flex items-center gap-2 ${activeSection === 'dev_dashboard' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}
        >
          <Squares2x2Icon className="w-4 h-4" /> Developer Dashboard Console
        </button>
        <button
          onClick={() => setActiveSection('tenant_console')}
          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all shrink-0 flex items-center gap-2 ${activeSection === 'tenant_console' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}
        >
          <ShieldCheckIcon className="w-4 h-4" /> Tenant Madrasah Console
        </button>
        <button
          onClick={() => setActiveSection('sidebar')}
          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all shrink-0 flex items-center gap-2 ${activeSection === 'sidebar' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}
        >
          <ClipboardDocumentListIcon className="w-4 h-4" /> Sidebar Hierarchy
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* Active Tab Heading & Explanation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              {diagrams[activeSection].title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {diagrams[activeSection].description}
            </p>

            {/* Enterprise Principles Quick-Guides */}
            {activeSection === 'blueprint' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-sm mb-3">
                    1
                  </div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Offline-First Operational Cache
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Seluruh query Dashboard, List, Search, dan Filter WAJIB membaca langsung dari
                    IndexedDB (Dexie). Mengurangi Firebase read load hingga 70%+.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm mb-3">
                    2
                  </div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Isolasi Gerbang Sync Engine
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Firebase SDK dilarang diimpor di komponen/UI/Repository. Hanya Sync Engine yang
                    berhak melakukan write dan fetch Delta ke Cloud Firestore.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold text-sm mb-3">
                    3
                  </div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Deterministic ID & Sync Queue
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Seluruh mutasi data dicatat di local Sync Queue menggunakan ID deterministik
                    yang aman secara offline. Memproses queue secara berurutan saat jaringan pulih.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Layout: Visual Text Map & Code Copier side-by-side or stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Text Blueprint / Schematic Visualizer (Left side, larger) */}
            <div className="lg:col-span-7 bg-[#0b0f19] text-emerald-400 p-6 rounded-3xl border border-slate-800 shadow-xl overflow-x-auto font-mono text-[11px] md:text-xs leading-relaxed relative group select-all">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide">
                  Schematic View
                </span>
              </div>
              <pre className="whitespace-pre scrollbar-none font-mono">
                {diagrams[activeSection].textRepresentation.trim()}
              </pre>
            </div>

            {/* Mermaid Source Code and Instructions (Right side, smaller) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <CommandLineIcon className="w-5 h-5 text-indigo-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Mermaid.js Source Code
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopy(diagrams[activeSection].mermaid, activeSection)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-tight transition-all ${copiedId === activeSection ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                  >
                    <SaveIcon className="w-3.5 h-3.5" />
                    {copiedId === activeSection ? 'Copied!' : 'Copy Diagram'}
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-[#070b14] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 max-h-64 overflow-y-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                    {diagrams[activeSection].mermaid.trim()}
                  </pre>
                </div>

                <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3 items-start">
                  <span className="text-base text-indigo-500">💡</span>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-relaxed font-bold">
                    Developer can copy this Mermaid source to visualize in official live editor,
                    documentation files, or whiteboards like Miro and Mermaid Live Editor.
                  </p>
                </div>
              </div>

              {/* Standard Rules Checkcard */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                  Arsitektur Layer Terintegrasi
                </h4>
                <ul className="space-y-2.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <li className="flex gap-2.5 items-start">
                    <span className="text-cyan-500 font-bold">✓</span>
                    <span>
                      <strong>UI Components</strong>: Pure Presentation. Hanya menampilkan render
                      data yang diterima dari Hook, dilarang memicu query manual.
                    </span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="text-indigo-500 font-bold">✓</span>
                    <span>
                      <strong>Hooks</strong>: State Orchestration. Menghubungkan lifecycle component
                      dengan service layer secara reaktif.
                    </span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="text-purple-500 font-bold">✓</span>
                    <span>
                      <strong>Service Layer</strong>: Domain Logic. Pusat validasi, evaluasi RBAC,
                      audit log trigger, dan business decision.
                    </span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong>Repository Layer</strong>: Dexie Abstractor. Menghandle seluruh
                      operasi CRUD internal ke IndexedDB.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
