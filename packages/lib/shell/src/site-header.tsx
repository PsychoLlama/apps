import { For, Show } from 'solid-js';
import { Title } from '@solidjs/meta';
import { Flex, Link, LinkButton, Text } from '@lib/ui';
import IconApps from 'virtual:icons/mdi/apps';
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
    <Flex as="header" align="center" gap={4} px={4} py={2} class={css.header}>
      <LinkButton testId="home" href="/" variant="ghost" color="neutral">
        <IconApps width="24" height="24" />
      </LinkButton>

      <Show when={documentTitle()} keyed>
        {(value) => <Title>{value}</Title>}
      </Show>

      <For each={crumbs()}>
        {(crumb) => (
          <>
            <Flex as="div" class={css.divider} />
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
  );
}
