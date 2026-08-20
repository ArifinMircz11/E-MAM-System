# ESAF v1.0 — Enterprise System Architecture Framework Specification

## 1. Overview
ESAF (Enterprise System Architecture Framework / Enterprise Static Analysis Framework) is the core governance, static analysis, and automated remediation engine for e-Mam System. ESAF treats architectural compliance as code, analyzing AST (Abstract Syntax Trees), imports, layers, and dependency graphs to ensure zero architectural drift, zero offline violations, and strict Firestore cost efficiency.

---

## 2. Core Architecture Contracts

### 2.1 Rule Contract
Every rule must implement the standard `ESAFRule` interface:
```typescript
export interface ESAFRule {
  id: string; // e.g., ARCH-001, OFFLINE-001
  name: string;
  category: 'architecture' | 'dependency' | 'offline' | 'repository' | 'service' | 'hook' | 'store' | 'sync' | 'security' | 'performance' | 'testing' | 'build' | 'adr';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  description: string;
  analyze(context: ESAFContext): Promise<ESAFEvidence[]> | ESAFEvidence[];
}
```

### 2.2 Evidence Contract
Every violation detected by a rule must produce standardized evidence:
```typescript
export interface ESAFEvidence {
  ruleId: string;
  filePath: string;
  line: number;
  column: number;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  evidence: string; // Code snippet or exact AST violation detail
  recommendation: string; // Step-by-step fix instruction
}
```

### 2.3 Severity & Scoring Contract
Severity weights for P0-P3 calculation:
- **CRITICAL (P0)**: Weight = 10 (Blocks build & deployment)
- **ERROR (P1)**: Weight = 5 (Blocks CI/CD merge)
- **WARNING (P2)**: Weight = 2 (Logged as technical debt)
- **INFO (P3)**: Weight = 1 (Advisory note)

**Score Formula**:
$$\text{Score} = \max\left(0, 100 - \sum (\text{weight} \times \text{violationCount})\right)$$

### 2.4 WO (Work Order) Contract
Critical and Error violations automatically generate structured Work Orders:
```typescript
export interface WorkOrder {
  woId: string; // e.g., WO-ARCH-001
  title: string;
  targetRule: string;
  severity: string;
  affectedFiles: string[];
  objective: string;
  steps: string[];
  acceptanceCriteria: string[];
}
```

### 2.5 Report Contract
Reports output standardized JSON and Markdown summaries containing:
- Summary counts (Total violations, P0-P3 breakdown)
- Overall Architecture Score (0-100)
- Detailed violations per file
- Generated Work Orders
- Trend history tracking
