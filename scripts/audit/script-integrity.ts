import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SCRIPTS = path.join(ROOT, 'scripts');
const PACKAGE = path.join(ROOT, 'package.json');

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs|ps1|sh)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function localTargets(command: string): string[] {
  const targets: string[] = [];
  const regex = /(?:^|\s)(?:node|tsx)\s+((?:scripts|src|emam)\/[^\s;&|]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(command)) !== null) {
    targets.push(match[1].replace(/^['"]|['"]$/g, ''));
  }
  return targets;
}

export function runScriptIntegrityAudit(): number {
  console.log('🔎 [Audit Script Integrity] Checking repository scripts and package entrypoints...');
  const findings: string[] = [];

  if (!fs.existsSync(PACKAGE)) {
    console.error('❌ [Audit Script Integrity] package.json not found.');
    return 1;
  }

  const pkg = JSON.parse(fs.readFileSync(PACKAGE, 'utf8')) as { scripts?: Record<string, string> };
  for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
    for (const target of localTargets(command)) {
      if (!fs.existsSync(path.resolve(target))) findings.push(`${name} -> missing target: ${target}`);
    }
  }

  const scriptFiles = walk(SCRIPTS);
  for (const file of scriptFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (/<<<<<<<|=======|>>>>>>>/.test(content)) {
      findings.push(`${rel(file)} -> unresolved merge conflict markers`);
    }
    if (/^\s*throw new Error\(['"]TODO|^\s*throw new Error\(['"]NOT IMPLEMENTED/i.test(content)) {
      findings.push(`${rel(file)} -> explicit TODO/not-implemented throw`);
    }
  }

  if (findings.length === 0) {
    console.log(`✅ [Audit Script Integrity] ${scriptFiles.length} script files checked; no blocking findings.`);
    return 0;
  }

  for (const finding of findings) console.log(`❌ [Audit Script Integrity] ${finding}`);
  console.log(`🛑 [Audit Script Integrity] ${findings.length} finding(s).`);
  return findings.length;
}

if (process.argv[1]?.endsWith('script-integrity.ts')) {
  process.exitCode = runScriptIntegrityAudit() === 0 ? 0 : 1;
}
