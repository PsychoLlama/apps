/**
 * `check moon` subcommand. Shells out to `moon query` for live data,
 * hands it to the pure checker in `moon-input-check.ts`, prints a
 * report, and marks the process non-zero on stale config.
 *
 * Wired into `.moon/tasks.yml` as an `implicitDeps` entry, so every
 * task runs this first; CI runs it fresh regardless of cache.
 */

/* eslint-disable no-console -- stdout/stderr are this CLI's output surface. */

import { access, glob } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
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

const query = async <T>(subcommand: string): Promise<T> => {
  const child = spawn('moon', ['query', subcommand, '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk: string) => {
    stderr += chunk;
  });

  const [code] = (await once(child, 'close')) as [number | null];

  if (code !== 0 || stdout.length === 0) {
    throw new Error(stderr || `moon query ${subcommand} failed`);
  }

  return JSON.parse(stdout) as T;
};

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
    name: 'moon',
    description:
      'Check that every moon task `inputs:` entry still resolves to a real file or non-empty glob.',
  },
  async run() {
    const projectSources: ProjectSources = Object.fromEntries(
      (await query<ProjectsResult>('projects')).projects.map(
        ({ id, source }) => [id, source],
      ),
    );
    const tasks = (await query<TasksResult>('tasks')).tasks;

    const issues = await checkMoonInputs(projectSources, tasks, {
      exists: async (target) => {
        try {
          await access(target);
          return true;
        } catch {
          return false;
        }
      },
      globMatches: async (pattern) => Array.fromAsync(glob(pattern)),
    });

    if (issues.length === 0) {
      console.log('All moon task inputs resolve.');
      return;
    }

    printReport(issues);
    process.exitCode = 1;
  },
});
