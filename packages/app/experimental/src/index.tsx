import { For } from 'solid-js';
import type { RadiusScale } from '@lib/design';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import {
  Flex,
  Heading,
  RadioGroupItem,
  RadioGroupRoot,
  Slider,
  Switch,
  Text,
} from '@lib/ui';
import {
  FloatingContainer,
  anchor,
  type ArrowAlign,
  type FloatingAlignment,
  type FloatingSide,
} from '@lib/ui/_internal/floating-ui';
import { useAction } from '@lib/state';
import {
  floatingControls,
  setAlign,
  setAlignOffset,
  setArrowAlign,
  setPoint,
  setRadius,
  setSide,
  setSideOffset,
} from './store';
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
const ARROW_ALIGNMENTS = [
  'start',
  'center',
  'end',
] as const satisfies ArrowAlign[];
const RADII = ['1', '2', '3', '4', '5', '6'] as const;

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
  const chooseArrowAlign = useAction(setArrowAlign);
  const chooseRadius = useAction(setRadius);
  const chooseSideOffset = useAction(setSideOffset);
  const chooseAlignOffset = useAction(setAlignOffset);
  const choosePoint = useAction(setPoint);

  /** Re-place the bound point wherever the target box is clicked. */
  const placePoint = (event: MouseEvent & { currentTarget: HTMLElement }) => {
    // Ignore clicks that bubble out of the floating window itself.
    if (!controls.point || event.target !== event.currentTarget) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    choosePoint({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };

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
          <PlacementControl
            label="Arrow align"
            name="arrow-align"
            value={controls.arrowAlign}
            options={ARROW_ALIGNMENTS}
            onValueChange={chooseArrowAlign}
          />
          <PlacementControl
            label="Radius"
            name="radius"
            value={String(controls.radius)}
            options={RADII}
            onValueChange={(value) =>
              chooseRadius(Number(value) as RadiusScale)
            }
          />

          <Flex as="div" direction="column" gap={2} class={css.offsetControl}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Side offset ({controls.sideOffset}px)
            </Text>
            <Slider
              testId="control-side-offset"
              value={[controls.sideOffset]}
              onValueChange={([value = 0]) => chooseSideOffset(value)}
              min={0}
              max={32}
              aria-label="Side offset"
            />
          </Flex>

          <Flex as="div" direction="column" gap={2} class={css.offsetControl}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Align offset ({controls.alignOffset}px)
            </Text>
            <Slider
              testId="control-align-offset"
              value={[controls.alignOffset]}
              onValueChange={([value = 0]) => chooseAlignOffset(value)}
              min={-32}
              max={32}
              aria-label="Align offset"
            />
          </Flex>

          <Flex as="div" direction="column" gap={2}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Point mode
            </Text>
            <Switch
              testId="control-point"
              checked={controls.point !== null}
              onCheckedChange={(checked) =>
                choosePoint(checked ? { x: 96, y: 64 } : null)
              }
              aria-label="Point mode"
            />
            <Text as="p" size={1} selectable={false}>
              Click the target to move the point.
            </Text>
          </Flex>
        </Flex>

        <Flex as="div" grow align="center" justify="center">
          <Flex
            as="section"
            class={[css.target, anchor, controls.point && css.pointArmed]
              .filter(Boolean)
              .join(' ')}
            onClick={placePoint}
          >
            <FloatingContainer
              side={controls.side}
              align={controls.align}
              radius={controls.radius}
              sideOffset={controls.sideOffset}
              alignOffset={controls.alignOffset}
              point={controls.point ?? undefined}
              direction="column"
              gap={1}
              py={3}
              px={4}
              class={css.surface}
              arrow={{
                visible: true,
                base: 16,
                depth: 8,
                align: controls.arrowAlign,
                class: css.arrow,
              }}
            >
              <Heading as="h2" size={3} selectable={false}>
                Floating Window
              </Heading>
              <Text as="p" size={2} selectable={false}>
                A taller surface so the arrow has room to sit mid-height when
                the window binds to the left or right edge.
              </Text>
            </FloatingContainer>
          </Flex>
        </Flex>
      </FrameBody>
    </Frame>
  );
};
