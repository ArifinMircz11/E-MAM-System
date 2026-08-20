# e-MAM Developer Console Architecture (v7.7 Standard)

## Architectural Blueprint
The `src/features/developer` module strictly follows the 5-Layer Enterprise Architecture:

```
Presentation (UI Components)
  ↓
Hooks (Orchestration & State Binding)
  ↓
Services (Domain Use Cases & Operations)
  ↓
Repositories (Dexie Local Persistence / API Gateways)
```

## Directory Structure

```
src/features/developer/
├── index.ts                     # Module Entry Point
├── DeveloperConsole.tsx         # Root Orchestration Component (Pure Layout & Tab Resolver)
├── components/                  # UI Presentation Components
│   ├── header/                  # Console Top Bar & Header
│   ├── sidebar/                 # Left Navigation Sidebar
│   ├── tabs/                    # Feature & Control Tabs
│   ├── impersonation/           # Impersonation Controls & Banners
│   ├── organization/            # Organization & Madrasah Management
│   ├── tenant/                  # Multi-Tenant Controls
│   ├── iam/                     # Identity & Access Management
│   ├── monitoring/              # System Health & Monitoring Cards
│   ├── logs/                    # Audit & System Log Panels
│   └── shared/                  # Common Modals, Toolbars & Tables
├── hooks/                       # Custom Hooks (Layer 2)
│   ├── useDeveloperConsole.ts
│   ├── useDeveloperNavigation.ts
│   ├── useImpersonation.ts
│   └── useDeveloperTabs.ts
├── services/                    # Domain Services (Layer 3)
│   ├── DeveloperConsoleService.ts
│   ├── ImpersonationService.ts
│   ├── NavigationService.ts
│   └── SessionService.ts
├── stores/                      # Zustand Stores
│   ├── developerConsoleStore.ts
│   ├── impersonationStore.ts
│   └── navigationStore.ts
├── types/                       # TypeScript Definitions
│   ├── DeveloperConsole.ts
│   ├── DeveloperTab.ts
│   ├── Impersonation.ts
│   └── Navigation.ts
├── constants/                   # Menus, Tabs & Permission Constants
│   ├── tabs.ts
│   ├── menus.ts
│   └── permissions.ts
└── utils/                       # Pure Utility & Mapper Functions
    ├── menuMapper.ts
    └── permissionMapper.ts
```

## Compliance Rules
1. **Strict Layer Boundary**: UI components NEVER call Firestore, Dexie, or Sync Engine directly.
2. **Deterministic Orchestration**: `DeveloperConsole.tsx` handles only Layout, Lazy Resolution, Suspense, and Tab Routing.
3. **No Duplicate Code**: All interfaces and constants are centralized in `types/` and `constants/`.
