import { Match, Switch } from 'solid-js';
import { Code, Text } from '@lib/ui';
import type { AttributeValue as Value } from './log-context';
import * as css from './log-panel.css';

/**
 * One attribute value, styled by its JSON type so a glance tells `"3"`
 * from `3`: strings as plain text, numbers and booleans as colored
 * literals, `null` muted, arrays and empty objects as compact JSON. An
 * empty string has no text to show, so it falls through to `""`.
 */
export const AttributeValue = (props: { value: Value }) => (
  <Switch
    fallback={<Literal color="neutral">{JSON.stringify(props.value)}</Literal>}
  >
    <Match when={typeof props.value === 'string' && props.value}>
      {(text) => (
        <Text as="span" size={1} selectable class={css.stringValue}>
          {text()}
        </Text>
      )}
    </Match>
    <Match when={typeof props.value === 'number'}>
      <Literal color="accent">{JSON.stringify(props.value)}</Literal>
    </Match>
    <Match when={typeof props.value === 'boolean'}>
      <Literal color="warning">{JSON.stringify(props.value)}</Literal>
    </Match>
    <Match when={props.value === null}>
      <Text as="span" size={1} color="lowContrast" selectable>
        null
      </Text>
    </Match>
  </Switch>
);

const Literal = (props: {
  color: 'accent' | 'neutral' | 'warning';
  children: string;
}) => (
  <Code size={1} variant="ghost" color={props.color} class={css.literal}>
    {props.children}
  </Code>
);
