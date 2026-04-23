// Verifies every `inputs:` declaration in every moon task still
// resolves. Moon silently tolerates globs that match nothing and
// literal files that don't exist — a rename elsewhere in the repo
// can orphan a glob and break affected-task detection without
// anyone noticing. Fails CI with a readable report when that
// happens.

import { existsSync, globSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

interface MoonInput {
  file?: string;
  glob?: string;
  optional?: boolean;
}

interface MoonTask {
  inputs?: MoonInput[];
}

interface Issue {
  target: string;
  kind: 'missing file' | 'empty glob';
  value: string;
}

const query = <T>(cmd: string): T =>
  JSON.parse(execSync(`moon query ${cmd} --json`, { encoding: 'utf8' })) as T;

const projectsResult = query<{
  projects: Array<{ id: string; source: string }>;
}>('projects');
const tasksResult = query<{ tasks: Record<string, Record<string, MoonTask>> }>(
  'tasks',
);

const projectSources = Object.fromEntries(
  projectsResult.projects.map(({ id, source }) => [id, source]),
);

const resolveToWorkspace = (projectSource: string, raw: string): string => {
  if (raw.startsWith('/')) return raw.slice(1);
  if (projectSource === '.') return raw;
  return path.posix.join(projectSource, raw);
};

const issues: Issue[] = [];
for (const [project, tasks] of Object.entries(tasksResult.tasks)) {
  const source = projectSources[project];
  for (const [taskId, task] of Object.entries(tasks)) {
    for (const input of task.inputs ?? []) {
      if (input.optional) continue;
      const target = `${project}:${taskId}`;

      if (input.file) {
        const rel = resolveToWorkspace(source, input.file);
        if (!existsSync(rel)) {
          issues.push({ target, kind: 'missing file', value: input.file });
        }
      }

      if (input.glob) {
        const rel = resolveToWorkspace(source, input.glob);
        if (globSync(rel).length === 0) {
          issues.push({ target, kind: 'empty glob', value: input.glob });
        }
      }
    }
  }
}

if (issues.length === 0) {
  console.log('All moon task inputs resolve.');
  process.exit(0);
}

console.error(`Found ${issues.length} stale moon input(s):\n`);
for (const { target, kind, value } of issues) {
  console.error(`  ${target}  [${kind}]  ${value}`);
}
console.error(
  '\nFix: update the task `inputs:` declaration, or mark the entry ' +
    '`{ ..., optional: true }` if its absence is expected.',
);
process.exit(1);
