import { For, type JSX } from 'solid-js';
import type { RadiusScale } from '@lib/design';
import { FrameBody, SiteHeader } from '@lib/shell';
import {
  Button,
  Checkbox,
  CheckboxCardsItem,
  CheckboxCardsRoot,
  Flex,
  Grid,
  Heading,
  RadioGroupItem,
  RadioGroupRoot,
  SegmentedControlItem,
  SegmentedControlRoot,
  Switch,
  Text,
  TextField,
} from '@lib/ui';
import {
  FloatingContainer,
  anchor,
  type ArrowAlign,
  type FloatingAlignment,
  type FloatingPoint,
  type FloatingSide,
  type TetherFallback,
  type TetherFlipOptions,
  type TetherOptions,
  type TetherPass,
} from '@lib/ui/_internal/floating-ui';
import { useAnchor, useCommit, useValue } from '@lib/state';
import {
  alignChanged,
  alignOffsetChanged,
  anchorCaptured,
  anchorElement,
  arrowAlignChanged,
  arrowBaseChanged,
  arrowDepthChanged,
  arrowVisibilityChanged,
  behaviorsChanged,
  controlsReset,
  flipModeChanged,
  floatingControls,
  pointChanged,
  radiusChanged,
  scratchpadScope,
  sideChanged,
  sideOffsetChanged,
  tetherDisabled,
  tetherPaddingChanged,
  TETHER_FEATURES,
  type FlipMode,
  type TetherBehavior,
} from '../state/floating-ui';
import * as css from './floating-ui.css';

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
const FLIP_MODES = ['auto', 'off', 'chain'] as const satisfies FlipMode[];

/**
 * The tether-behavior cards. Cards over bare checkboxes because each of
 * these needs a sentence to be meaningful — the label alone ("size")
 * says nothing about what turning it off costs.
 */
const TETHER_BEHAVIORS = [
  {
    value: 'shift',
    label: 'shift',
    hint: 'Slides the window along its bound edge to keep it inside the boundary.',
  },
  {
    value: 'size',
    label: 'size',
    hint: 'Measures the room left over and publishes it as CSS vars.',
  },
  {
    value: 'clamp',
    label: 'clamp to available',
    hint: 'Caps the surface to the room `size` reported, and scrolls the overflow.',
  },
] as const satisfies { value: TetherBehavior; label: string; hint: string }[];

/**
 * The chain the `chain` mode walks — a deliberately odd order so it's
 * obvious the tether follows the list rather than flipping to the
 * opposite side on its own.
 */
const FALLBACK_CHAIN = [
  { side: 'right' },
  { side: 'left' },
  { side: 'top' },
] as const satisfies TetherFallback[];

/** The flip pass a mode stands for. */
const flipFor = (mode: FlipMode): TetherPass<TetherFlipOptions> => {
  switch (mode) {
    case 'auto':
      return true;
    case 'off':
      return false;
    case 'chain':
      return { fallbacks: FALLBACK_CHAIN };
  }
};

/** A titled run of related controls, stacked one per row. */
const ControlGroup = (props: { label: string; children: JSX.Element }) => (
  <Flex as="section" direction="column" gap={5}>
    <Heading as="h2" size={4} selectable={false}>
      {props.label}
    </Heading>
    {props.children}
  </Flex>
);

/** The label (and optional note) every control shares. */
const ControlLabel = (props: { label: string; hint?: string }) => (
  <>
    <Text as="p" size={2} weight="medium" selectable={false}>
      {props.label}
    </Text>
    {props.hint && (
      <Text as="p" size={1} selectable={false} class={css.hint}>
        {props.hint}
      </Text>
    )}
  </>
);

/**
 * A labeled segmented control binding one named-mode axis to the store.
 * Every option here is a mode with a word for it, so a track of exclusive
 * segments reads better than a column of radios.
 */
