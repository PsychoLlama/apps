import { For, Show } from 'solid-js';
import { Callout, Code, Flex, Text } from '@lib/ui';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import { errorChain } from './error-chain';

/**
 * An entry's third line, present only when the log carries a `context.error`.
 * A danger callout listing the error and its `cause` chain, outermost first,
 * with each deeper cause prefixed "caused by" so a hydrated chain reads
 * top-down. The error type comes through as monospace; the message trails it.
 */
export const ErrorDetails = (props: { error: Error }) => (
  <Callout size={1} color="danger" icon={<IconAlert />}>
    <Flex as="div" direction="column" gap={1}>
      <For each={errorChain(props.error)}>
        {(frame, index) => (
          <Text as="p" size={1} selectable>
            <Show when={index() > 0}>caused by </Show>
            <Code size={1} variant="ghost" color="danger">
              {frame.name}
            </Code>
            <Show when={frame.message}>{`: ${frame.message}`}</Show>
          </Text>
        )}
      </For>
    </Flex>
  </Callout>
);
