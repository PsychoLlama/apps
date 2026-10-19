import {
  createContext,
  createSignal,
  onMount,
  useContext,
  type Accessor,
  type ParentProps,
} from 'solid-js';
import { assert } from '@lib/assert';

const MountedContext = createContext<Accessor<boolean>>();

/**
 * Wraps the app once, at its root, and tracks whether the tree has
 * mounted. Pre-rendered HTML and the hydration pass both read `false`, so
 * they agree; it turns `true` once the client takes over.
 */
export const EffectsRoot = (props: ParentProps) => {
  const [mounted, setMounted] = createSignal(false);
  onMount(() => setMounted(true));

  return (
    <MountedContext.Provider value={mounted}>
      {props.children}
    </MountedContext.Provider>
  );
};

/**
 * Whether the tree under `EffectsRoot` has mounted. Reactive. Client-only
 * work waits on it so the server and the first client render match.
 */
export const useMounted = (): Accessor<boolean> => {
  const mounted = useContext(MountedContext);
  assert(mounted, '<EffectsRoot> required but not provided.');

  return mounted;
};
