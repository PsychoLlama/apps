import { For, Show } from 'solid-js';
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
  const crumbs = (): SiteHeaderCrumb[] => {
    if (props.trail && props.trail.length > 0) return props.trail;
    if (props.title) return [{ label: props.title }];
    return [];
  };

  // Document title mirrors the current page — the trailing crumb when
  // a breadcrumb is active, otherwise the launcher's bare wordmark.
  const documentTitle = (): string => {
    const list = crumbs();
    return list.length > 0 ? list[list.length - 1].label : 'Apps';
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
            <Flex as="div" align="center" gap={1} class={css.brand}>
              <IconApps width="18" height="18" aria-hidden="true" />
              <Text as="span" size={2} color="lowContrast" selectable={false}>
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
                    weight="medium"
                    color="neutral"
                    underline="hover"
                  >
                    {crumb.label}
                  </Link>
                )}
              </Show>
            </>
          )}
        </For>
      </Flex>

      <Show when={props.actions}>
        <Flex as="div" align="center" gap={2} class={css.trailing}>
          {props.actions}
        </Flex>
      </Show>
    </Flex>
  );
}
