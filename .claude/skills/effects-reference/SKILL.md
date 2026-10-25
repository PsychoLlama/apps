---
description: Reference docs for `@lib/effects` — plans composed from plain-function tasks into cached, ref-counted effect graphs, plus their Solid bindings. Load when authoring or reviewing any plan, effect, or component that reads one, wiring `useValue`/`useClientValue`/`useAction`, or testing plans.
---

# Effects

- Entry points: `@lib/effects` (plans), `@lib/effects/solid` (bindings), `@lib/effects/testing` (tests).
- Name plans with a `$` prefix: `$connect`, `$appearance`. Values read from them drop it.

## Tasks & Plans

- A task is a plain function. Its one parameter is what the step before it yields; a first step takes none.
- A plan composes tasks and other plans. A plan with no input (`Plan<void, ...>`) is complete and can be held.
- `pipe([a, b, c])`: Run steps in sequence, each receiving what the previous yields. Annotate inline arrows' parameters.
- `collect([a, b], fn)`: Run branches side by side over the same input and pass their yields to `fn`, in order. Without `fn`, yields an array.

## Outputs

- Return a value, or a promise of one. Downstream steps receive it settled.
- `resource(value, dispose)`: A long-lived value with its teardown, e.g. a socket or a subscription. Downstream gets `value`.
- `reactive(accessor, dispose?)`: State that changes on its own. Downstream gets the accessor; bindings read it reactively.
- A plan is `sync` when no task returns a promise or cleans up with one. The mode is inferred from types.

## Lifetime & Caching

- Holding a plan runs it. Every holder of the same plan shares one run.
- Each step is cached by its plan and what its upstream yields, by identity. Same input, same output.
- A step runs once per life and never recomputes. Model change over time with `reactive` outputs.
- Releasing the last hold tears steps down, downstream first. Holding again starts fresh.

## Solid

- `<EffectsRoot>`: Wrap the app once at its root. Tests pass `controller` to isolate it.
- `useValue($plan)`: Read a `sync` plan during render, on the server and client alike. Returns an accessor.
- `useClientValue($plan, options?)`: Read a plan once the client mounts, without suspending. Returns an accessor reading `options.initial` (default `undefined`) until then; gate on `.ready`.
- `useAction($plan)`: Call a plan's output as a function from event handlers. Returns a callable with reactive `pending`, `latest`, and `error`.
- Each hook holds its plan for the component's lifetime. Failures reach the nearest `ErrorBoundary`.
- Reading a plan only to hold it is fine: call `useValue` or `useClientValue` and ignore the result.

## Testing

- `createTestController()`: A fresh, isolated cache. Bind it with `await using` to release everything it held.
- `await effects.run($plan)`: Hold the plan and return what it yields.
- `effects.controller`: Pass it to `<EffectsRoot controller={...}>` to test components.
