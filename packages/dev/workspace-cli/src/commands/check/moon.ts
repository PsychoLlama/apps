/**
 * `check moon` subcommand. Verifies that every moon task `inputs:`
 * declaration still resolves to a real file or non-empty glob.
 *
 * Moon happily caches past a stale glob, so a rename elsewhere in
 * the repo can silently orphan a declaration — affected-task
 * detection then skips work it should be running. This check is
 * wired as an `implicitDeps` entry in `.moon/tasks.yml`, so every
 * task runs it first; CI runs it fresh regardless of cache.
 *
 * The pure validator and its types are exported alongside the
 * command so tests can drive it with synthetic data via the
 * `FsProbes` injection — no real filesystem, no shellouts to
 * `moon query`.
 */

/* eslint-disable no-console -- stdout/stderr are this CLI's output surface. */

import { access, glob } from 'node:fs/promises';
import path from 'node:path';
import { defineCommand } from 'citty';
import { x } from 'tinyexec';

/**
 * One entry from a task's `inputs:` list as moon emits it in
 * `moon query tasks --json`. Exactly one of `file` or `glob` is
 * set per entry.
 *
 * Example (emitted for `inputs: ['src/**']`):
 * ```json
 * { "glob": "src/**" }
 * ```
 */
export interface MoonInput {
  /** A workspace-root-prefixed (`/…`) or project-relative literal path. */
  file?: string;
  /** A workspace-root-prefixed (`/…`) or project-relative glob. */
  glob?: string;
  /** When true, absence is expected — the check skips the entry. */
  optional?: boolean;
}

/** A task as emitted by `moon query tasks --json`. Only the subset we use. */
export interface MoonTask {
  inputs?: MoonInput[];
}

/** `tasks.<project>.<taskId>` → task, as emitted by `moon query tasks`. */
export type TaskIndex = Record<string, Record<string, MoonTask>>;

/** `projectId` → workspace-relative project source dir (e.g. `packages/app/main`). */
export type ProjectSources = Record<string, string>;

/**
 * Filesystem probes the checker needs. Injected so tests can feed
 * stub predicates without touching disk.
 */
export interface FsProbes {
  /** Returns true if the workspace-relative path exists. */
  exists: (workspaceRelative: string) => Promise<boolean>;
  /** Returns the paths that match `pattern` (workspace-relative). */
  globMatches: (workspaceRelative: string) => Promise<string[]>;
}

/** A single stale-input finding surfaced to the user. */
export interface Issue {
  /** `projectId:taskId`, used directly in the error report. */
  target: string;
  /** Which check failed. */
  kind: 'missing file' | 'empty glob';
  /** The original declaration from the moon config. */
  value: string;
}

/**
 * Moon lets `inputs:` declarations be project-relative (`src/**`)
 * or workspace-rooted (`/packages/**`). Normalize both to a
 * workspace-relative path so a single FS probe can resolve them.
 */
export const resolveToWorkspace = (
  projectSource: string,
  raw: string,
): string => {
  if (raw.startsWith('/')) return raw.slice(1);
  if (projectSource === '.') return raw;
  return path.posix.join(projectSource, raw);
};

/**
 * Walk every task's `inputs:` list and collect entries that no
 * longer resolve. `file` entries must exist; `glob` entries must
 * match at least one file. `optional: true` entries are skipped.
 */
export const checkMoonInputs = async (
  projectSources: ProjectSources,
  tasks: TaskIndex,
  fs: FsProbes,
): Promise<Issue[]> => {
  const issues: Issue[] = [];

  for (const [project, projectTasks] of Object.entries(tasks)) {
    const source = projectSources[project];
    if (source === undefined) continue;

    for (const [taskId, task] of Object.entries(projectTasks)) {
      for (const input of task.inputs ?? []) {
        if (input.optional) continue;
        const target = `${project}:${taskId}`;

        if (input.file !== undefined) {
          const rel = resolveToWorkspace(source, input.file);
          if (!(await fs.exists(rel))) {
            issues.push({ target, kind: 'missing file', value: input.file });
          }
        }

        if (input.glob !== undefined) {
          // Negative globs (`!…`) subtract from another input's match
          // set rather than naming files of their own. They're allowed
          // to match nothing — checking them would just flag a no-op
          // exclusion as stale.
          if (input.glob.startsWith('!')) continue;

          const rel = resolveToWorkspace(source, input.glob);
          if ((await fs.globMatches(rel)).length === 0) {
            issues.push({ target, kind: 'empty glob', value: input.glob });
          }
        }
      }
    }
  }

  return issues;
};

interface ProjectsResult {
  projects: Array<{ id: string; source: string }>;
}

interface TasksResult {
  tasks: TaskIndex;
}

const query = async <T>(subcommand: string): Promise<T> => {
  const { stdout } = await x('moon', ['query', subcommand, '--json'], {
    throwOnError: true,
  });
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
