import { For, Show } from 'solid-js';
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
 * Top-of-page chrome for app routes. Renders a breadcrumb rooted at the
 * launcher — `Apps › <page>` — so the way home is labeled rather than
 * implied. Suite-level actions (settings, source) live on the launcher
 * itself, not here; the launcher doesn't render this header at all.
 */
export default function SiteHeader(props: {
  /** Single-page label. Shorthand for `trail={[{ label: title }]}`. */
  title?: string;
  /** Multi-segment breadcrumb. Wins over `title` when both are set. */
  trail?: SiteHeaderCrumb[];
}) {
  const crumbs = (): SiteHeaderCrumb[] => {
    if (props.trail && props.trail.length > 0) return props.trail;
    if (props.title) return [{ label: props.title }];
    return [];
  };

  // Document title mirrors the current page — the trailing crumb when a
  // breadcrumb is active, otherwise the bare title.
  const documentTitle = (): string | undefined => {
    const list = crumbs();
    return list.length > 0 ? list[list.length - 1].label : undefined;
  };

  return (
    <Flex as="header" align="center" px={4} class={css.header}>
      <Show when={documentTitle()} keyed>
        {(value) => <Title>{value}</Title>}
      </Show>

      <Flex as="nav" align="center" gap={2} aria-label="Breadcrumb">
        <LinkButton testId="home" href="/" variant="ghost" color="neutral">
          <IconApps width="18" height="18" />
          Apps
        </LinkButton>

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
    </Flex>
  );
}
