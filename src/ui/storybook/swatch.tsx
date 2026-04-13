import type { ParentComponent } from 'solid-js';
import { Text, Box } from '#ui';
import * as css from './swatch.css';

/** Decorative placeholder for layout stories. Diagonal neutral stripes with a centered label. */
const Swatch: ParentComponent = (props) => (
  <Box as="div" class={css.swatch}>
    <Text
      as="span"
      size={2}
      weight="bold"
      color="lowContrast"
      selectable={false}
    >
      {props.children}
    </Text>
  </Box>
);

/** Generate `count` numbered swatches. */
export const swatches = (count: number) =>
  Array.from({ length: count }, (_, i) => <Swatch>{i + 1}</Swatch>);
