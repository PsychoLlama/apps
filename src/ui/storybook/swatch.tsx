import type { ParentComponent } from 'solid-js';
import { Flex, Text } from '#ui';
import * as css from './swatch.css';

/** Decorative placeholder for layout stories. Diagonal neutral stripes with a centered label. */
const Swatch: ParentComponent = (props) => (
  <Flex as="div" align="center" justify="center" class={css.swatch}>
    <Text
      as="span"
      size={2}
      weight="bold"
      color="lowContrast"
      selectable={false}
    >
      {props.children}
    </Text>
  </Flex>
);

/** Generate `count` numbered swatches. */
export const swatches = (count: number) =>
  Array.from({ length: count }, (_, i) => <Swatch>{i + 1}</Swatch>);
