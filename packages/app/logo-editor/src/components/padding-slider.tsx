import type { Component } from 'solid-js';
import { Flex, Slider, Text } from '@lib/ui';
import * as css from './padding-slider.css';

interface PaddingSliderProps {
  /** Padding value (`0`–`max`) controlling icon-to-canvas breathing room. */
  value: number;
  /** Called whenever the user adjusts the slider. */
  onInput: (value: number) => void;
  /** Maximum padding percent. @default 40 */
  max?: number;
}

/** Slider that controls icon padding as a percentage of the canvas. */
export const PaddingSlider: Component<PaddingSliderProps> = (props) => {
  const max = () => props.max ?? 40;
  return (
    <Flex as="div" align="center" gap={3} grow>
      <Slider
        testId="padding-slider"
        aria-label="Padding"
        min={0}
        max={max()}
        step={5}
        value={[props.value]}
        onValueChange={(values) => props.onInput(values[0] ?? 0)}
      />
      <Text as="span" size={2} class={css.value} selectable={false}>
        {props.value}%
      </Text>
    </Flex>
  );
};
