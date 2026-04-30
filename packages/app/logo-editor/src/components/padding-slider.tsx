import type { Component } from 'solid-js';
import { Flex, Text } from '@lib/ui';
import * as css from './padding-slider.css';

interface PaddingSliderProps {
  /** Padding value (`0`–`max`) controlling icon-to-canvas breathing room. */
  value: number;
  /** Called whenever the user adjusts the slider. */
  onInput: (value: number) => void;
  /** Maximum padding percent. @default 40 */
  max?: number;
  /** ID assigned to the slider input — pair with a label. */
  inputId?: string;
}

/** Range input that controls icon padding as a percentage of the canvas. */
export const PaddingSlider: Component<PaddingSliderProps> = (props) => {
  const max = () => props.max ?? 40;
  return (
    <Flex as="div" align="center" gap={3}>
      <input
        id={props.inputId}
        type="range"
        min={0}
        max={max()}
        step={1}
        value={props.value}
        class={css.slider}
        onInput={(event) =>
          props.onInput(Number(event.currentTarget.value) || 0)
        }
        aria-valuemin={0}
        aria-valuemax={max()}
        aria-valuenow={props.value}
      />
      <Text as="span" size={2} class={css.value} selectable={false}>
        {props.value}%
      </Text>
    </Flex>
  );
};
