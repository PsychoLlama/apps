import { createSignal, untrack } from 'solid-js';
import { createMutable } from 'solid-js/store';
import {
  COMPUTE,
  DEPS,
  DROP,
  INIT,
  KIND,
  SCOPE,
  type AnySpaceRef,
  type AnyWritableRef,
  type CellRef,
  type FormulaRef,
  type Runtime,
  type ScopeRef,
  type SpaceInstance,
  type StoreRef,
} from './internal';
import { getAliveScope } from './scope';

export type { AnySpaceRef, AnyWritableRef, CellRef, FormulaRef, StoreRef };

/**
 * Recursively marks every property of `T` as `readonly`. Functions pass
 * through untouched; arrays become `ReadonlyArray<DeepReadonly<U>>`.
 */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/**
 * What a reader gets for a ref: a readonly view for stores, the held
 * value for cells (never proxied — this is where host objects live), and
 * the derived result for formulas.
 */
export type Snapshot<Ref> =
  Ref extends StoreRef<infer T>
    ? DeepReadonly<T>
    : Ref extends CellRef<infer T>
      ? T
      : Ref extends FormulaRef<infer T>
        ? T
        : never;

/** Snapshots for each ref in a tuple, in order. */
export type SnapshotsOf<Refs extends readonly AnySpaceRef[]> = {
  [K in keyof Refs]: Snapshot<Refs[K]>;
};

/**
 * Define a store owned by a scope. Stores hold deeply-reactive records;
 * every reader sees a readonly view. Writable drafts exist only inside
 * fold handlers.
 */
export const defineStore = <T extends object>(
  scope: ScopeRef,
  init: () => T,
): StoreRef<T> => ({
  [KIND]: 'store',
  [SCOPE]: scope,
  [INIT]: init,
});

/** Options for {@link defineCell}. */
export interface CellOptions<T> {
  /**
   * Teardown for the held value. Runs once, when the owning scope dies.
   * Swapping a live handle mid-life is saga work — folds stay pure.
   */
  readonly drop?: (value: T) => void;
}

/**
 * Define a cell owned by a scope: a single swappable value that is never
 * deep-proxied. Cells are where host objects (media tracks, sockets,
 * wasm handles) live in state.
 */
export const defineCell = <T>(
  scope: ScopeRef,
  init: () => T,
  options: CellOptions<T> = {},
): CellRef<T> => ({
  [KIND]: 'cell',
  [SCOPE]: scope,
  [INIT]: init,
  [DROP]: options.drop,
});

/**
 * Define a formula — state derived from stores, cells, or other
 * formulas. Computed on demand with tracked reads; consumers re-run when
 * any dependency changes.
 */
export const defineFormula = <
  const Deps extends readonly [AnySpaceRef, ...AnySpaceRef[]],
  T,
>(
  deps: Deps,
  compute: (...values: SnapshotsOf<Deps>) => T,
): FormulaRef<T> => ({
  [KIND]: 'formula',
  [DEPS]: deps,
  [COMPUTE]: compute as FormulaRef<T>[typeof COMPUTE],
});

/**
 * Internal: resolve (lazily materializing) a store or cell instance. The
 * owning scope must be alive.
 */
export const materialize = (
  runtime: Runtime,
  ref: AnyWritableRef,
): SpaceInstance => {
  const scope = getAliveScope(runtime, ref[SCOPE]);
  const existing = scope.spaces.get(ref);
  if (existing) return existing;

  const space: SpaceInstance =
    ref[KIND] === 'store'
      ? { kind: 'store', state: createMutable(ref[INIT]()) }
      : createCellInstance(ref[INIT]());

  scope.spaces.set(ref, space);
  return space;
};

const createCellInstance = (initial: unknown): SpaceInstance => {
  const [get, set] = createSignal(initial);
  return {
    kind: 'cell',
    box: {
      get current() {
        return get();
      },
      set current(value: unknown) {
        set(() => value);
      },
    },
  };
};

/** Internal: resolve a ref to its current value. Reads are tracked. */
export const resolveValue = (runtime: Runtime, ref: AnySpaceRef): unknown => {
  if (ref[KIND] === 'formula') {
    const compute = ref[COMPUTE] as (...values: unknown[]) => unknown;
    return compute(...ref[DEPS].map((dep) => resolveValue(runtime, dep)));
  }

  const space = materialize(runtime, ref);
  return space.kind === 'store' ? space.state : space.box.current;
};

/** Internal: untracked read of a ref's current value. */
export const peekValue = (runtime: Runtime, ref: AnySpaceRef): unknown =>
  untrack(() => resolveValue(runtime, ref));
