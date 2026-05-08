import type { Component } from 'solid-js';
import { Flex, Text } from '@lib/ui';
import type { IconEditorState } from '../state';
import * as css from './spec.css';

interface SpecProps {
  /** Snapshot to render. */
  state: IconEditorState;
  /** Visual treatment. `bar` paints a panel background. @default 'bar' */
  variant?: 'bar' | 'plain';
}

/** Compact one-line readout of the icon's current settings. */
export const Spec: Component<SpecProps> = (props) => {
  const variant = () => props.variant ?? 'bar';
  return (
    <Flex
      as="div"
      align="center"
      gap={2}
      class={variant() === 'bar' ? css.bar : ''}
      aria-label="Current icon spec"
    >
      <Text as="span" size={1} color="lowContrast" selectable={true}>
        {props.state.icon.name}
      </Text>
      <Text as="span" size={1} class={css.dot} selectable={false}>
        ·
      </Text>
      <Text as="span" size={1} color="lowContrast" selectable={true}>
        {props.state.palette}
      </Text>
      <Text as="span" size={1} class={css.dot} selectable={false}>
        ·
      </Text>
      <Text as="span" size={1} color="lowContrast" selectable={false}>
        {props.state.shape}
      </Text>
      <Text as="span" size={1} class={css.dot} selectable={false}>
        ·
      </Text>
      <Text as="span" size={1} color="lowContrast" selectable={false}>
        {props.state.padding}% pad
      </Text>
    </Flex>
  );
};
