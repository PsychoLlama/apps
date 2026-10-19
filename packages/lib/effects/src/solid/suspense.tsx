import {
  children,
  Suspense as SolidSuspense,
  type ComponentProps,
  type JSX,
} from 'solid-js';
import { useMounted } from './context';

/**
 * Props for {@link Suspense}: Solid's, plus `prerender`. `fallback` shows
 * from pre-render until the children resolve.
 */
export interface SuspenseProps extends ComponentProps<typeof SolidSuspense> {
  /**
   * Shown in pre-rendered HTML and through hydration, then swapped for
   * `fallback` on mount. Omit it to show `fallback` the whole way.
   */
  readonly prerender?: JSX.Element;
}

/**
 * Solid's `Suspense` for apps that load data only on the client. Stock
 * `Suspense` expects SSR to resolve resources: pre-rendered without it,
 * the page ships content with no data, then flashes to the fallback once
 * the client starts loading. This one goes fallback → content: the
 * fallback (or `prerender`) is pre-rendered and kept through hydration,
 * and the children only swap in once `EffectsRoot` mounts, suspending as
 * usual until their resources resolve.
 */
export const Suspense = (props: SuspenseProps) => {
  const mounted = useMounted();

  // A key check, not a read: reading it would build the element.
  const hasPrerender = 'prerender' in props;

  // Resolved once and used as both the pre-mount content and the real
  // fallback, so it's created once and its nodes stay put when the
  // children suspend: Solid's `insert` sees the same nodes and leaves
  // them alone. With a `prerender`, it waits for mount instead, so
  // hydration never builds nodes the server didn't render.
  const fallback = children(() =>
    !hasPrerender || mounted() ? props.fallback : undefined,
  );

  // Stands in for the children until mount. Servers never fetch, so
  // rendering the children there would only pre-render them empty.
  // Hydration must render the same thing the server did.
  const premount = () => (hasPrerender ? props.prerender : fallback());

  return (
    <SolidSuspense fallback={fallback()}>
      {mounted() ? props.children : premount()}
    </SolidSuspense>
  );
};
