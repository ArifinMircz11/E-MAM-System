import fs from 'node:fs';
import path from 'node:path';

interface PackageJson {
  scripts?: Record<string, string>;
}

function readPackageJson(): PackageJson {
  const packagePath = path.resolve('package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
}

function extractLocalScriptTargets(command: string): string[] {
  const targets: string[] = [];
  const regex = /(?:^|\s)(?:node|tsx)\s+((?:scripts|src|emam)\/[^\s;&|]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(command)) !== null) {
    targets.push(match[1].replace(/^['"]|['"]$/g, ''));
  }
  return targets;
}

export function runGovernanceAudit(): number {
  console.log('🔍 [Audit Governance] Checking audit/tool script integrity...');

  const pkg = readPackageJson();
  const scripts = pkg.scripts ?? {};
  const findings: string[] = [];

  for (const [name, command] of Object.entries(scripts)) {
    if (!name.startsWith('audit') && name !== 'doctor' && name !== 'verify' && name !== 'qa') {
      continue;
    }

    for (const target of extractLocalScriptTargets(command)) {
      if (!fs.existsSync(path.resolve(target))) {
        findings.push(`${name} -> missing target: ${target}`);
      }
    }
  }

  if (findings.length === 0) {
    console.log('✅ [Audit Governance] All referenced audit/tool targets exist.');
    return 0;
  }

  for (const finding of findings) {
    console.log(`🔴 [Audit Governance] ${finding}`);
  }

  console.log(`⚠️ [Audit Governance] ${findings.length} invalid tool references.`);
  return findings.length;
}
