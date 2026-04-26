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
 * - Active state is driven by an explicit `active` prop on `TabNavLink`.
 *   We don't auto-detect from the current route — consumers wire
 *   `useMatch()` themselves to keep matching semantics in their hands.
 * - Built on plain `<nav><ul><li><a>` (no Radix NavigationMenu primitive).
 *   Active link receives `aria-current="page"`.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tab-nav
 */

import { A, type AnchorProps } from '@solidjs/router';
import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as shared from '../tabs/shared.css';
import * as css from './tab-nav.css';

// --- Root ---

type TabNavSize = 1 | 2;
type TabNavColor = 'accent' | 'neutral';
type TabNavJustify = 'start' | 'center' | 'end';
type TabNavWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/** `TabNav.Root` props. Wraps a `<nav>` with an inner `<ul>` styled like a tab list. */
export interface TabNavRootProps extends MarginProps, TestIdProps {
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
  /** Additional class for the `<nav>` element. */
  class?: string;
  /** `TabNav.Link` children. */
  children?: JSX.Element;
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
  const [local] = splitProps(withoutTid, [
    'aria-label',
    'size',
    'color',
    'highContrast',
    'justify',
    'wrap',
    'class',
    'children',
  ]);

  const contrast = () => (local.highContrast ? 'high' : 'normal');

  const navClassName = () =>
    [...resolveMarginClasses(margin), local.class].filter(Boolean).join(' ');

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
    <nav
      aria-label={local['aria-label']}
      class={navClassName()}
      data-testid={tid.testId}
    >
      <ul role="list" class={listClassName()}>
        {local.children}
      </ul>
    </nav>
  );
};

// --- Link ---

/** `TabNav.Link` props. Renders `<li><A href=...>` from `@solidjs/router`. */
export interface TabNavLinkProps extends TestIdProps, AnchorProps {
  /**
   * Mark the link as the current page. Sets `aria-current="page"` and
   * applies the active visual indicator. Consumers compute this from
   * their router (e.g. `useMatch(href)`).
   * @default false
   */
  active?: boolean;
}

/** A single nav link. Always renders a routing `<A>` inside an `<li>`. */
export const TabNavLink: ParentComponent<TabNavLinkProps> = (rawProps) => {
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['active', 'class', 'children']);

  const isActive = () => local.active === true;

  const className = () =>
    [shared.trigger, isActive() && shared.triggerActive, local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <li class={css.item}>
      <A
        class={className()}
        aria-current={isActive() ? 'page' : undefined}
        data-testid={tid.testId}
        {...rest}
      >
        <span class={shared.triggerInner}>{local.children}</span>
        <span aria-hidden="true" class={shared.triggerInnerHidden}>
          {local.children}
        </span>
      </A>
    </li>
  );
};
