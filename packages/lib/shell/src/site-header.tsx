import { children, For, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { Title } from '@solidjs/meta';
import { Flex, Link, LinkButton, Text } from '@lib/ui';
import IconApps from 'virtual:icons/mdi/apps';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import * as css from './site-header.css';

/**
 * One segment of the header's breadcrumb. Pass `href` to make it a
 * link; the trailing crumb (current page) typically omits it and
 * renders as plain text.
 */
export interface SiteHeaderCrumb {
  label: string;
  href?: string;
  /** Override the default crumb test id. */
  testId?: string;
}

/**
 * Persistent top-of-page chrome shared by every route. Renders a
 * breadcrumb rooted at the launcher: app pages read `Apps › <page>`
 * with the root linking home, while the launcher itself (no `title`
 * or `trail`) shows the root as a static wordmark — never a link to
 * the page you're already on.
 *
 * The whole bar is uniformly low-contrast at rest — it's chrome, not
 * content. Each signal gets its own channel: weight marks location
 * (the current segment is medium, plus `aria-current`), and affordance
 * comes from the design system's interactive treatments — the root is
 * a ghost button (hit-area plus hover fill), and ancestor crumbs keep
 * the persistent neutral-link underline. Contrast deliberately encodes
 * nothing.
 */
export default function SiteHeader(props: {
  /** Single-page label. Shorthand for `trail={[{ label: title }]}`. */
  title?: string;
  /** Multi-segment breadcrumb. Wins over `title` when both are set. */
  trail?: SiteHeaderCrumb[];
  /**
   * Controls pinned to the trailing edge. Reserved for suite-level
   * actions — the launcher passes its settings button here; app pages
   * leave it empty so global controls aren't mistaken for app ones.
   */
  actions?: JSX.Element;
}) {
  // Resolve the slot once. JSX props compile to getters that build a
  // fresh element on every access — reading `props.actions` more than
  // once would create duplicate elements and corrupt SSR hydration.
  const actions = children(() => props.actions);

  const crumbs = (): SiteHeaderCrumb[] => {
    if (props.trail && props.trail.length > 0) return props.trail;
    if (props.title) return [{ label: props.title }];
    return [];
  };

  // Document title mirrors the current page, reading specific-to-general
  // so the active page leads (`@lib/ui | Gallery`). Falls back to the
  // launcher's bare wordmark when no breadcrumb is active.
  const documentTitle = (): string => {
    const list = crumbs();
    if (list.length === 0) return 'Apps';
    return list
      .map((crumb) => crumb.label)
      .reverse()
      .join(' | ');
  };

  return (
    <Flex as="header" align="center" gap={4} px={4} class={css.header}>
      <Title>{documentTitle()}</Title>

      <Flex
        as="nav"
        align="center"
        gap={2}
        aria-label="Breadcrumb"
        class={css.nav}
      >
        <Show
          when={crumbs().length > 0}
          fallback={
            <Flex
              as="div"
              align="center"
              gap={1}
              aria-current="page"
              class={css.brand}
            >
              <IconApps width="18" height="18" aria-hidden="true" />
              <Text
                as="span"
                size={2}
                weight="medium"
                color="lowContrast"
                selectable={false}
              >
                Apps
              </Text>
            </Flex>
          }
        >
          <LinkButton testId="home" href="/" variant="ghost" color="neutral">
            <IconApps width="18" height="18" />
            Apps
          </LinkButton>
        </Show>

        <For each={crumbs()}>
          {(crumb) => (
            <>
              <IconChevronRight
                width="16"
                height="16"
                aria-hidden="true"
                class={css.separator}
              />
              <Show
                when={crumb.href}
                fallback={
                  <Text
                    as="span"
                    size={2}
                    weight="medium"
                    color="lowContrast"
                    aria-current="page"
                    selectable={false}
                  >
                    {crumb.label}
                  </Text>
                }
                keyed
              >
                {(href) => (
                  <Link
                    testId={crumb.testId ?? 'breadcrumb'}
                    href={href}
                    size={2}
                    color="neutral"
                  >
                    {crumb.label}
                  </Link>
                )}
              </Show>
            </>
          )}
        </For>
      </Flex>

      <Show when={actions()}>
        <Flex as="div" align="center" gap={2} class={css.trailing}>
          {actions()}
        </Flex>
      </Show>
    </Flex>
  );
}
