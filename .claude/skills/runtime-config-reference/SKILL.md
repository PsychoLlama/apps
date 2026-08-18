---
description: Reference for `@lib/runtime-config` — per-environment feature flags and other config resolved at runtime. Use when adding or reading a flag, gating a feature by environment, or wiring a settings control that changes one.
---

# Runtime Config

- Single entry point: `@lib/runtime-config`.
- An **option** is a stable ID plus a default value per environment. An **override** is a persisted change layered on top, stored in OPFS.
- Environments are `development | staging | production`, matching Vite's build modes.
- Reads are async and client-only. Pre-rendered pages resolve with defaults.

## Defining

- One `config.ts` per owning package, exported as `@<scope>/<name>/config`.
- IDs are stable and namespaced: `@app/scratchpad`, `@app/logs:export`.
- Every environment needs a value. Defaults ship in the bundle, so they're the only value available during prerender.

```ts
// Defaults to `{ enabled: boolean }`.
export const enabled = defineConfig('@app/scratchpad', {
  development: { enabled: true },
  staging: { enabled: true },
  production: { enabled: false },
});

// Any JSON value, via the type parameter.
export const filter = defineConfig<{ pattern: string }>(
  '@lib/observability:filter',
  {
    development: { pattern: '*' },
    staging: { pattern: '*' },
    production: { pattern: '' },
  },
);
```

## Reading

- `readEnvironment(option)` — the resolved value here and now. The everyday read.
- `readEnvironment(option, env)` — same, for a named environment.
- `readAllEnvironments(option)` — the full per-environment map. For settings UIs that edit each one.
- `option.defaults[environment]` — the built-in value, no OPFS. Use it to seed SSG state so prerender and first paint agree, then reconcile with a real read on mount.
- `environment` — the environment this build targets.

## Watching

- `subscribe(option, listener)` — resolved value for the current environment on every change. Returns an unsubscribe.
- Fires for changes from **any** context, including this one's own writes. Drive state off the subscription, never off the control that triggered the write.
- `watchAll(signal, register)` — several subscriptions merged into one buffered async stream, for sagas to `for await`. Subscribe first, read second, drain third: buffering means a change landing mid-read is replayed on top, not lost.

```ts
const changes = yield * call(watchLauncherFlags); // watchAll inside
const values = yield * call(readLauncherFlags); // readEnvironment inside
yield commit(restoredTopic(values));
for await (const change of changes) {
  /* … */
}
```

## Writing

- `updateConfig(option, patch)` — merge a per-environment patch. Absent environments keep their value.
- `reset(option, environments?)` — clear the override, reverting to defaults. All environments by default.
- Both persist, then announce to every context. An override matching defaults is deleted, not stored.

## Pruning

- `pruneOverrides(known)` — deletes persisted overrides no longer in use. Run by "parent" apps like `@app/main` on startup.
- `known` must be **every** option the origin declares. The whole suite shares one OPFS directory, so a partial list deletes live overrides.
- Adding a `defineConfig` anywhere requires adding it to the known list in the relevant `pruneOverrides`.

## Testing

- Unit tests resolve to the `development` environment.
- Anything touching persistence needs a real browser: name it `*.test.browser.ts`.
- Wipe OPFS between cases — overrides outlive a test.

```ts
afterEach(async () => {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry('config', { recursive: true }).catch(() => {});
});
```
