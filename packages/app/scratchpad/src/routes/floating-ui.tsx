import { For } from 'solid-js';
import type { RadiusScale } from '@lib/design';
import { FrameBody, SiteHeader } from '@lib/shell';
import {
  Checkbox,
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
  clampToggled,
  flipModeChanged,
  featureToggled,
  floatingControls,
  pointChanged,
  radiusChanged,
  scratchpadScope,
  sideChanged,
  sideOffsetChanged,
  tetherPaddingChanged,
  type FlipMode,
  type TetherFeature,
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
const TETHER_FEATURES = ['shift', 'size'] as const satisfies TetherFeature[];
const FLIP_MODES = ['auto', 'off', 'chain'] as const satisfies FlipMode[];

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

/**
 * The floating-UI experiment at `/scratchpad/floating-ui`: a hatched
 * target with a floating window bound to it, plus controls for every
 * placement input the container takes. Change one and watch the window
 * re-place live.
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
  const chooseTetherPadding = (padding: number) =>
    commit(tetherPaddingChanged(padding));
  const toggleFeature = (toggle: {
    feature: TetherFeature;
    enabled: boolean;
  }) => commit(featureToggled(toggle));
  const chooseFlipMode = (mode: FlipMode) => commit(flipModeChanged(mode));
  const chooseClamp = (clamp: boolean) => commit(clampToggled(clamp));
  const chooseArrowVisible = (visible: boolean) =>
    commit(arrowVisibilityChanged(visible));
  const chooseArrowBase = (base: number) => commit(arrowBaseChanged(base));
  const chooseArrowDepth = (depth: number) => commit(arrowDepthChanged(depth));
  const captureAnchor = (element: HTMLElement) =>
    commit(anchorCaptured(element));

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
        <Flex as="section" direction="row" wrap="wrap" gap={6}>
          <PlacementControl
            label="Side"
            name="side"
            value={controls().side}
            options={SIDES}
            onValueChange={chooseSide}
          />
          <PlacementControl
            label="Align"
            name="align"
            value={controls().align}
            options={ALIGNMENTS}
            onValueChange={chooseAlign}
          />
          <PlacementControl
            label="Arrow align"
            name="arrow-align"
            value={controls().arrowAlign}
            options={ARROW_ALIGNMENTS}
            onValueChange={chooseArrowAlign}
          />
          <PlacementControl
            label="Flip"
            name="flip"
            value={controls().flipMode}
            options={FLIP_MODES}
            onValueChange={chooseFlipMode}
          />
          <PlacementControl
            label="Radius"
            name="radius"
            value={String(controls().radius)}
            options={RADII}
            onValueChange={(value) =>
              chooseRadius(Number(value) as RadiusScale)
            }
          />

          <Flex as="div" direction="column" gap={2}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Arrow
            </Text>
            <Switch
              testId="control-arrow"
              checked={controls().arrowVisible}
              onCheckedChange={chooseArrowVisible}
              aria-label="Arrow"
            />
          </Flex>

          <Flex as="div" direction="column" gap={2} class={css.offsetControl}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Arrow base ({controls().arrowBase}px)
            </Text>
            <Slider
              testId="control-arrow-base"
              value={[controls().arrowBase]}
              onValueChange={([value = 16]) => chooseArrowBase(value)}
              min={8}
              max={32}
              aria-label="Arrow base"
            />
          </Flex>

          <Flex as="div" direction="column" gap={2} class={css.offsetControl}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Arrow depth ({controls().arrowDepth}px)
            </Text>
            <Slider
              testId="control-arrow-depth"
              value={[controls().arrowDepth]}
              onValueChange={([value = 8]) => chooseArrowDepth(value)}
              min={4}
              max={24}
              aria-label="Arrow depth"
            />
          </Flex>

          <Flex as="div" direction="column" gap={2} class={css.offsetControl}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Side offset ({controls().sideOffset}px)
            </Text>
            <Slider
              testId="control-side-offset"
              value={[controls().sideOffset]}
              onValueChange={([value = 0]) => chooseSideOffset(value)}
              min={0}
              max={32}
              aria-label="Side offset"
            />
          </Flex>

          <Flex as="div" direction="column" gap={2} class={css.offsetControl}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Align offset ({controls().alignOffset}px)
            </Text>
            <Slider
              testId="control-align-offset"
              value={[controls().alignOffset]}
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
              checked={controls().point !== null}
              onCheckedChange={(checked) =>
                choosePoint(checked ? { x: 96, y: 64 } : null)
              }
              aria-label="Point mode"
            />
            <Text as="p" size={1} selectable={false}>
              Click the target to move the point.
            </Text>
          </Flex>

          <Flex as="div" direction="column" gap={2} class={css.offsetControl}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Tether padding ({controls().tetherPadding}px)
            </Text>
            <Slider
              testId="control-tether-padding"
              value={[controls().tetherPadding]}
              onValueChange={([value = 8]) => chooseTetherPadding(value)}
              min={0}
              max={48}
              aria-label="Tether padding"
            />
          </Flex>

          <Flex as="div" direction="column" gap={2}>
            <Text as="p" size={2} weight="medium" selectable={false}>
              Tether behaviors
            </Text>
            <For each={TETHER_FEATURES}>
              {(feature) => (
                <Checkbox
                  testId={`control-feature-${feature}`}
                  checked={controls().features[feature]}
                  onCheckedChange={(enabled) =>
                    toggleFeature({ feature, enabled })
                  }
                >
                  {feature}
                </Checkbox>
              )}
            </For>
            <Checkbox
              testId="control-clamp"
              checked={controls().clampToAvailable}
              onCheckedChange={chooseClamp}
            >
              clamp to available
            </Checkbox>
          </Flex>
        </Flex>

        <Flex as="div" grow align="center" justify="center" class={css.stage}>
          <Flex
            as="section"
            ref={captureAnchor}
            class={[css.target, anchor, controls().point && css.pointArmed]
              .filter(Boolean)
              .join(' ')}
            onClick={placePoint}
          >
            <FloatingContainer
              anchor={anchorEl() ?? undefined}
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
              class={[css.surface, controls().clampToAvailable && css.clamped]
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
    </>
  );
};

export default FloatingUiScratchpad;
