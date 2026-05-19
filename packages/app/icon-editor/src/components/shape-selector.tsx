import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { Flex } from '@lib/ui';
import type { IconEditorShape } from '../store';
import * as css from './shape-selector.css';

interface ShapeSelectorProps {
  /** Currently selected shape mask. */
  value: IconEditorShape;
  /** Called when the user selects a different shape. */
  onChange: (shape: IconEditorShape) => void;
}

interface ShapeOption {
  value: IconEditorShape;
  /** Human label exposed via `aria-label`; the swatch shape carries the visual cue. */
  label: string;
  /** Border radius applied to the swatch chip, in CSS. */
  swatchRadius: string;
}

const OPTIONS: ReadonlyArray<ShapeOption> = [
  { value: 'square', label: 'Square', swatchRadius: '0' },
  { value: 'rounded', label: 'Rounded', swatchRadius: '18%' },
  { value: 'squircle', label: 'Squircle', swatchRadius: '32%' },
  { value: 'circle', label: 'Circle', swatchRadius: '50%' },
];

/** Segmented control that selects the canvas shape mask. */
export const ShapeSelector: Component<ShapeSelectorProps> = (props) => {
  return (
    // CSS Grid radiogroup — Grid component caps at fixed columns; this
    // four-up segmented layout is shape-specific.
    // eslint-disable-next-line custom/require-ui-primitives
    <div class={css.group} role="radiogroup" aria-label="Shape">
      <For each={OPTIONS}>
        {(option) => (
          // Custom-styled radio segment: Button doesn't compose with the
          // ARIA radio role and the swatch-only layout.
          // eslint-disable-next-line custom/require-ui-primitives
          <button
            type="button"
            role="radio"
            aria-checked={props.value === option.value}
            aria-label={option.label}
            class={css.option}
            classList={{ [css.optionActive]: props.value === option.value }}
            onClick={() => props.onChange(option.value)}
          >
            <Flex
              as="div"
              class={css.swatch}
              style={{ 'border-radius': option.swatchRadius }}
              aria-hidden="true"
            />
          </button>
        )}
      </For>
    </div>
  );
};
