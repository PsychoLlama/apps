import {
  createContext,
  createSignal,
  onMount,
  useContext,
  type Accessor,
  type ParentProps,
} from 'solid-js';
import { assert } from '@lib/assert';
import type { Controller } from '../controller/controller';
import { DEFAULT_CONTROLLER } from '../controller/default';

/** What `EffectsRoot` provides to the tree beneath it. */
export interface Effects {
  /** Runs every flow acquired under the root. */
  readonly controller: Controller;

  /**
   * Whether the tree has mounted. Reactive. Client-side resources key on
   * it so they start on mount, and suspense boundaries hold their
   * fallback until those resources resolve.
   */
  readonly mounted: Accessor<boolean>;
}

// Internal to the package: apps go through `EffectsRoot`. Tests provide
// it directly to drive `mounted` by hand.
export const EffectsContext = createContext<Effects>();

/** Props for {@link EffectsRoot}. */
export interface EffectsRootProps extends ParentProps {
  /**
   * Runs the flows beneath the root. Read once. Defaults to the shared
   * controller; tests pass a test controller's so nothing leaks into it.
   */
  readonly controller?: Controller;
}

/**
 * Wraps the app once, at its root, above any `Suspense`. Provides the
 * controller flows run on, and tracks whether the tree has mounted:
 * pre-rendered HTML and the hydration pass both read `false`, so they
 * agree; it turns `true` once the client takes over, which is what
 * initializes client-side resources under suspense.
 */
export const EffectsRoot = (props: EffectsRootProps) => {
  const [mounted, setMounted] = createSignal(false);
  onMount(() => setMounted(true));

  const effects: Effects = {
    // eslint-disable-next-line solid/reactivity -- The controller is fixed for the root's life.
    controller: props.controller ?? DEFAULT_CONTROLLER,
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
 * client-side resources on it: they stay idle through pre-render and
 * hydration, so the server and the first client render match, then
 * start on mount while suspense shows the fallback.
 */
export const useMounted = (): Accessor<boolean> => useEffects().mounted;
