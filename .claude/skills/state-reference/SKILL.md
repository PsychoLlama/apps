---
description: Reference docs for `@lib/state` — the codebase's sanctioned state management: cells and stores held by `@lib/effects` plans, written through commands and extensions. Built-in Solid primitives (`createSignal`, `createStore`, `createResource`) are banned outside `@lib/ui` and `@lib/design`. Load when authoring or reviewing any stateful code, picking an API, or wiring stateful tests.
---

# State Management

- Single entry point: `@lib/state`. Built on `@lib/effects`: every piece of state is a plan, and lives as long as something holds it.
- Name plans with a `$` prefix: `$appearance`, `$archive`. Values read from them drop it: `const appearance = useValue($appearance)`.
- Reads are read-only everywhere. Writes go through commands and extensions; a cell's own step may also write it.

## Cells & Stores

- `defineCell(init)`: A plan holding one reactive value. `init` seeds it from whatever the earlier step yields. Readers get the accessor.
- `defineStore<State>(init)`: A plan holding a deeply reactive object. Readers get a deeply read-only view.
- `createCell(initial)`: Make a cell inside your own plan step. Returns `[cell, setter]`; return the cell through `reactive(cell, cleanup?)`.
- Prefer cells. Reach for a store only when its fields are genuinely coupled, i.e. they change together and are read as one.
- Reach for `createCell` when one step owns the value and whatever hydrates or watches it, e.g. reading storage then following other tabs. The step keeps the setter; everyone else writes through commands.
- Stores have no equivalent to `createCell`: only commits write them. Seed one from earlier steps with `pipe([..., defineStore(init)])`.
- Any plan yielding a cell or store is a target for commands and extensions, async plans included.
- Every store-state interface and every field gets a doc comment describing its role.

## Commands

- `defineCommand([targets], commit)`: A plan yielding a publisher. Calling it runs `commit` against the targets.
- `commit` takes the writable targets in order, cells as `[read, write]` signals and stores as mutable objects, and returns the event handler: `(store) => (message: string) => { store.messages.push(message); }`.
- The handler's parameters become the publisher's arguments.
- Name commands for what happened: `$appearanceChanged`, `$logsDeleted`.
- Every commit an event triggers runs in one batch.

## Extensions

- `defineExtension(topic, [targets], commit)`: Write your own targets on another feature's command. Holding the plan holds the subscription.
- Reach for it to react to events across features, e.g. across a lazy-loading boundary. The command's arguments come from the topic.
- `Topic<Args>`: The type of a plan yielding a publisher. Commands are topics.

## Reading

- From components, use the `@lib/effects/solid` hooks: `useValue($plan)` for state, `useClientValue($plan)` for client-only state, `useAction($command)` for a publisher.
- From other plans, compose with `pipe`/`collect`. Downstream steps get the cell's accessor or the store's view.

## Testing

- Use the testing tools from `@lib/effects/testing`.
