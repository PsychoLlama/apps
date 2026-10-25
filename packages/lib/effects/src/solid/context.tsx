import {
  createContext,
  createSignal,
  onMount,
  useContext,
  type Accessor,
  type ParentProps,
} from 'solid-js';
import { assert } from '@lib/assert';
import { createController, type Controller } from '../controller/controller';
import { createManager } from '../manager';

/** What `EffectsRoot` provides to the tree beneath it. */
export interface Effects {
  /** Runs every plan acquired under the root. */
  readonly controller: Controller;

  /**
   * Whether the tree has mounted. Reactive. Client-only plans key on it
   * so they start on mount.
   */
  readonly mounted: Accessor<boolean>;
}

// Internal to the package: apps go through `EffectsRoot`. Tests provide
// it directly to drive `mounted` by hand.
export const EffectsContext = createContext<Effects>();

/** Props for {@link EffectsRoot}. */
export interface EffectsRootProps extends ParentProps {
  /**
   * Runs the plans beneath the root. Read once. Defaults to a fresh
   * controller of the root's own; tests pass a test controller's to
   * inspect and tear down what the tree held.
   */
  readonly controller?: Controller;
}

/**
 * Wraps the app once, at its root, above any `Suspense`. Provides the
 * controller plans run on, one per root, so each server render caches
 * its own plans and none of them carries into the next. It also tracks
 * whether the tree has mounted:
 * pre-rendered HTML and the hydration pass both read `false`, so they
 * agree; it turns `true` once the client takes over, which is what
 * starts client-only plans. Above `Suspense`, a pending boundary can't
 * hold back the mount.
 */
export const EffectsRoot = (props: EffectsRootProps) => {
  const [mounted, setMounted] = createSignal(false);
  onMount(() => setMounted(true));

  const effects: Effects = {
    // eslint-disable-next-line solid/reactivity -- The controller is fixed for the root's life.
    controller: props.controller ?? createController(createManager()),
    mounted,
  };

  return (
    <EffectsContext.Provider value={effects}>
      {props.children}
    </EffectsContext.Provider>
  );
};

const useEffects = (): Effects => {
  const effects = useContext(EffectsContext);
  assert(effects, '<EffectsRoot> required but not provided.');

  return effects;
};

/** The controller from the nearest `EffectsRoot`. */
export const useController = (): Controller => useEffects().controller;

/**
 * Whether the tree under `EffectsRoot` has mounted. Reactive. Key
 * client-only work on it: it stays idle through pre-render and
 * hydration, so the server and the first client render match, then
 * starts on mount.
 */
export const useMounted = (): Accessor<boolean> => useEffects().mounted;
