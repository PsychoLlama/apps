import type { ParentComponent } from 'solid-js';
import { Flex, Text } from '@lib/ui';
import * as css from './inline-field.css';

interface InlineFieldProps {
  /** Label text rendered to the left of the control. */
  label: string;
  /** Optional ID to associate the label with a control. */
  for?: string;
}

/**
 * Dense one-row control: fixed-width label on the left, control on
 * the right. Used to cram a Photoshop-style inspector panel into a
 * narrow rail without sacrificing scannability.
 */
export const InlineField: ParentComponent<InlineFieldProps> = (props) => {
  return (
    <Flex as="div" align="center" gap={3}>
      <Text
        as="label"
        for={props.for}
        size={1}
        weight="medium"
        color="lowContrast"
        class={css.label}
        selectable={false}
      >
        {props.label}
      </Text>
      <Flex as="div" grow class={css.control}>
        {props.children}
      </Flex>
    </Flex>
  );
};
