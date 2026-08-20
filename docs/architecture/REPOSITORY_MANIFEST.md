# Repository Manifest

This manifest maps the entire project structure and classifies folders/files for evidence-based cleanup decisions.

## Root Directory Mapping

| Folder/File | Purpose | Status | Owner | Dependency | Recommendation | Reason |
| ----------- | ------- | ------ | ----- | ---------- | -------------- | ------ |
| `/src` | Main source code | SSOT | - | - | Keep | - |
| `/api` | API routes | Infrastructure | API | - | Keep | - |
| `/backup` | Historic documentation | Legacy | - | - | Archive | Move to docs/archive |
| `/docs` | Documentation | Documentation | - | - | Keep | - |
| `/scripts` | Automation tools | Tooling | - | - | Keep | Reorganize into subfolders |
| `/public` | Static assets | Infrastructure | - | - | Keep | - |
| `/node_modules`| Dependencies | Infrastructure | - | - | Keep | Managed by npm |
| `package.json` | Project configuration | SSOT | - | - | Keep | - |
| `.env.example` | Env template | Infrastructure | - | - | Keep | - |

# Repository Manifest

This manifest maps the entire project structure and classifies folders/files for evidence-based cleanup decisions.

## Column Definitions
- **Status**: SSOT, Infrastructure, Domain, Application, Feature, Shared, Tooling, Documentation, Archive, Experimental, Unknown.
- **Responsibility**: Short description of the folder's purpose.
- **SSOT**: Is this the Single Source of Truth? (Yes/No).
- **Owner**: Architectural owner (e.g., UI, Domain, Infrastructure).
- **Action**: Pertahankan, Migrasikan, Gabungkan, Arsipkan, Hapus.

## Src Directory Mapping

| Folder | Status | Responsibility | SSOT | Owner | Action |
| ------ | ------ | -------------- | ---- | ----- | ------ |
| `/src/app` | Application | Main App components | Yes | UI | Pertahankan |
| `/src/components` | Shared | Shared UI components | Yes | UI | Pertahankan |
| `/src/pages` | Feature | Page components | Yes | UI | Pertahankan |
| `/src/layouts` | Shared | Layout components | Yes | UI | Pertahankan |
| `/src/routes` | Infrastructure | Routing | Yes | UI | Pertahankan |
| `/src/core` | Infrastructure | Core Infrastructure | Yes | Infrastructure | Audit (P0) |
| `/src/services` | Application | App Services | Yes | Service | Audit (P1) |
| `/src/repositories`| Infrastructure | Data Access | Yes | Repository | Audit (P1) |
| `/src/hooks` | Shared | Shared Hooks | Yes | Hooks | Audit (P1) |
| `/src/stores` | Shared | State Management | Yes | Store | Audit (P1) |
| `/src/sync` | Infrastructure | Engine, Queue, Worker, Coordinator | Yes | Sync | Pertahankan |
| `/src/services/sync` | Domain | Business Use Case, User Sync | Yes | Sync | Pertahankan |
| `/src/core/sync` | Infrastructure | Contract, Metadata, Guard, Telemetry | Yes | Sync | Pertahankan |
| `/src/identity` | Domain | Identity & Auth | Yes | Identity | Audit (P1) |
| `/src/features` | Feature | Feature Modules | Yes | Feature | Audit (P2) |
| `/src/esaf` | Unknown | Legacy ESAF | No | - | Audit (P2) - Migration |
| `/src/entities` | Domain | Legacy Entities | No | - | Audit (P2) - Migration |
| `/src/data` | Unknown | Legacy Data | No | - | Audit (P2) - Migration |
| `/src/modules` | Domain | Modular Features | No | - | Audit (P2) - Migration |
| `/src/infrastructure`| Infrastructure | Infrastructure | Yes | Infrastructure | Audit (P1) |
