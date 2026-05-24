import { For, Show } from 'solid-js';
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

const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 240;
const PADDING = { top: 16, right: 12, bottom: 28, left: 36 };
const PLOT_WIDTH = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;

/**
 * Scale a value into the plot height. Handles all-positive, all-negative,
 * and mixed-sign datasets so bars grow from a shared zero line.
 */
const buildScale = (values: ReadonlyArray<number>) => {
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const zeroOffset = PADDING.top + (max / range) * PLOT_HEIGHT;
  const scale = (value: number) => (value / range) * PLOT_HEIGHT;
  return { max, min, zeroOffset, scale };
};

export const BarChart = (props: BarChartProps) => {
  return (
    <svg
      class={css.chartSurface}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Bar chart visualizing column A"
    >
      <Show
        when={props.data.some((datum) => datum.value !== null)}
        fallback={
          <text
            x={VIEWBOX_WIDTH / 2}
            y={VIEWBOX_HEIGHT / 2}
            text-anchor="middle"
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
  const numericValues = () =>
    props.data
      .map((datum) => datum.value)
      .filter((value): value is number => value !== null);

  const scale = () => buildScale(numericValues());
  const barWidth = () => Math.max(8, (PLOT_WIDTH / props.data.length) * 0.7);
  const slotWidth = () => PLOT_WIDTH / props.data.length;

  return (
    <>
      {/* X axis at zero */}
      <line
        x1={PADDING.left}
        x2={VIEWBOX_WIDTH - PADDING.right}
        y1={scale().zeroOffset}
        y2={scale().zeroOffset}
        class={css.chartAxis}
      />
      {/* Y axis */}
      <line
        x1={PADDING.left}
        x2={PADDING.left}
        y1={PADDING.top}
        y2={VIEWBOX_HEIGHT - PADDING.bottom}
        class={css.chartAxis}
      />
      {/* Max / min tick labels */}
      <text
        x={PADDING.left - 4}
        y={PADDING.top}
        text-anchor="end"
        dominant-baseline="hanging"
        class={css.chartLabel}
      >
        {formatTick(scale().max)}
      </text>
      <text
        x={PADDING.left - 4}
        y={VIEWBOX_HEIGHT - PADDING.bottom}
        text-anchor="end"
        class={css.chartLabel}
      >
        {formatTick(scale().min)}
      </text>
      <For each={props.data}>
        {(datum, index) => {
          const center = () => PADDING.left + slotWidth() * (index() + 0.5);
          const value = () => datum.value ?? 0;
          const barHeight = () => Math.abs(scale().scale(value()));
          const barY = () =>
            value() >= 0
              ? scale().zeroOffset - barHeight()
              : scale().zeroOffset;
          return (
            <Show when={datum.value !== null}>
              <rect
                x={center() - barWidth() / 2}
                y={barY()}
                width={barWidth()}
                height={barHeight()}
                class={css.chartBar}
                data-testid="chart-bar"
              >
                <title>
                  {datum.label}: {value()}
                </title>
              </rect>
              <text
                x={center()}
                y={value() >= 0 ? barY() - 4 : barY() + barHeight() + 12}
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
    </>
  );
};

const formatTick = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
};
