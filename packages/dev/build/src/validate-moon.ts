/**
 * CLI entry for the moon-input validator. Shells out to
 * `moon query` for live data, hands it to the pure checker in
 * `moon-input-check.ts`, prints a report, and sets the exit code.
 *
 * Registered as `@dev/build:validate-moon` in this package's
 * `moon.yml`. Not exposed as a package export — moon invokes it
 * directly via `node src/validate-moon.ts`.
 */

import { existsSync, globSync } from 'node:fs';
import { execSync } from 'node:child_process';
import {
  checkMoonInputs,
  type Issue,
  type ProjectSources,
  type TaskIndex,
} from './moon-input-check.ts';

interface ProjectsResult {
  projects: Array<{ id: string; source: string }>;
}

interface TasksResult {
  tasks: TaskIndex;
}

const query = <T>(subcommand: string): T =>
  JSON.parse(
    execSync(`moon query ${subcommand} --json`, { encoding: 'utf8' }),
  ) as T;

const printReport = (issues: Issue[]): void => {
  console.error(`Found ${issues.length} stale moon input(s):\n`);
  for (const { target, kind, value } of issues) {
    console.error(`  ${target}  [${kind}]  ${value}`);
  }
  console.error(
    '\nFix: update the task `inputs:` declaration, or mark the entry ' +
      '`{ ..., optional: true }` if its absence is expected.',
  );
};

const main = (): void => {
  const projectSources: ProjectSources = Object.fromEntries(
    query<ProjectsResult>('projects').projects.map(({ id, source }) => [
      id,
      source,
    ]),
  );
  const tasks = query<TasksResult>('tasks').tasks;

  const issues = checkMoonInputs(projectSources, tasks, {
    exists: existsSync,
    globMatches: (pattern) => globSync(pattern),
  });

  if (issues.length === 0) {
    console.log('All moon task inputs resolve.');
    return;
  }

  printReport(issues);
  process.exitCode = 1;
};

main();
