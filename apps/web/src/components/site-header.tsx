import { Show } from 'solid-js';
import { Flex, LinkButton, Text } from '@psychollama/ui';
import IconApps from 'virtual:icons/mdi/apps';
import * as css from './site-header.css';

export default function SiteHeader(props: { title?: string }) {
  return (
    <Flex as="header" align="center" gap={4} px={4} py={2} class={css.header}>
      <LinkButton testId="home" href="/" variant="ghost" color="neutral">
        <IconApps width="24" height="24" />
      </LinkButton>

      <Show when={props.title}>
        <Flex as="div" class={css.divider} />
        <Text
          as="span"
          size={2}
          weight="medium"
          color="lowContrast"
          selectable={false}
        >
          {props.title}
        </Text>
      </Show>
    </Flex>
  );
}
