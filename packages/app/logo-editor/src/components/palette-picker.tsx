import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { PALETTES, type PaletteName } from '../palette';
import * as css from './palette-picker.css';

interface PalettePickerProps {
  /** Currently selected palette name. */
  value: PaletteName;
  /** Called when the user picks a different palette. */
  onChange: (name: PaletteName) => void;
}

/** Grid of named primary palettes, each rendered as its `solid[9]` swatch. */
export const PalettePicker: Component<PalettePickerProps> = (props) => {
  return (
    // The grid is a `<div>` so each swatch can sit in an
    // `auto-fill`/`minmax` track; @lib/ui Grid caps at fixed columns.
    // eslint-disable-next-line custom/require-ui-primitives
    <div class={css.grid} role="radiogroup" aria-label="Palette">
      <For each={PALETTES}>
        {(option) => {
          const selected = () => props.value === option.name;
          return (
            // Custom-styled swatch chip — Button's variant matrix doesn't
            // express a tiny color-only target.
            // eslint-disable-next-line custom/require-ui-primitives
            <button
              type="button"
              role="radio"
              aria-checked={selected()}
              aria-label={option.name}
              title={option.name}
              class={css.swatch}
              classList={{ [css.swatchActive]: selected() }}
              style={{ 'background-color': option.bg }}
              onClick={() => props.onChange(option.name)}
            />
          );
        }}
      </For>
    </div>
  );
};
