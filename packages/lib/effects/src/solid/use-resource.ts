import { createResource, type Resource } from 'solid-js';
import { isServer } from 'solid-js/web';
import type { Flow } from '../flow';
import { useMounted } from './context';
import {
  forwardResource,
  holdFlow,
  reduce,
  type Reduce,
} from './flow-resource';
import type { SerializableOutput } from './serializable';

/**
 * Read a flow's output as a Solid resource on the server and the client
 * alike, holding the flow for the component's lifetime. The server
 * computes it into pre-rendered HTML and hands its value to hydration;
 * the client computes it again once mounted, so the value goes live.
 * For flows the server can run, like store reads. Reach for
 * `useClientResource` when only the client can.
 *
 * The output must read as serializable data: no functions or symbols.
 *
 * Reads, suspends, and fails like `useClientResource`.
 */
export const useResource = <
  Outputs extends [unknown] & {
    [Index in keyof Outputs]: SerializableOutput<Outputs[Index]>;
  },
>(
  flow: Flow<[], Outputs>,
): Resource<Reduce<Outputs[0]>> => {
  const compute = holdFlow(flow);
  const mounted = useMounted();

  // Hydration reuses the server's value for the `initial` key and skips
  // the fetcher. Mounting changes the key, so the client computes the
  // flow for itself and the value goes live.
  const [output] = createResource(
    () => (mounted() ? 'hydrated' : 'initial'),
    () =>
      // The server hands its value to the client as serialized data, so
      // it sends a plain snapshot: wrappers carry accessors and cleanups.
      isServer ? compute().then(reduce) : compute(),
  );

  // A resource suspends while it loads, even with a value in hand. Read
  // the server's value through the refetch instead of flashing the
  // fallback.
  const read = () =>
    reduce(output.state === 'refreshing' ? output.latest : output());

  // eslint-disable-next-line solid/reactivity -- Returned as the accessor; callers track it.
  return forwardResource(output, read);
};
