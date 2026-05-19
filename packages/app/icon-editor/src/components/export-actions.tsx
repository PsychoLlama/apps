import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import {
  Badge,
  Button,
  Flex,
  Link,
  RadioCardsItem,
  RadioCardsRoot,
  Text,
  TextField,
} from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download-outline';
import { downloadPng, downloadSvg } from '../download';
import { renderIconSvg } from '../svg';
import type { IconEditorState } from '../store';
import { Field } from './field';
import * as css from './export-actions.css';

interface ExportActionsProps {
  /** Reactive icon state — exported on every Export click. */
  state: IconEditorState;
}

type ExportFormat = 'svg' | 'png';

interface ExportPanelState {
  /** Output format the user picked. */
  format: ExportFormat;
  /** Output size in pixels — only meaningful when `format === 'png'`. */
  size: number;
}

const FORMATS: ReadonlyArray<{ value: ExportFormat; label: string }> = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

const SIZE_PRESETS = [32, 192, 512] as const;
const MIN_PX = 16;
const MAX_PX = 2048;
const DEFAULT_PX = 512;

/** Canonical size for the SVG export — vector, so any value is fine. */
const SVG_EXPORT_SIZE = 512;

const exportStore = defineStore<ExportPanelState>(() => ({
  format: 'svg',
  size: DEFAULT_PX,
}));
const exportState = createStore(exportStore);

const setFormatAction = defineAction(
  [exportStore],
  (state, value: ExportFormat) => {
    state.format = value;
  },
);

const setSizeAction = defineAction([exportStore], (state, value: number) => {
  if (Number.isFinite(value)) state.size = value;
});

const clampSize = (value: number): number =>
  Math.max(MIN_PX, Math.min(MAX_PX, Math.round(value)));

const filenameStem = (icon: NonNullable<IconEditorState['icon']>) =>
  `icon-${icon.pack}-${icon.name}`;

/**
 * Compose an icon export. Format toggles between SVG (vector, single
 * download) and PNG (rasterized at the chosen size). The PNG row
 * surfaces three preset chips for the most common sizes plus a
 * free-form number input — always square, since the canvas itself is
 * square.
 */
export const ExportActions: Component<ExportActionsProps> = (props) => {
  const setFormat = useAction(setFormatAction);
  const setSize = useAction(setSizeAction);

  const effectiveSize = () => clampSize(exportState.size);
  // Filename / aria-label are only meaningful when an icon is chosen.
  // The Export button is disabled in the empty state, so the empty
  // string never reaches the user — we still need *something* to plug
  // into the aria-label template before then.
  const filename = () => {
    const icon = props.state.icon;
    if (!icon) return '';
    return exportState.format === 'svg'
      ? `${filenameStem(icon)}.svg`
      : `${filenameStem(icon)}-${effectiveSize()}.png`;
  };

  const handleExport = () => {
    if (!props.state.icon) return;
    if (exportState.format === 'svg') {
      downloadSvg(
        renderIconSvg(props.state, { size: SVG_EXPORT_SIZE, metadata: true }),
        filename(),
      );
      return;
    }
    // Render the SVG at the target pixel size so the rasterized
    // intermediate matches the canvas 1:1 — no resample step, no
    // soft-from-upscale artifacts. The canvas backing store also
    // matches `target`, so the PNG file dimensions are exactly
    // `target × target` regardless of device pixel ratio.
    const target = effectiveSize();
    void downloadPng(
      renderIconSvg(props.state, { size: target }),
      target,
      filename(),
    );
  };

  return (
    <Flex as="div" direction="column" gap={3}>
      <Field label="Format">
        <RadioCardsRoot
          testId="export-format"
          name="export-format"
          size={1}
          columns={2}
          value={exportState.format}
          onValueChange={(value) => setFormat(value as ExportFormat)}
          aria-label="Format"
        >
          <For each={FORMATS}>
            {(option) => (
              <RadioCardsItem
                testId={`export-format-${option.value}`}
                value={option.value}
              >
                {option.label}
              </RadioCardsItem>
            )}
          </For>
        </RadioCardsRoot>
      </Field>

      <Show when={exportState.format === 'png'}>
        <Field label="Size (px)" for="export-size">
          <Flex as="div" direction="column" gap={2}>
            <TextField
              testId="export-size"
              id="export-size"
              type="number"
              min={MIN_PX}
              max={MAX_PX}
              step={1}
              autocomplete="off"
              autocapitalize="off"
              enterkeyhint="done"
              value={String(exportState.size)}
              onInput={(event) => {
                const next = Number(event.currentTarget.value);
                if (Number.isFinite(next)) setSize(next);
              }}
            />
            <Flex as="div" gap={1} wrap="wrap">
              <For each={SIZE_PRESETS}>
                {(preset) => (
                  <Button
                    testId={`export-size-preset-${preset}`}
                    size={1}
                    variant="soft"
                    color={effectiveSize() === preset ? 'accent' : 'neutral'}
                    onClick={() => setSize(preset)}
                  >
                    {preset}
                  </Button>
                )}
              </For>
            </Flex>
          </Flex>
        </Field>
      </Show>

      <Button
        testId="export"
        size={2}
        variant="solid"
        color="accent"
        disabled={!props.state.icon}
        onClick={handleExport}
        aria-label={
          props.state.icon ? `Export ${filename()}` : 'Choose an icon to export'
        }
      >
        <IconDownload aria-hidden /> Export
      </Button>

      <Show when={props.state.icon?.license?.spdx}>
        {(spdx) => (
          <Flex
            as="div"
            align="center"
            justify="between"
            gap={2}
            class={css.licenseRow}
          >
            <Text as="span" size={1} color="lowContrast" selectable={false}>
              Icon license
            </Text>
            <Show
              when={props.state.icon?.license?.url}
              fallback={
                <Badge size={1} variant="soft" color="neutral">
                  {spdx()}
                </Badge>
              }
            >
              {(url) => (
                <Link
                  testId="export-license"
                  href={url()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge size={1} variant="soft" color="neutral">
                    {spdx()}
                  </Badge>
                </Link>
              )}
            </Show>
          </Flex>
        )}
      </Show>
    </Flex>
  );
};
