import { Match, Switch } from 'solid-js';
import { Code, Text } from '@lib/ui';
import type { AttributeValue as Value } from './log-context';
import * as css from './log-panel.css';

/**
 * One attribute value, styled by its JSON type so a glance tells `"3"`
 * from `3`, colored the way Chrome DevTools colors inspected values:
 * strings as cyan JSON literals, quoted and escaped so their bounds are
 * unambiguous, numbers and booleans as violet literals, `null` muted,
 * arrays and empty objects as compact JSON.
 */
export const AttributeValue = (props: { value: Value }) => (
  <Switch fallback={<Literal>{JSON.stringify(props.value)}</Literal>}>
    <Match when={typeof props.value === 'string'}>
      <Literal class={css.string}>{JSON.stringify(props.value)}</Literal>
    </Match>
    <Match
      when={typeof props.value === 'number' || typeof props.value === 'boolean'}
    >
      <Literal class={css.primitive}>{JSON.stringify(props.value)}</Literal>
    </Match>
    <Match when={props.value === null}>
      <Text as="span" size={1} color="lowContrast" selectable>
        null
      </Text>
    </Match>
  </Switch>
);

const Literal = (props: { class?: string; children: string }) => (
  <Code
    size={1}
    variant="ghost"
    color="neutral"
    class={props.class ? `${css.literal} ${props.class}` : css.literal}
  >
    {props.children}
  </Code>
);