const ChoiceControl = <Value extends string>(props: {
  label: string;
  name: string;
  value: Value;
  options: readonly Value[];
  onValueChange: (value: Value) => void;
}) => {
  return (
    <Flex as="div" direction="column" align="start" gap={2}>
      <ControlLabel label={props.label} />
      <SegmentedControlRoot
        testId={`control-${props.name}`}
        name={props.name}
        value={props.value}
        onValueChange={(value) => props.onValueChange(value as Value)}
        aria-label={props.label}
      >
        <For each={props.options}>
          {(option) => (
            <SegmentedControlItem
              value={option}
              testId={`${props.name}-${option}`}
            >
              {option}
            </SegmentedControlItem>
          )}
        </For>
      </SegmentedControlRoot>
    </Flex>
  );
};

/**
 * The surface's border radius. Stays a radio group where the named axes
 * went segmented: it's a six-step numeric ramp, and a track of bare
 * digits reads as a scale to sample rather than a set of modes to pick.
 */
const RadiusControl = (props: {
  value: RadiusScale;
  onValueChange: (radius: RadiusScale) => void;
}) => (
  <Flex as="div" direction="column" gap={2}>
    <ControlLabel label="Radius" />
    <RadioGroupRoot
      testId="control-radius"
      name="radius"
      value={String(props.value)}
      onValueChange={(value) =>
        props.onValueChange(Number(value) as RadiusScale)
      }
      orientation="horizontal"
      aria-label="Radius"
    >
      <For each={RADII}>
        {(option) => (
          <RadioGroupItem value={option} testId={`radius-${option}`}>
            {option}
          </RadioGroupItem>
        )}
      </For>
    </RadioGroupRoot>
  </Flex>
);

/**
 * A labeled number field binding one pixel-valued control to the store.
 * A field over a slider: these are exact values you want to type and
 * step, not a range to sweep, and the field shows the number outright.
 *
 * Commits on `input` so the window re-places as you step, but only for a
 * value the browser parsed — mid-edit an empty or half-typed field reads
 * back as `''`, and coercing that would snap the control to zero.
 */
const NumberControl = (props: {
  label: string;
  name: string;
  value: number;
  /** Floor, where one is real. Omit where the control takes negatives. */
  min?: number;
  onValueChange: (value: number) => void;
}) => (
  <Flex as="div" direction="column" gap={2} class={css.numberControl}>
    <ControlLabel label={props.label} />
    <TextField
      testId={`control-${props.name}`}
      type="number"
      value={String(props.value)}
      onInput={(event) => {
        const next = event.currentTarget.valueAsNumber;
        if (Number.isNaN(next)) return;

        props.onValueChange(next);
      }}
      min={props.min}
      right={
        <Text as="span" size={1} selectable={false} class={css.hint}>
          px
        </Text>
      }
      aria-label={props.label}
      autocomplete="off"
      autocapitalize={undefined}
      enterkeyhint={undefined}
    />
  </Flex>
);

