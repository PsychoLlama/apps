/**
 * Pure validation core for moon task `inputs:` declarations.
 *
 * Separated from the CLI so tests can drive it directly with
 * synthetic data and fake filesystem probes — no shelling out to
 * `moon query`, no real filesystem, no globbing on the host.
 *
 * The CLI wrapper in `commands/check-moon.ts` is the only caller that
 * feeds real data in.
 */

import path from 'node:path';

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
