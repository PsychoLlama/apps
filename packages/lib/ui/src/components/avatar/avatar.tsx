/**
 * Avatar component.
 *
 * Ported from Radix UI Themes Avatar (which wraps the Avatar primitive).
 * Single component instead of a `Root`/`Image`/`Fallback` triple — the
 * loading state machine is fully internal, callers pass `src` and
 * `fallback` and we pick which to render.
 *
 * Deviations from Radix:
 * - Sizes collapse from 1–9 to 1–3 (24/32/40px) so they ride the local
 *   space scale; larger avatars are a job for a custom-styled wrapper.
 * - `radius` is a per-component prop, not a theme-level `data-radius`
 *   cascade.
 * - `color` accepts our five semantic palettes; no 26-accent surface.
 * - Drops `highContrast`.
 * - `alt` is required. The component owns an `<img>` and an unlabeled
 *   image is an accessibility regression.
 * - No `onLoadingStatusChange` callback. The state machine is internal;
 *   if a consumer needs to react to load state, they own the image.
 * - Image attribute forwarding is limited to `referrerPolicy` and
 *   `crossOrigin`. Radix forwards every `<img>` attribute. Our
 *   detached-`Image` loader fights `loading="lazy"` (the network
 *   request fires before the visible `<img>` mounts), and `srcset` /
 *   `sizes` would split request semantics between the loader and the
 *   visible image. Followup once a consumer actually needs them.
 *
 * @see https://www.radix-ui.com/themes/docs/components/avatar
 * @see https://www.radix-ui.com/primitives/docs/components/avatar
 */

import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  Show,
  splitProps,
  untrack,
} from 'solid-js';
import type { Component, JSX } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './avatar.css';

/** Visual size on a 1–3 scale. */
export type AvatarSize = 1 | 2 | 3;
/** Visual treatment for the fallback surface. */
export type AvatarVariant = 'solid' | 'soft';
/** Corner rounding. */
export type AvatarRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
/** Semantic color palette for the fallback surface. */
export type AvatarColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

type Status = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * `Avatar` props. The root spreads onto a `<span>`; image-specific
 * attrs (`src`, `alt`, `referrerPolicy`, `crossOrigin`) belong to the
 * inner `<img>` and are listed explicitly below.
 */
export interface AvatarProps
  extends
    MarginProps,
    SkeletonProps,
    TestIdProps,
    Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Image URL. When absent, the fallback renders immediately. */
  src?: string;
  /**
   * Image description. Required even when `src` is undefined — keeps
   * the accessible name stable while the image resolves and after
   * fallback takes over.
   */
  alt: string;
  /**
   * Content shown while the image loads or after it fails. Pass
   * initials, an icon, or any inline node.
   */
  fallback: JSX.Element;
  /**
   * Wait this many milliseconds before mounting the fallback. Useful
   * to suppress a flash when the image is likely to load quickly.
   * Once `delayMs` elapses (or fires immediately when undefined) the
   * fallback stays mounted until the image resolves successfully.
   */
  delayMs?: number;
  /** Visual size on a 1–3 scale. @default 2 */
  size?: AvatarSize;
  /** Fallback surface treatment. @default 'soft' */
  variant?: AvatarVariant;
  /** Fallback color palette. @default 'accent' */
  color?: AvatarColor;
  /** Corner rounding. @default 'full' */
  radius?: AvatarRadius;
  /** Forwarded to the inner `<img>`. */
  referrerPolicy?: JSX.ImgHTMLAttributes<HTMLImageElement>['referrerpolicy'];
  /** Forwarded to the inner `<img>`. */
  crossOrigin?: JSX.ImgHTMLAttributes<HTMLImageElement>['crossorigin'];
}

/**
 * User avatar with image + fallback. Shows the image once it loads;
 * falls back to `fallback` while loading or after an error.
 */
const Avatar: Component<AvatarProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'soft' as const,
      color: 'accent' as const,
      radius: 'full' as const,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'src',
    'alt',
    'fallback',
    'delayMs',
    'size',
    'variant',
    'color',
    'radius',
    'referrerPolicy',
    'crossOrigin',
    'class',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const [status, setStatus] = createSignal<Status>('idle');

  // Detached `Image` instance drives the load state — keeps the visible
  // `<img>` out of the tree until it's ready, so the fallback never
  // overlaps a half-painted image.
  createEffect(() => {
    const src = local.src;
    if (!src) {
      setStatus('idle');
      return;
    }

    setStatus('loading');
    const img = new Image();
    if (local.referrerPolicy) img.referrerPolicy = local.referrerPolicy;
    if (typeof local.crossOrigin === 'string') {
      img.crossOrigin = local.crossOrigin;
    }

    const handleLoad = () => setStatus('loaded');
    const handleError = () => setStatus('error');
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = src;

    // Cached images may already be `complete` before listeners attach;
    // resolve synchronously so the fallback doesn't flash on remount.
    if (img.complete && img.naturalWidth > 0) {
      setStatus('loaded');
    }

    onCleanup(() => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    });
  });

  // `delayMs` gates the fallback's first appearance for callers that
  // want to suppress a flash on fast loads. The gate only applies when
  // there's actually an image to wait on — without `src`, the fallback
  // is the only thing the component can show, so it renders right
  // away. Once flipped on, the gate stays on for the lifetime of the
  // component (Radix matches this). The initial read is `untrack`'d so
  // the lint rule sees a one-shot setup; subsequent prop changes are
  // picked up by the effect below.
  const [canRenderFallback, setCanRenderFallback] = createSignal(
    untrack(() => local.src === undefined || local.delayMs === undefined),
  );
  createEffect(() => {
    if (local.src === undefined || local.delayMs === undefined) {
      setCanRenderFallback(true);
      return;
    }
    const id = window.setTimeout(
      () => setCanRenderFallback(true),
      local.delayMs,
    );
    onCleanup(() => window.clearTimeout(id));
  });

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.cornerRadius[local.radius],
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const fallbackClass = () =>
    [css.fallback, css.variantColor[local.variant][local.color]].join(' ');

  // The root carries the accessible name so it stays stable across the
  // image/fallback swap. The inner `<img>` is decorative (`alt=""`) and
  // the fallback is `aria-hidden` — without this duplication AT users
  // would hear the image announced once and the fallback re-announced
  // (or vice versa) every time the load state flipped.
  return (
    <span
      role="img"
      aria-label={local.alt}
      class={className()}
      data-testid={tid.testId}
      {...skeletonProps}
    >
      <Show when={status() === 'loaded'}>
        <img
          class={css.image}
          src={local.src}
          alt=""
          referrerPolicy={local.referrerPolicy}
          crossOrigin={local.crossOrigin}
        />
      </Show>
      <Show when={status() !== 'loaded' && canRenderFallback()}>
        <span class={fallbackClass()} aria-hidden="true">
          {local.fallback}
        </span>
      </Show>
    </span>
  );
};

export default Avatar;
