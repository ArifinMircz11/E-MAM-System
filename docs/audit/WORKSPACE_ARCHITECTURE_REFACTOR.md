# WORKSPACE_ARCHITECTURE_REFACTOR.md

## 1. Audit Summary
The e-MAM System enterprise workspace navigation architecture was thoroughly audited and refactored to enforce strict separation of concerns, workspace boundary isolation, and modular registry ownership in accordance with the IMAM System Enterprise Development Rules (AGENTS.md & GEMINI.md). 
Prior to refactoring, navigation definitions and sidebar rendering were tightly coupled across global components and route renderers, risking architecture drift and feature leakage. The refactor establishes dedicated navigation registries and standalone workspace shells for Developer, Kanwil, Kemenag, and Madrasah domains.

## 2. Architecture Before
- **Global Coupling**: `Sidebar.tsx` and `featureNavigation.ts` directly mixed global items and workspace-specific modules.
- **Direct View Mapping**: Views were hardcoded inside monolithic switch statements within `ViewRenderer.tsx` and `App.tsx`.
- **Navigation Ownership**: No centralized `moduleRegistry` or workspace-specific `WorkspaceNavigationRegistry` structures existed.

## 3. Architecture After
Following the Enterprise Architecture Constitution:
```
ApplicationShell
        │
        ▼
SecurityContext
        │
        ▼
PermissionResolver
        │
        ▼
ModuleRegistry
        │
        ▼
WorkspaceResolver
        │
        ▼
WorkspaceRenderer
        │
 ┌──────┼─────────────┬─────────────┐
 ▼      ▼             ▼             ▼
Developer   Kanwil   Kemenag   Madrasah
Workspace   Workspace Workspace Workspace
```
Each workspace now encapsulates its own Navbar, Sidebar, Content, ModalHost, NotificationHost, and Providers, powered by dedicated navigation registries (`developerNavigationRegistry`, `kanwilNavigationRegistry`, `kemenagNavigationRegistry`, `madrasahNavigationRegistry`).

## 4. Files Changed
- `/src/navigation/types.ts`
- `/src/navigation/moduleRegistry.ts`
- `/src/navigation/registries/developerNavigationRegistry.ts`
- `/src/navigation/registries/kanwilNavigationRegistry.ts`
- `/src/navigation/registries/kemenagNavigationRegistry.ts`
- `/src/navigation/registries/madrasahNavigationRegistry.ts`
- `/src/features/kanwil/KanwilWorkspace.tsx`
- `/src/features/kanwil/components/KanwilNavbar.tsx`
- `/src/features/kanwil/components/KanwilSidebar.tsx`
- `/src/app/App.tsx`
- `/src/routes/ViewRenderer.tsx`

## 5. Boundary Validation
- **Workspace Isolation**: Standalone workspaces are correctly identified by `isStandaloneWorkspace` and rendered via dedicated layout components (`KanwilWorkspace`, etc.), ensuring zero feature leakage into standard student/teacher views.
- **Permission Enforcement**: Navigation groups and items are filtered dynamically through `getItemsForRole(role)` and `PermissionResolver`.

## 6. Navigation Ownership
- `moduleRegistry`: Manages top-level workspace selection and permissions.
- Workspace Navigation Registries: Manage grouped sub-navigation items specifically tailored to each institutional tier (Developer, Kanwil, Kemenag, Madrasah).

## 7. Workspace Ownership
- Each workspace tier owns its dedicated Navbar and Sidebar components, adhering strictly to the Single Responsibility Principle.
- No UI components or hooks query Firestore directly outside the approved Sync Engine / Repository layers.

## 8. Quality Gate Result
- **Lint**: PASSED
- **TypeCheck**: PASSED
- **Build**: PASSED (`dist/server.cjs` bundled successfully)

## 9. Build Result
Production bundle generated cleanly with Vite and esbuild without errors.
