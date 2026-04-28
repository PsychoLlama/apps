/**
 * `validate-moon` subcommand. Shells out to `moon query` for live
 * data, hands it to the pure checker in `moon-input-check.ts`,
 * prints a report, and sets the exit code.
 *
 * Wired into `.moon/tasks.yml` as an `implicitDeps` entry, so every
 * task runs this first; CI runs it fresh regardless of cache.
 */

/* eslint-disable no-console -- stdout/stderr are this CLI's output surface. */

import { existsSync, globSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { defineCommand } from 'citty';
import {
  checkMoonInputs,
  type Issue,
  type ProjectSources,
  type TaskIndex,
} from '../moon-input-check.ts';

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

export default defineCommand({
  meta: {
    name: 'validate-moon',
    description:
      'Check that every moon task `inputs:` entry still resolves to a real file or non-empty glob.',
  },
  run() {
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
  },
});
