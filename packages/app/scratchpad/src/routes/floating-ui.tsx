import { For, onMount, type JSX } from 'solid-js';
import { flip, shift, type Middleware, type Placement } from '@floating-ui/dom';
import { createLogger, toError } from '@lib/observability';
import type { RadiusScale } from '@lib/design';
import clx from '@lib/classnames';
import { FrameBody, SiteHeader } from '@lib/shell';
import {
  Button,
  Checkbox,
  CheckboxCardsItem,
  CheckboxCardsRoot,
  Flex,
  Grid,
  Heading,
  RadioCardsItem,
  RadioCardsRoot,
  RadioGroupItem,
  RadioGroupRoot,
  SegmentedControlItem,
  SegmentedControlRoot,
  Switch,
  Text,
  TextField,
} from '@lib/ui';
import {
  FloatingRoot,
  FloatingWindow,
  type FloatingAlignment,
  type FloatingPoint,
  type FloatingSide,
  type FloatingTether,
} from '@lib/ui/_internal/floating-ui';
import { AbortError, useAnchor, useCommit, useRun, useValue } from '@lib/state';
import { AppearanceToggle } from '@lib/theme/appearance-toggle';
import {
  alignChanged,
  alignOffsetChanged,
  arrowBaseChanged,
  arrowDepthChanged,
  arrowVisibilityChanged,
  middlewareChanged,
  commitTetherEnabledSaga,
  flipModeChanged,
  floatingControls,
  pointChanged,
  radiusChanged,
  resetControlsSaga,
  scratchpadScope,
  sideChanged,
  sideOffsetChanged,
  trackTetherConfigSaga,
  TETHER_MIDDLEWARE,
  type FlipMode,
  type TetherMiddleware,
} from '../state/floating-ui';
import * as css from './floating-ui.css';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

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
const RADII = ['1', '2', '3', '4', '5', '6'] as const;

/**
 * The chain the `chain` mode walks — a deliberately odd order so it's
 * obvious the tether follows the list rather than flipping to the
 * opposite side on its own.
 */
const FALLBACK_CHAIN = ['right', 'left', 'top'] as const satisfies Placement[];

/**
 * The flip-mode cards. Cards over a segmented control because the mode
 * names are bare words borrowed from the library's vocabulary — `auto`
 * and `chain` say nothing on their own, and the sentence explaining the
 * difference has to sit with the option rather than beneath the group.
 */
const FLIP_MODE_CARDS = [
  {
    value: 'auto',
    label: 'auto',
    hint: 'Try the opposite side first, then whatever else fits.',
  },
  {
    value: 'chain',
    label: 'chain',
    hint: `Walk a fixed list in order: ${FALLBACK_CHAIN.join(', ')}.`,
  },
] as const satisfies { value: FlipMode; label: string; hint: string }[];

/**
 * The middleware cards. Cards over bare checkboxes because each needs a
 * sentence to be meaningful — the label alone ("shift") says nothing
 * about what turning it off costs.
 */
const TETHER_MIDDLEWARE_CARDS = [
  {
    value: 'flip',
    label: 'flip',
    hint: 'Move the window to another side when its own would overflow the boundary.',
  },
  {
    value: 'shift',
    label: 'shift',
    hint: 'Slide the window along its bound edge to keep it inside the boundary.',
  },
] as const satisfies { value: TetherMiddleware; label: string; hint: string }[];

