---
description: Port a Radix UI component or pattern into this codebase, applying project-specific deviations from upstream Radix.
argument-hint: <component-or-pattern>
---

# Port from Radix UI

Port `$ARGUMENTS` from Radix UI into this codebase. If `$ARGUMENTS` is empty, stop and ask which component or pattern to port.

## Source repos

Read upstream before writing anything. Expected repos:

- `radix-ui/primitives`
- `radix-ui/themes`
- `radix-ui/colors`

If the user hasn't said where they're cloned, stop and ask. Don't search the filesystem.

## Module documentation

- Open each ported `.tsx` and `.css.ts` with a JSDoc module block: `@see` the upstream Radix URL, then a bulleted list of intentional deviations.

## Guiding principle

- Treat Radix as the ground truth for UX, accessibility, and behavior; balance fidelity against the strengths of our platform.
- Drop upstream features that fight Vanilla Extract or our type system — e.g. responsive object props (`{ md: space[1], lg: space[2] }`) wreck bundle optimization, and styling via raw `data-*` attrs loses type safety.
- Where we can do better than Radix, do better — colors are a good example: we only pay for the scales we import.
- Reach for `<Flex>` to compose internal structure of complex components.
- We use a global CSS reset, so built-in elements (`<button>`, `<ul>`, etc.) render like bare `<div>`s. Style intentionally; don't lean on user-agent defaults.
- Wrap state predicates (`:not(:disabled):hover`, `:focus-visible`), pseudo-class alternations, and class compounds in `:where(...)` so competing rules stay equal-specificity and the cascade resolves by source order.
- Prefer static rules, variants, and `:has(...)` over `createVar()`. Reach for `createVar()` + `vars: { ... }` in `styleVariants` only when a parent variant must feed a value into a descendant's style.
- Couple wrapper styles to inner-element state with `:has(...)` — e.g. `:has(input:focus-visible)` paints the focus outline on the wrapper.
- Reach for `::before`/`::after` for borders (so `Inset` can't cover them), active indicators, and overlays.

## State and refs

- Controlled inputs only. Callers pass `value` + `onChange` (or the prop pair the component owns); don't accept `defaultValue`/`defaultChecked`.
- Don't forward refs to children. Solid drills `ref={...}` through built-in elements automatically; only manage refs the component itself needs.

## Polymorphism: `as` instead of `asChild`

- Add `as` only when the component lacks a single semantic tag — e.g. `Heading`, `Text`, `Card`, `Flex`.
- Skip `as` when the component owns a tag — `Kbd` → `<kbd>`, `Badge` → `<span>`, `Code` → `<code>`.
- Callers wrap tag-locked components; they don't swap the tag: `<button><Kbd>Esc</Kbd></button>`, never `<Kbd as="button">`.
- A new tag-locked component must remove that tag from polymorphic siblings. Introducing `<Kbd>` means `<Flex as="kbd">` no longer typechecks.
- Flatten compound APIs into prefixed exports — `DialogRoot`, `DialogTrigger`, `DialogContent` instead of `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`.

## Colors

- Map upstream references onto semantic tokens in `@lib/design`. Never hard-code color values.
- If the component exposes a `color` prop, accept every semantic token — no hand-picked subsets. Drop the prop entirely if the component doesn't need one.
- Skip `highContrast` styling. Record it in the module's deferred-deviations list.

## Final checks

1. Run the `codex-review` skill.
2. Boot Storybook and QA the component.
3. Mark the PR ready for review.

If the user explicitly asks for a deep parity review, spawn a subagent to diff our implementation against the Radix source and surface any unintentional differences.
