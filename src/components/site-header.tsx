import { Show } from 'solid-js';
import { Box, Flex, Text } from '#ui';
import IconApps from 'virtual:icons/mdi/apps';
import * as css from './site-header.css';

export default function SiteHeader(props: { title?: string }) {
  return (
    <Flex as="header" align="center" gap={4} px={4} py={2} class={css.header}>
      <a href="/" class={css.logoLink}>
        <IconApps width="24" height="24" />
      </a>
      <Show when={props.title}>
        <Box as="div" class={css.divider} />
        <Text as="span" size={2} weight="medium" color="lowContrast">
          {props.title}
        </Text>
      </Show>
    </Flex>
  );
}