/** The `flip` middleware a mode stands for. */
const flipFor = (mode: FlipMode): Middleware => {
  switch (mode) {
    case 'auto':
      return flip();
    case 'chain':
      return flip({ fallbackPlacements: [...FALLBACK_CHAIN] });
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

/**
 * A titled run nested inside a {@link ControlGroup} — a cluster of
 * controls that all configure one part, where repeating that part's name
 * in every label ("Arrow base", "Arrow depth") would be noise.
 */
const ControlSubgroup = (props: { label: string; children: JSX.Element }) => (
  <Flex as="section" direction="column" gap={5}>
    <Heading as="h3" size={2} selectable={false}>
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
  /** Accessible name, when the visible label leans on a subheading. */
  ariaLabel?: string;
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
      aria-label={props.ariaLabel ?? props.label}
      autocomplete="off"
      autocapitalize={undefined}
      enterkeyhint={undefined}
    />
  </Flex>
);

/** A labeled switch binding one boolean control to the store. */
const ToggleControl = (props: {
  label: string;
  /** Accessible name, when the visible label leans on a subheading. */
  ariaLabel?: string;
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
      aria-label={props.ariaLabel ?? props.label}
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
  const commit = useCommit();
  const track = useRun(trackTetherConfigSaga);
  const commitTetherEnabled = useRun(commitTetherEnabledSaga);
  const resetControls = useRun(resetControlsSaga);

  // `tetherEnabled` is seeded with the build-environment default, so
  // first paint (and prerender) match without a flash. OPFS is
  // client-only — unavailable during SSG — so the tracking saga starts on
  // mount: it subscribes, reconciles with any persisted override, then
  // runs for as long as the page is mounted. Writes echo back through the
  // subscription, making it the single source of truth.
  onMount(() => {
    void track().catch((error: unknown) => {
      // Releasing the anchor on cleanup aborts the saga. That's ordinary
      // teardown, and nothing to report.
      if (error instanceof AbortError) return;

      logger.error('The floating-UI tether config tracker failed.', {
        error: toError(error),
      });
    });
  });

  const chooseSide = (side: FloatingSide) => commit(sideChanged(side));
  const chooseAlign = (align: FloatingAlignment) => commit(alignChanged(align));
  const chooseRadius = (radius: RadiusScale) => commit(radiusChanged(radius));
  const chooseSideOffset = (offset: number) =>
    commit(sideOffsetChanged(offset));
  const chooseAlignOffset = (offset: number) =>
    commit(alignOffsetChanged(offset));
  const choosePoint = (point: FloatingPoint | null) =>
    commit(pointChanged(point));
  const chooseTetherEnabled = (enabled: boolean) =>
    void commitTetherEnabled(enabled);
  const chooseMiddleware = (enabled: readonly string[]) =>
    commit(middlewareChanged(enabled as readonly TetherMiddleware[]));
  const chooseFlipMode = (mode: FlipMode) => commit(flipModeChanged(mode));
  const chooseArrowVisible = (visible: boolean) =>
    commit(arrowVisibilityChanged(visible));
  const chooseArrowBase = (base: number) => commit(arrowBaseChanged(base));
  const chooseArrowDepth = (depth: number) => commit(arrowDepthChanged(depth));

  /** The middleware cards currently checked, as the group reads them. */
  const enabledMiddleware = (): TetherMiddleware[] =>
    TETHER_MIDDLEWARE.filter((name) => controls().middleware[name]);

  /**
   * The tether as the controls configure it, or nothing while it's stood
   * down. Each card is one `@floating-ui/dom` middleware, in the order
   * the library recommends: `flip` decides the side, then `shift` slides
   * along it.
   */
  const tether = (): FloatingTether | undefined => {
    if (!controls().tetherEnabled) return undefined;

    const { flipMode, middleware } = controls();
    const passes: (Middleware | undefined)[] = [
      middleware.flip ? flipFor(flipMode) : undefined,
      middleware.shift ? shift() : undefined,
    ];

    return { middleware: passes.filter((pass) => pass !== undefined) };
  };

  /** Re-place the bound point wherever the target box is clicked. */
  const placePoint = (event: MouseEvent & { currentTarget: HTMLElement }) => {
    if (!controls().point) return;

    // Measured against the target's border box, which is exactly the
    // box `FloatingRoot` wraps — so the coordinates the window places
    // against are the ones read here.
    //
    // Rounded to whole pixels. The target sits at a fractional layout
    // position, so the raw difference carries its remainder — and the
    // tether snaps its measurement to the pixel grid while CSS placement
    // pins the fraction verbatim, so a fractional point shows up as a
    // 1px jump when the tether toggles. Whole pixels keep the two modes
    // reading the same number.
    const bounds = event.currentTarget.getBoundingClientRect();
    choosePoint({
      x: Math.round(event.clientX - bounds.left),
      y: Math.round(event.clientY - bounds.top),
    });
  };

  return (
    <>
      <SiteHeader
        trail={[
          { label: 'Scratchpad', href: '/scratchpad' },
          { label: 'Floating UI' },
        ]}
        actions={<AppearanceToggle />}
      />
      <FrameBody>
        <Flex as="div" direction="column" gap={7} class={css.column}>
          <Flex as="div" ref={centerScroll} class={css.stage}>
            <Flex as="div" align="center" justify="center" class={css.canvas}>
              <FloatingRoot display="block" class={css.anchorSlot}>
                <Flex
                  as="section"
                  class={clx(css.target, controls().point && css.pointArmed)}
                  onClick={placePoint}
                />
                <FloatingWindow
                  side={controls().side}
                  align={controls().align}
                  radius={controls().radius}
                  sideOffset={controls().sideOffset}
                  alignOffset={controls().alignOffset}
                  point={controls().point ?? undefined}
                  tether={tether()}
                  direction="column"
                  gap={1}
                  py={3}
                  px={4}
                  class={css.surface}
                  arrow={
                    controls().arrowVisible
                      ? {
                          base: controls().arrowBase,
                          depth: controls().arrowDepth,
                          class: css.arrow,
                        }
                      : undefined
                  }
                >
                  <Heading as="h3" size={3} selectable={false}>
                    Floating Window
                  </Heading>
                  <Text as="p" size={2} selectable={false}>
                    A taller surface so the arrow has room to sit mid-height
                    when the window binds to the left or right edge.
                  </Text>
                </FloatingWindow>
              </FloatingRoot>
            </Flex>
          </Flex>

          <Grid as="div" class={css.configs}>
            <ControlGroup label="Window props">
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
              <ControlSubgroup label="Arrow">
                <ToggleControl
                  label="Visible"
                  ariaLabel="Arrow visible"
                  name="arrow"
                  checked={controls().arrowVisible}
                  onCheckedChange={chooseArrowVisible}
                />
                <NumberControl
                  label="Base"
                  ariaLabel="Arrow base"
                  name="arrow-base"
                  value={controls().arrowBase}
                  min={0}
                  onValueChange={chooseArrowBase}
                />
                <NumberControl
                  label="Depth"
                  ariaLabel="Arrow depth"
                  name="arrow-depth"
                  value={controls().arrowDepth}
                  min={0}
                  onValueChange={chooseArrowDepth}
                />
              </ControlSubgroup>
            </ControlGroup>

            <ControlGroup label="Tether config">
              <Flex as="div" direction="column" gap={2}>
                <Checkbox
                  testId="control-tether-enabled"
                  checked={controls().tetherEnabled}
                  onCheckedChange={chooseTetherEnabled}
                >
                  Enable tether
                </Checkbox>
                <Text as="p" size={1} selectable={false} class={css.hint}>
                  Take over CSS-based positioning to avoid overflow clipping.
                </Text>
              </Flex>
              <Flex as="div" direction="column" gap={2}>
                <ControlLabel label="Tether middleware" />
                <CheckboxCardsRoot
                  testId="control-middleware"
                  name="middleware"
                  columns={1}
                  gap={2}
                  value={enabledMiddleware()}
                  onValueChange={chooseMiddleware}
                >
                  <For each={TETHER_MIDDLEWARE_CARDS}>
                    {(card) => (
                      <CheckboxCardsItem
                        testId={`middleware-${card.value}`}
                        value={card.value}
                      >
                        <Flex as="div" direction="column" gap={1}>
                          <Text
                            as="p"
                            size={2}
                            weight="medium"
                            selectable={false}
                          >
                            {card.label}
                          </Text>
                          <Text
                            as="p"
                            size={1}
                            selectable={false}
                            class={css.hint}
                          >
                            {card.hint}
                          </Text>
                        </Flex>
                      </CheckboxCardsItem>
                    )}
                  </For>
                </CheckboxCardsRoot>
              </Flex>
              <Flex as="div" direction="column" gap={2}>
                <ControlLabel label="Flip fallbacks" />
                <RadioCardsRoot
                  testId="control-flip"
                  name="flip"
                  columns={1}
                  gap={2}
                  value={controls().flipMode}
                  onValueChange={(mode) => chooseFlipMode(mode as FlipMode)}
                  aria-label="Flip fallbacks"
                >
                  <For each={FLIP_MODE_CARDS}>
                    {(card) => (
                      <RadioCardsItem
                        testId={`flip-${card.value}`}
                        value={card.value}
                      >
                        <Flex as="div" direction="column" gap={1} grow>
                          <Text
                            as="p"
                            size={2}
                            weight="medium"
                            selectable={false}
                          >
                            {card.label}
                          </Text>
                          <Text
                            as="p"
                            size={1}
                            selectable={false}
                            class={css.hint}
                          >
                            {card.hint}
                          </Text>
                        </Flex>
                      </RadioCardsItem>
                    )}
                  </For>
                </RadioCardsRoot>
              </Flex>
            </ControlGroup>

            <Button
              testId="control-reset"
              variant="soft"
              color="neutral"
              class={css.reset}
              onClick={() => void resetControls()}
            >
              Reset controls
            </Button>
          </Grid>
        </Flex>
      </FrameBody>
    </>
  );
};

export default FloatingUiScratchpad;
