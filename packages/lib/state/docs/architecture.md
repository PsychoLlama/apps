# A Unifying Theory of UI State Management

UI state management is the coordination of three orthogonal resources:
**space** (the values that exist right now), **time** (the facts about
what happened), and **life** (the processes that are currently running).
Every state management tool can be evaluated by which of these axes it
models and which it omits or fuses — and every familiar failure mode
traces back to a missing or conflated axis.

- The Elm/Redux family models space and time (that's why its devtools
  were unmatched: the action log _is_ the time axis, reified) but has no
  life. Nothing owns state, nothing dies, and the store decays into an
  immortal database: anyone can read or write any table, and nobody can
  ever prove it's safe to purge a row.
- Signals and hooks model only space. Time is degenerate — a write is
  not a fact; it has no name, no payload, no log — and life is borrowed
  from the component tree, which is the wrong tree. Component-local
  state feels right until the first requirement lands that renders the
  same state somewhere else, and then ownership silently migrates to
  whatever ancestor both consumers happen to share.
- Actor systems and statecharts model time and life but make space
  awkward: reactive derivation and selective re-rendering are bolted on
  rather than native.

The theory: give each axis exactly one primitive and one owner, and
allow the axes to touch only through one-way interfaces.

> **The one law: life produces time, time mutates space, and space never
> reaches back.**

Processes publish facts. Facts fold into values. Values are derived and
rendered. Nothing downstream can reach upstream, so the dependency
graph is a DAG by construction rather than by discipline.

## Requirements

These are the constraints the architecture was built to satisfy, stated
as requirements rather than features:

1. **Transactional updates.** An event happens and all relevant state
   changes at once — one observable transition, even when the change
   spans multiple stores owned by different features.
2. **Small stores on a shared bus.** Coordination must not require
   co-locating state. Two features should be able to react to the same
   event, atomically, without importing each other's write surface.
3. **Effects ignorant of state.** Side-effecting code must not know
   which stores exist. Coupling effects to state makes them impossible
   to compose and painful to test.
4. **The full effect spectrum.** One model must express: an instant
   synchronous call; a sync operation with success/failure; an async
   operation with start/success/failure; and a pathological
   long-running process (polling, event subscription) with no natural
   end.
5. **Composable effects.** Given a mechanism that fetches `FOO` and one
   that fetches `BAR`, it must be possible to run both and land the
   combined result as a _single_ state transition — without inventing a
   merged event type or changing either mechanism.
6. **Errors handled or loud.** Failure is a first-class control-flow
   path. An unhandled failure must escalate visibly; it may never be
   silently swallowed.
7. **Cancellation.** In-flight asynchronous work can be aborted, and
   abort must propagate through composition.
8. **No architectural cycles.** State must not depend on updates that
   depend on state. The layers form a straight line.
9. **Ownership and mortality.** Every piece of state has exactly one
   owner and a finite lifetime. It must always be provable when state
   is safe to purge, and purging must release the real resources the
   state holds.
10. **Lifetime decoupled from components.** Components consume state;
    they do not own it. External systems (a WebRTC stack, a background
    sync) hold as much claim over state lifetime as any view. At the
    same time, nothing lives forever by accident.
11. **Testability in both directions.** Simulate any sequence of state
    changes without running a single effect; test any effect
    orchestration without materializing any state.
12. **Cross-app composition.** Everything the UI can do is a boring,
    importable function. A script, a console session, or a sibling app
    can drive behavior through the same entry points, and everything it
    does stays in sync with state.
13. **Observability by construction.** From the outside it must be
    possible to derive: a span for every effect, parent/child effect
    relationships, current state, historical snapshots, and diffs
    between any two transitions — without features writing any
    instrumentation.
14. **Opaque handles are state.** A media track or a socket represents
    real UI-relevant state and belongs in the state system, not beside
    it — but it must never be proxied, cloned, or serialized.
15. **Pay-for-what-you-import, minifiable, typesafe.** No central
    registration file, no string keys, no non-minifiable structure in
    the hot path, and full inference from definition to consumer.

## The three axes

### Space: values

Space holds what is true right now. It has three shapes:

- A **store**: a reactive record. Fine-grained reads, so consumers
  re-render only for the fields they touch. This is the spreadsheet's
  grid.
- A **cell**: a single swappable value that is never proxied or
  traversed. Cells exist because of requirement 14: host objects need a
  home in state without the reactive system looking inside them. A cell
  carries a _drop hook_ — teardown travels with the value's owner, not
  with whoever remembered to write cleanup code.
