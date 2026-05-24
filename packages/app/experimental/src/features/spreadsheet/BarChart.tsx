import { createMemo, For, Show } from 'solid-js';
import * as css from './spreadsheet.css';

/** One bar in the chart. `value` may be negative; the chart anchors at zero. */
export interface BarChartDatum {
  /** Short label shown beneath the bar. Usually the source cell id. */
  label: string;
  /** Numeric height. `null` skips the bar entirely. */
  value: number | null;
}

interface BarChartProps {
  data: ReadonlyArray<BarChartDatum>;
  /** Caption shown when all data points are `null`. */
  emptyMessage?: string;
}

// Viewport dimensions tuned to the chart's `aspect-ratio: 5 / 2`. Keep the
// aspect of viewBox aligned with CSS so the SVG renders pixel-accurate
// without preserveAspectRatio="none" stretching glyphs.
const VIEWBOX_WIDTH = 500;
const VIEWBOX_HEIGHT = 200;
const PADDING = { top: 18, right: 16, bottom: 28, left: 36 };
const PLOT_WIDTH = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;

interface Scale {
  /** Inclusive numeric max of the dataset (or 0 if all are <= 0). */
  max: number;
  /** Inclusive numeric min of the dataset (or 0 if all are >= 0). */
  min: number;
  /** Y coord of the zero baseline within the viewBox. */
  zeroY: number;
  /** Pixels per unit. */
  unit: number;
}

/**
 * Build a scale that fits a positive/negative/mixed dataset. The zero
 * line floats so all-positive data uses the full plot height instead of
 * burning half on negative space.
 */
const buildScale = (values: ReadonlyArray<number>): Scale => {
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const unit = PLOT_HEIGHT / range;
  const zeroY = PADDING.top + max * unit;
  return { max, min, zeroY, unit };
};

const formatTick = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
};

export const BarChart = (props: BarChartProps) => {
  const hasData = createMemo(() =>
    props.data.some((datum) => datum.value !== null),
  );

  return (
    <svg
      class={css.chartSurface}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      role="img"
      aria-label="Bar chart visualizing column A"
    >
      <Show
        when={hasData()}
        fallback={
          <text
            x={VIEWBOX_WIDTH / 2}
            y={VIEWBOX_HEIGHT / 2}
            text-anchor="middle"
            dominant-baseline="middle"
            class={css.empty}
          >
            {props.emptyMessage ?? 'No numeric data'}
          </text>
        }
      >
        <BarChartBody data={props.data} />
      </Show>
    </svg>
  );
};

const BarChartBody = (props: { data: ReadonlyArray<BarChartDatum> }) => {
  const numericValues = createMemo(() =>
    props.data
      .map((datum) => datum.value)
      .filter((value): value is number => value !== null),
  );

  const scale = createMemo(() => buildScale(numericValues()));
  const slotWidth = () => PLOT_WIDTH / props.data.length;
  const barWidth = () => slotWidth() * 0.62;

  return (
    <>
      <Gridlines scale={scale()} />
      <For each={props.data}>
        {(datum, index) => {
          const center = () => PADDING.left + slotWidth() * (index() + 0.5);
          const value = () => datum.value ?? 0;
          const height = () => Math.abs(value() * scale().unit);
          const barY = () =>
            value() >= 0 ? scale().zeroY - height() : scale().zeroY;
          const negative = () => value() < 0;
          // Slot a label outside the bar for short bars; inside (white-ish
          // contrast) is fragile across themes, so keep it consistent.
          const labelY = () =>
            negative() ? barY() + height() + 12 : barY() - 6;
          return (
            <Show when={datum.value !== null}>
              <rect
                x={center() - barWidth() / 2}
                y={barY()}
                width={barWidth()}
                height={height()}
                rx={2}
                class={`${css.chartBar} ${negative() ? css.chartBarNegative : ''}`}
                data-testid="chart-bar"
              >
                <title>
                  {datum.label}: {value()}
                </title>
              </rect>
              <text
                x={center()}
                y={labelY()}
                text-anchor="middle"
                class={css.chartValueLabel}
              >
                {formatTick(value())}
              </text>
              <text
                x={center()}
                y={VIEWBOX_HEIGHT - PADDING.bottom + 14}
                text-anchor="middle"
                class={css.chartLabel}
              >
                {datum.label}
              </text>
            </Show>
          );
        }}
      </For>
      {/* Y axis drawn last so it covers the gridline ends cleanly. */}
      <line
        x1={PADDING.left}
        x2={PADDING.left}
        y1={PADDING.top}
        y2={VIEWBOX_HEIGHT - PADDING.bottom}
        class={css.chartAxis}
      />
    </>
  );
};

/**
 * Light gridlines at zero, max, min, and a midpoint when the range spans
 * both signs. Skipped when min and max coincide (no usable ticks).
 */
const Gridlines = (props: { scale: Scale }) => {
  const ticks = createMemo<Array<{ value: number; y: number }>>(() => {
    const { max, min, zeroY, unit } = props.scale;
    const entries = new Set<number>();
    entries.add(max);
    entries.add(min);
    entries.add(0);
    if (min < 0 && max > 0) {
      entries.add(max / 2);
      entries.add(min / 2);
    }
    return [...entries]
      .sort((left, right) => right - left)
      .map((value) => ({ value, y: zeroY - value * unit }));
  });

  return (
    <>
      <For each={ticks()}>
        {(tick) => (
          <>
            <line
              x1={PADDING.left}
              x2={VIEWBOX_WIDTH - PADDING.right}
              y1={tick.y}
              y2={tick.y}
              class={tick.value === 0 ? css.chartAxis : css.chartGridline}
            />
            <text
              x={PADDING.left - 6}
              y={tick.y}
              text-anchor="end"
              dominant-baseline="middle"
              class={css.chartLabel}
            >
              {formatTick(tick.value)}
            </text>
          </>
        )}
      </For>
    </>
  );
};
