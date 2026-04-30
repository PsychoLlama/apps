/**
 * TabNav component.
 *
 * Ported from Radix UI Themes TabNav. A horizontal navigation strip of
 * routing links styled to match `TabsList`. Exported as two flat
 * components — `TabNavRoot` and `TabNavLink` — composed by the consumer.
 * Visual scaffolding is shared with Tabs via `../tabs/shared.css.ts`.
 *
 * Deviations from Radix:
 * - Accent and neutral palettes only.
 * - `aria-label` on `TabNavRoot` is required.
 * - Active state is required and explicit — consumers compute it from
 *   their router. Defaulting it would silently strip `aria-current`
 *   from the nav whenever a consumer forgot to wire it up.
 * - Built on plain `<nav><ul><li><a>` (no Radix NavigationMenu primitive).
 *   Active link receives `aria-current="page"`. Arrow keys and Home/End
 *   move focus between links (no looping, matching Radix).
 *
 * @see https://www.radix-ui.com/themes/docs/components/tab-nav
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
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
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { callConsumerHandler } from '../compose-event-handler';
import Flex from '../flex/flex';
import * as shared from '../tabs/shared.css';

// --- Root ---

type TabNavSize = 1 | 2;
type TabNavColor = 'accent' | 'neutral';
type TabNavJustify = 'start' | 'center' | 'end';
type TabNavWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/** `TabNavRoot` props. Wraps a `<nav>` with an inner `<ul>` styled like a tab list. */
export interface TabNavRootProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    JSX.HTMLAttributes<HTMLElement> {
  /**
   * Accessible name for the navigation landmark. Required so assistive
   * tech can disambiguate this nav from any other on the page.
   */
  'aria-label': string;
  /** Visual size on a 1–2 scale. @default 2 */
  size?: TabNavSize;
  /** Indicator and active-text color. @default 'accent' */
  color?: TabNavColor;
  /** Use the strongest color step for the active indicator. @default false */
  highContrast?: boolean;
  /** Link alignment along the row. @default 'start' */
  justify?: TabNavJustify;
  /** Flex-wrap behavior. @default 'nowrap' */
  wrap?: TabNavWrap;
}

/** Navigation strip styled like a tab list. Renders `<nav><ul role="list">`. */
export const TabNavRoot: ParentComponent<TabNavRootProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      color: 'accent' as const,
      highContrast: false,
      justify: 'start' as const,
      wrap: 'nowrap' as const,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'color',
    'highContrast',
    'justify',
    'wrap',
    'class',
    'children',
    ...skeletonPropKeys,
  ]);
  const skel = useSkeleton(local, rest);

  const contrast = () => (local.highContrast ? 'high' : 'normal');

  const navClassName = () =>
    [...resolveMarginClasses(margin), skel.class(), local.class]
      .filter(Boolean)
      .join(' ');

  const listClassName = () =>
    [
      shared.list,
      shared.size[local.size],
      shared.justify[local.justify],
      shared.wrap[local.wrap],
      shared.color[local.color][contrast()],
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <nav {...skel.rest} class={navClassName()} data-testid={tid.testId}>
      <ul role="list" class={listClassName()}>
        {local.children}
      </ul>
    </nav>
  );
};

// --- Link ---

/**
 * `TabNavLink` props. Renders `<li><a>` with the routing `link` attribute
 * so `@solidjs/router`'s delegated click handler intercepts navigation
 * for in-app routing.
 */
export interface TabNavLinkProps
  extends RequiredTestIdProps, JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Whether this link represents the current page. When `true`, sets
   * `aria-current="page"` and applies the active visual indicator.
   * Compute from your router (e.g. `useMatch(href)`).
   */
  active: boolean;
  /** Destination URL. */
  href: string;
}

/**
 * A single nav link. Renders a plain `<a attr:link="">` rather than
 * `<A>` from `@solidjs/router` so the consumer's explicit `active` prop
 * stays the sole source of truth for `aria-current` (Solid Router's
 * `<A>` auto-injects `aria-current="page"` on a route match, with no
 * way to suppress it).
 */
export const TabNavLink: ParentComponent<TabNavLinkProps> = (rawProps) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'active',
    'class',
    'children',
    'onKeyDown',
  ]);

  const className = () =>
    [shared.trigger, local.active && shared.triggerActive, local.class]
      .filter(Boolean)
      .join(' ');

  const onKeyDown: JSX.EventHandler<HTMLAnchorElement, KeyboardEvent> = (
    event,
  ) => {
    callConsumerHandler(local.onKeyDown, event);
    if (event.defaultPrevented) return;
    const target = neighborLink(event.currentTarget, event.key);
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <Flex as="li">
      <a
        {...rest}
        // The `link` attribute opts the anchor into solid-router's
        // delegated click handler, giving us in-app routing without
        // `<A>`'s auto `aria-current` injection.
        ref={(el) => el.setAttribute('link', '')}
        class={className()}
        aria-current={local.active ? 'page' : undefined}
        data-testid={tid.testId}
        onKeyDown={onKeyDown}
      >
        <span class={shared.triggerInner}>{local.children}</span>
      </a>
    </Flex>
  );
};

// --- Helpers ---

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/**
 * Resolve the link to focus next, given the current link and a keyboard
 * key. Walks the parent `<ul>` for siblings and skips no items — Radix's
 * NavigationMenu treats every link as a focus group member without a
 * skip-disabled rule. Returns `undefined` when the key isn't a focus
 * navigation key or the move would step past either end (no looping).
 */
const neighborLink = (
  current: HTMLAnchorElement,
  key: string,
): HTMLAnchorElement | undefined => {
  const list = current.closest('ul');
  if (!list) return undefined;
  const links = Array.from(list.querySelectorAll<HTMLAnchorElement>('a[link]'));
  const idx = links.indexOf(current);
  if (idx === -1) return undefined;

  if (key === 'Home') return links[0];
  if (key === 'End') return links[links.length - 1];
  if (NEXT_KEYS.has(key)) return links[idx + 1];
  if (PREV_KEYS.has(key)) return links[idx - 1];
  return undefined;
};