/** A labeled switch binding one boolean control to the store. */
const ToggleControl = (props: {
  label: string;
  name: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <Flex as="div" direction="column" gap={2}>
    <ControlLabel label={props.label} hint={props.hint} />
    <Switch
      testId={`control-${props.name}`}
      checked={props.checked}
      onCheckedChange={props.onCheckedChange}
      aria-label={props.label}
    />
  </Flex>
);

/**
 * Parks a fresh scrollport in the middle of its canvas so the target —
 * centered there — starts in view, with a full port's worth of travel in
 * every direction. Deferred a frame because a `ref` fires before the
 * browser has laid the canvas out, when the scroll extent is still zero.
 */
const centerScroll = (element: HTMLElement) => {
  requestAnimationFrame(() => {
    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
  });
};

/**
 * The floating-UI experiment at `/scratchpad/floating-ui`: a hatched
 * target with a floating window bound to it, sitting in a scrolling
 * viewport so the anchor can be dragged toward a clipping edge, plus
 * controls for every placement input the container takes. Change one and
 * watch the window re-place live.
 */
const FloatingUiScratchpad = () => {
  useAnchor(scratchpadScope);
  const controls = useValue(floatingControls);
  const anchorEl = useValue(anchorElement);
  const commit = useCommit();

  const chooseSide = (side: FloatingSide) => commit(sideChanged(side));
  const chooseAlign = (align: FloatingAlignment) => commit(alignChanged(align));
  const chooseArrowAlign = (align: ArrowAlign) =>
    commit(arrowAlignChanged(align));
  const chooseRadius = (radius: RadiusScale) => commit(radiusChanged(radius));
  const chooseSideOffset = (offset: number) =>
    commit(sideOffsetChanged(offset));
  const chooseAlignOffset = (offset: number) =>
    commit(alignOffsetChanged(offset));
  const choosePoint = (point: FloatingPoint | null) =>
    commit(pointChanged(point));
  const chooseTetherDisabled = (disabled: boolean) =>
    commit(tetherDisabled(disabled));
  const chooseTetherPadding = (padding: number) =>
    commit(tetherPaddingChanged(padding));
  const chooseBehaviors = (behaviors: readonly string[]) =>
    commit(behaviorsChanged(behaviors as readonly TetherBehavior[]));
  const chooseFlipMode = (mode: FlipMode) => commit(flipModeChanged(mode));
  const resetControls = () => commit(controlsReset());
  const chooseArrowVisible = (visible: boolean) =>
    commit(arrowVisibilityChanged(visible));
  const chooseArrowBase = (base: number) => commit(arrowBaseChanged(base));
  const chooseArrowDepth = (depth: number) => commit(arrowDepthChanged(depth));
  const captureAnchor = (element: HTMLElement) =>
    commit(anchorCaptured(element));

  /** The behavior cards currently checked, as the group reads them. */
  const behaviors = (): TetherBehavior[] => [
    ...TETHER_FEATURES.filter((feature) => controls().features[feature]),
    ...(controls().clampToAvailable ? (['clamp'] as const) : []),
  ];

  /** The collision passes the tether runs, as it takes them. */
  const tetherOptions = (): TetherOptions => ({
    padding: controls().tetherPadding,
    flip: flipFor(controls().flipMode),
    ...controls().features,
  });

  /** Re-place the bound point wherever the target box is clicked. */
  const placePoint = (event: MouseEvent & { currentTarget: HTMLElement }) => {
    // Ignore clicks that bubble out of the floating window itself.
    if (!controls().point || event.target !== event.currentTarget) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    choosePoint({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };

  return (
    <>
      <SiteHeader
        trail={[
          { label: 'Scratchpad', href: '/scratchpad' },
          { label: 'Floating UI' },
        ]}
      />
      <FrameBody>
        <Flex as="div" direction="column" gap={7} class={css.column}>
          <Flex as="div" ref={centerScroll} class={css.stage}>
            <Flex as="div" align="center" justify="center" class={css.canvas}>
              <Flex
                as="section"
                ref={captureAnchor}
                class={[css.target, anchor, controls().point && css.pointArmed]
                  .filter(Boolean)
                  .join(' ')}
                onClick={placePoint}
              >
                <FloatingContainer
                  anchor={
                    controls().tetherDisabled
                      ? undefined
                      : (anchorEl() ?? undefined)
                  }
                  side={controls().side}
                  align={controls().align}
                  radius={controls().radius}
                  sideOffset={controls().sideOffset}
                  alignOffset={controls().alignOffset}
                  point={controls().point ?? undefined}
                  tether={tetherOptions()}
                  direction="column"
                  gap={1}
                  py={3}
                  px={4}
                  class={[
                    css.surface,
                    controls().clampToAvailable && css.clamped,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  arrow={{
                    visible: controls().arrowVisible,
                    base: controls().arrowBase,
                    depth: controls().arrowDepth,
                    align: controls().arrowAlign,
                    class: css.arrow,
                  }}
                >
                  <Heading as="h3" size={3} selectable={false}>
                    Floating Window
                  </Heading>
                  <Text as="p" size={2} selectable={false}>
                    A taller surface so the arrow has room to sit mid-height
                    when the window binds to the left or right edge.
                  </Text>
                </FloatingContainer>
              </Flex>
            </Flex>
          </Flex>

          <Grid as="div" class={css.configs}>
            <ControlGroup label="Container props">
              <ChoiceControl
                label="Side"
                name="side"
                value={controls().side}
                options={SIDES}
                onValueChange={chooseSide}
              />
              <ChoiceControl
                label="Align"
                name="align"
                value={controls().align}
                options={ALIGNMENTS}
                onValueChange={chooseAlign}
              />
              <RadiusControl
                value={controls().radius}
                onValueChange={chooseRadius}
              />
              <NumberControl
                label="Side offset"
                name="side-offset"
                value={controls().sideOffset}
                min={0}
                onValueChange={chooseSideOffset}
              />
              <NumberControl
                label="Align offset"
                name="align-offset"
                value={controls().alignOffset}
                onValueChange={chooseAlignOffset}
              />
              <ToggleControl
                label="Point mode"
                name="point"
                hint="Click the target to move the point."
                checked={controls().point !== null}
                onCheckedChange={(checked) =>
                  choosePoint(checked ? { x: 96, y: 64 } : null)
                }
              />
              <ToggleControl
                label="Arrow"
                name="arrow"
                checked={controls().arrowVisible}
                onCheckedChange={chooseArrowVisible}
              />
              <ChoiceControl
                label="Arrow align"
                name="arrow-align"
                value={controls().arrowAlign}
                options={ARROW_ALIGNMENTS}
                onValueChange={chooseArrowAlign}
              />
              <NumberControl
                label="Arrow base"
                name="arrow-base"
                value={controls().arrowBase}
                min={0}
                onValueChange={chooseArrowBase}
              />
              <NumberControl
                label="Arrow depth"
                name="arrow-depth"
                value={controls().arrowDepth}
                min={0}
                onValueChange={chooseArrowDepth}
              />
            </ControlGroup>

            <ControlGroup label="Tether config">
              <Flex as="div" direction="column" gap={2}>
                <Checkbox
                  testId="control-tether-disabled"
                  checked={controls().tetherDisabled}
                  onCheckedChange={chooseTetherDisabled}
                >
                  Disable tether
                </Checkbox>
                <Text as="p" size={1} selectable={false} class={css.hint}>
                  Withholds the anchor, so the tether has nothing to measure —
                  the pre-hydration state, where placement comes from CSS alone.
                </Text>
              </Flex>
              <NumberControl
                label="Tether padding"
                name="tether-padding"
                value={controls().tetherPadding}
                min={0}
                onValueChange={chooseTetherPadding}
              />
              <ChoiceControl
                label="Flip"
                name="flip"
                value={controls().flipMode}
                options={FLIP_MODES}
                onValueChange={chooseFlipMode}
              />
              <Flex as="div" direction="column" gap={2}>
                <ControlLabel label="Tether behaviors" />
                <CheckboxCardsRoot
                  testId="control-behaviors"
                  name="behaviors"
                  columns={1}
                  gap={2}
                  value={behaviors()}
                  onValueChange={chooseBehaviors}
                >
                  <For each={TETHER_BEHAVIORS}>
                    {(behavior) => (
                      <CheckboxCardsItem
                        testId={`behavior-${behavior.value}`}
                        value={behavior.value}
                      >
                        <Flex as="div" direction="column" gap={1}>
                          <Text
                            as="p"
                            size={2}
                            weight="medium"
                            selectable={false}
                          >
                            {behavior.label}
                          </Text>
                          <Text
                            as="p"
                            size={1}
                            selectable={false}
                            class={css.hint}
                          >
                            {behavior.hint}
                          </Text>
                        </Flex>
                      </CheckboxCardsItem>
                    )}
                  </For>
                </CheckboxCardsRoot>
              </Flex>
            </ControlGroup>
          </Grid>

          <Button
            testId="control-reset"
            variant="soft"
            color="neutral"
            class={css.reset}
            onClick={resetControls}
          >
            Reset controls
          </Button>
        </Flex>
      </FrameBody>
    </>
  );
};

export default FloatingUiScratchpad;
