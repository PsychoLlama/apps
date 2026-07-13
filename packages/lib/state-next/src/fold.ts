import { batch, untrack } from 'solid-js';
import {
  OBSERVERS,
  SCOPE,
  SCOPES,
  SUBSCRIBERS,
  type AnyFact,
  type AnyWritableRef,
  type CellRef,
  type Fold,
  type Runtime,
  type StoreRef,
  type Topic,
} from './internal';
import { materialize } from './space';

/** The writable draft a fold receives for a ref. */
type Draft<Ref> =
  Ref extends StoreRef<infer T>
    ? T
    : Ref extends CellRef<infer T>
      ? { current: T }
      : never;

type DraftsOf<Refs extends readonly AnyWritableRef[]> = {
  [K in keyof Refs]: Draft<Refs[K]>;
};

/** Trailing payload arg is dropped entirely for payload-less topics. */
type FoldArgs<Refs extends readonly AnyWritableRef[], Payload> = [
  Payload,
] extends [void]
  ? DraftsOf<Refs>
  : [...DraftsOf<Refs>, Payload];

/**
 * Subscribe stores and cells to a topic. The handler is a pure,
 * synchronous fold: writable drafts in ref order, then the fact's
 * payload. Folds are the only writers of space, and they live in the
 * owning module — write access is private by construction.
 */
export const defineFold = <
  const Refs extends readonly [AnyWritableRef, ...AnyWritableRef[]],
  Payload,
>(
  topic: Topic<Payload>,
  refs: Refs,
  handler: (...args: FoldArgs<Refs, Payload>) => void,
): void => {
  topic[SUBSCRIBERS].push([refs, handler as unknown as Fold[1]]);
};

/**
 * Apply facts to space: every fold subscribed to any fact in the commit
 * runs in causal order within a single batched, untracked flush, then
 * commit observers are notified. A fold whose refs belong to a dead
 * scope is skipped — the fact occurred; nobody alive cared.
 */
export const commitFacts = (
  runtime: Runtime,
  facts: readonly AnyFact[],
): void => {
  untrack(() => {
    batch(() => {
      for (const [topic, payload] of facts) {
        for (const [refs, handler] of topic[SUBSCRIBERS]) {
          const drafts = collectDrafts(runtime, refs);
          if (drafts) {
            (handler as (...args: unknown[]) => void)(...drafts, payload);
          }
        }
      }
    });
  });

  for (const observer of runtime[OBSERVERS]) {
    observer(facts);
  }
};

const collectDrafts = (
  runtime: Runtime,
  refs: readonly AnyWritableRef[],
): unknown[] | null => {
  const drafts: unknown[] = [];

  for (const ref of refs) {
    if (!runtime[SCOPES].has(ref[SCOPE])) return null;
    const space = materialize(runtime, ref);
    drafts.push(space.kind === 'store' ? space.state : space.box);
  }

  return drafts;
};
