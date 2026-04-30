import type { ParentComponent } from 'solid-js';
import { Flex, Text } from '@lib/ui';

interface FieldProps {
  /** Label text rendered above the control. */
  label: string;
  /** ID of the control this label is associated with, when one exists. */
  for?: string;
}

/** Vertical label-over-input pair used across logo-editor control panels. */
export const Field: ParentComponent<FieldProps> = (props) => {
  return (
    <Flex as="div" direction="column" gap={1}>
      <Text
        as="label"
        for={props.for}
        size={2}
        weight="medium"
        selectable={false}
      >
        {props.label}
      </Text>
      {props.children}
    </Flex>
  );
};
