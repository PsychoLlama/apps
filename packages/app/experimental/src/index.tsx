import { For } from 'solid-js';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { Flex, Heading, RadioGroupItem, RadioGroupRoot, Text } from '@lib/ui';
import {
  FloatingContainer,
  anchor,
  type FloatingAlignment,
  type FloatingSide,
} from '@lib/ui/_internal/floating-ui';
import { useAction } from '@lib/state';
import { floatingControls, setAlign, setSide } from './store';
import * as css from './index.css';

const SIDES = [
  'top',
  'right',
  'bottom',
  'left',
] as const satisfies FloatingSide[];
const ALIGNMENTS = [
  'start',
  'center',
  'end',
] as const satisfies FloatingAlignment[];

/** A labeled radio group binding one placement axis to the controls store. */
const PlacementControl = <Value extends string>(props: {
  label: string;
  name: string;
  value: Value;
  options: readonly Value[];
  onValueChange: (value: Value) => void;
}) => {
  return (
    <Flex as="div" direction="column" gap={2}>
      <Text as="p" size={2} weight="medium" selectable={false}>
        {props.label}
      </Text>
      <RadioGroupRoot
        testId={`control-${props.name}`}
        name={props.name}
        value={props.value}
        onValueChange={(value) => props.onValueChange(value as Value)}
        orientation="horizontal"
        aria-label={props.label}
      >
        <For each={props.options}>
          {(option) => (
            <RadioGroupItem value={option} testId={`${props.name}-${option}`}>
              {option}
            </RadioGroupItem>
          )}
        </For>
      </RadioGroupRoot>
    </Flex>
  );
};

export const Experimental = () => {
  const controls = floatingControls;
  const chooseSide = useAction(setSide);
  const chooseAlign = useAction(setAlign);

  return (
    <Frame>
      <SiteHeader title="Experimental" />
      <FrameBody>
        <Flex as="section" direction="row" wrap="wrap" gap={6}>
          <PlacementControl
            label="Side"
            name="side"
            value={controls.side}
            options={SIDES}
            onValueChange={chooseSide}
          />
          <PlacementControl
            label="Align"
            name="align"
            value={controls.align}
            options={ALIGNMENTS}
            onValueChange={chooseAlign}
          />
        </Flex>

        <Flex as="div" grow align="center" justify="center">
          <Flex as="section" class={`${css.target} ${anchor}`}>
            <FloatingContainer
              side={controls.side}
              align={controls.align}
              arrow={{ visible: true, width: 16, height: 8, class: css.arrow }}
            >
              <Flex as="div" direction="column" gap={1} class={css.surface}>
                <Heading as="h2" size={3} selectable={false}>
                  Floating Window
                </Heading>
                <Text as="p" size={2} selectable={false}>
                  A taller surface so the arrow has room to sit mid-height when
                  the window binds to the left or right edge.
                </Text>
              </Flex>
            </FloatingContainer>
          </Flex>
        </Flex>
      </FrameBody>
    </Frame>
  );
};