- A **formula**: derived state over stores, cells, and other formulas.
  The spreadsheet's formula cell. Formulas also answer a subtle
  composition problem (see the composite-view edge case below): when a
  view wants one gate over several sources, derivation — not event
  merging — is often the right tool on the read side.

The critical inversion: **reading is the default and it is readonly
everywhere.** Mutable access is not a capability that views, effects,
or even the owning module's ordinary code possess. Writable drafts
exist in exactly one syntactic position — inside a fold (below) — so
"who can write this?" is answered by the grammar, not by convention or
code review.

### Time: facts

Time is the ledger of what happened. Its primitive is the **fact**: a
named, payload-carrying, _inert_ value. Producing a fact does nothing.
This inertness is load-bearing:

- Facts can be committed in groups. A **commit** is a set of facts that
  lands as one transition (requirement 1). Batching is part of the
  grammar — "commit these three facts" is one expression — which makes
  the classic smell of consecutive dispatches (`dispatch(a);
dispatch(b);`) syntactically visible and mechanically lintable
  (requirement 1's evil twin).
- Facts can be recorded, replayed, diffed, and asserted on. The ledger
  is the observability chokepoint (requirement 13) and the replay
  medium for tests (requirement 11).

Facts fold into space through **folds**: pure, synchronous
subscriptions that receive writable drafts of specific stores plus the
fact's payload. Every fold subscribed to any fact in a commit runs in
causal order inside a single flush. Because subscription is by fact
identity, two features can each fold the same fact into their own
stores and still commit atomically — small stores, shared bus, no
shared module (requirement 2).

Splitting the fact from the fold is the decisive break from the
action/reducer fusion. An action that _is_ its handler cannot be
reacted to twice, cannot be replayed without its stores, and cannot be
published by something that doesn't know the stores exist. A fact can.

Ownership convention completes the picture (requirement 9): a store's
folds live with the store, so write access is private by construction;
reads are public; and a _deliberately exported_ fact is a feature's
outbound contract — the only sanctioned channel for cross-feature
reaction.

### Life: processes

Life is the missing axis in most of the field, and most of the
requirements list lives here.

Its primitive is the **scope**: the unit of ownership and lifetime. A
scope owns stores, cells, and running processes, and carries an abort
signal. Scopes are pinned alive by **anchors** — refcounted claims that
any interested party can hold: a component while mounted, a route, a
console session, a WebRTC subsystem. This is requirement 10 resolved:
the component tree is _one_ anchor holder among several, not the
lifetime authority. When the last anchor releases, the scope dies:
processes abort, drop hooks release held resources, space deallocates.
Nothing is immortal by accident, and "is it safe to purge?" has a
mechanical answer — the refcount.

Processes are **sagas**: functions owned by a scope whose entire output
vocabulary is instructions — publish a commit, invoke a capability,
snapshot a value, compose children. A **capability** is any plain
side-effecting function; it receives the governing abort signal and
knows nothing about the state system (requirement 3). Because a saga's
steps are inert instruction values, the same saga can be driven for
real or driven against stubs, which yields requirement 11's second
half: effect orchestration is testable with no state attached, and the
test asserts on the exact sequence of commits the saga produced.

The effect spectrum (requirement 4) maps onto one shape instead of
four: an instant call is a single commit; sync success/failure is
try/catch around two facts; async lifecycle is a start-fact, awaited
work, and an end-fact; a pathological process is a loop that publishes
facts until its scope dies. Cancellation (requirement 7) needs no
per-effect wiring because the signal belongs to the scope and is
threaded through every capability invocation and every child process
automatically.

Errors (requirement 6) follow one rule: a failure thrown by a
capability is thrown back into the saga, which may recover by
committing a failure fact; a failure the saga does not handle rejects
its caller; a failure escaping a _detached_ process escalates to an
explicit failure channel or, absent one, to the host's uncaught-error
mechanism. There is no path on which an error terminates silently.

## Composition and the commit boundary

Requirement 5 hides the hardest design problem, exposed by a concrete
edge case: two independently useful operations — say, _render a
pairing code_ and _establish a connection_ — each publishing their own
facts, must compose into a flow where the UI observes **one**
transition, not a flicker of intermediate states. Naive event
composition fails in two ways:

- Reacting to each child's facts separately produces the flicker.
- Merging the children into one combined fact couples the composite to
  both payload shapes, and every added data source ripples a signature
  change through every handler — the "add one input to hydration,
  edit every reducer" tax.

The resolution: **the composing process controls the commit boundary,
not the payload shapes.** Composition comes in three modes:

- _Sequential_: run a child to completion; its commits pass through as
  they happen.
- _Concurrent, pass-through_: run children in parallel; commits still
  land individually. Right when the facts are genuinely independent.
- _Concurrent, atomic_: run children in parallel, **hold** their
  commits, and land every held fact as a single transition when all
  children settle. If any child fails, siblings are cancelled and the
  held facts are discarded — all or nothing.

The atomic mode satisfies requirement 5 exactly: the children keep
their own facts and folds; the composite never learns their payloads;
adding a source is one more child in the list and one new fold in that
source's home module. Nothing else changes.

Two boundary rules keep the model honest:

- A commit is a semantic unit, not a batching optimization. One yield,
  one transition. If two things must change together, they are one
  commit — composed at the capability layer or fused atomically —
  never two commits that happen to be near each other.
- A _detached_ child (spawned to outlive its parent) is never fused: it
  belongs to the scope, not to the composition that started it, so its
  facts commit directly.

## Edge cases that shaped the design

- **The composite view (flicker).** Described above; it forced the
  fact/fold split and the atomic commit boundary. It also motivated
  formulas: when the composite is derivable from existing state, the
  read side can gate ("show ready only when both sources are ready")
  without any time-axis machinery.
- **The character counter.** State begins life inside an input
  component; a requirement adds a validation summary elsewhere; now the
  owner is wrong and the state gets hoisted to an unrelated ancestor.
  Conclusion: components must never be owners, only anchors and
  readers. Any design that makes component-local state the cheap
  default re-creates this trap.
- **The media track.** A `MediaStreamTrack` is genuine UI state with a
  genuine teardown obligation, owned by a subsystem that outlives any
  component. It demands: unproxied storage (cells), owner-attached
  teardown (drop hooks), and component-independent lifetime (anchors).
- **The uncancellable capability.** Some side effects ignore their
  abort signal. Cancellation must still be prompt: the driver races
  every pending step against the scope's abort, closes well-behaved
  processes so their cleanup runs, and abandons pathological hangs
  rather than letting a dead scope keep a process alive. Cooperative
  cancellation is the fast path, not a precondition.
- **The event targeting dead state.** A fact can be committed after
  the scope owning a subscribed store has died. The fact is real; the
  reaction is conditional on the observer being alive. Dead-scope folds
  are skipped, living ones still run. This is a feature — it is
  precisely what makes purging state safe — but it must be a defined
  behavior, not an accident.
- **The double dispatch.** Sequential single-fact commits where one
  transition was meant. Unfixable by review at scale; fixable by
  grammar. Making the commit variadic and the fact inert moves the
  mistake from "plausible-looking code" to "visibly two transitions."
- **The stream that never ends.** Polling and event subscription have
  no success state; they end only by cancellation. They force lifetime
  to be a first-class concept: without scopes, every long-running
  process needs a hand-rolled kill switch, and one of them is always
  missing.

## Properties that fall out

None of the following required dedicated design; they are consequences
of the axes and the one law.

- **Testing both directions** (requirement 11): replay facts against
  folds with zero effects; drive sagas against stubs with zero state.
  The two halves meet only at the ledger, so each is complete alone.
- **The SDK** (requirement 12): a feature's public surface is readonly
  views, runnable sagas, and exported facts. Those are ordinary values
  and functions — importable, scriptable, and inherently in sync,
  because there is no way to act except through the ledger.
- **Observability** (requirement 13): every fact, commit, capability
  invocation, and process boundary already flows through the driver as
  a value. Spans, parentage, snapshots, and diffs are readouts of the
  existing chokepoint, not instrumentation added to features.
- **Acyclicity** (requirement 8): facts don't know folds; folds don't
  know processes; space doesn't know any of them. The import graph
  cannot express a cycle without violating the grammar first.
- **Bundle discipline** (requirement 15): identity-keyed definitions
  (no string registry), inert tuples (no methods), and per-feature
  definition (no central manifest) mean the model imposes no
  registration cost and nothing that resists minification or
  tree-shaking.

## Accepted costs

The theory buys its properties with three deliberate trades:

- **Instruction ceremony.** Invoking a capability through an
  instruction rather than a bare await is one extra wrapper per call.
  It pays for signal injection, span visibility, and stubbed
  simulation. Bare awaiting remains possible and remains invisible to
  tooling; the ceremony is the price of the observable path.
- **Atomicity is all-or-nothing.** Held facts inside an atomic
  composition are discarded on failure. Partial progress that should
  survive belongs outside the atomic boundary, by design.
- **Explicit lifetime.** Nothing is immortal unless something anchors
  it deliberately. That is friction — every consumer must hold or share
  an anchor — and it is exactly the friction that makes ownership
  legible and teardown provable.
