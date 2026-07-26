import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import {
  defineFold,
  defineStore,
  defineTopic,
  useCommit,
  useValue,
} from '@lib/state-next';
import { createLogger, toError } from '@lib/observability';
import {
  Button,
  Flex,
  RadioCardsItem,
  RadioCardsRoot,
  TextField,
} from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download-outline';
import { downloadPng, downloadSvg } from '../download';
import { renderIconSvg } from '../svg';
import { iconEditorScope, type IconEditorState } from '../store';
import { Field } from './field';

interface ExportActionsProps {
  /** Reactive icon state — exported on every Export click. */
  state: IconEditorState;
}

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

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

// Owned by the editor's scope, not the panel's own — the rail swaps this
// component out whenever the picker opens, and the chosen format and
// size should survive that round trip.
const exportPanel = defineStore<ExportPanelState>(iconEditorScope, () => ({
  format: 'svg',
  size: DEFAULT_PX,
}));

/** The output format toggled between vector and raster. */
const formatChanged = defineTopic<ExportFormat>();
defineFold(formatChanged, [exportPanel], (state, format) => {
  state.format = format;
});

/** The target pixel size changed — from the input or a preset chip. */
const sizeChanged = defineTopic<number>();
defineFold(sizeChanged, [exportPanel], (state, size) => {
  if (Number.isFinite(size)) state.size = size;
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
  const panel = useValue(exportPanel);
  const commit = useCommit();

  const effectiveSize = () => clampSize(panel().size);
  // Filename / aria-label are only meaningful when an icon is chosen.
  // The Export button is disabled in the empty state, so the empty
  // string never reaches the user — we still need *something* to plug
  // into the aria-label template before then.
  const filename = () => {
    const icon = props.state.icon;
    if (!icon) return '';
    return panel().format === 'svg'
      ? `${filenameStem(icon)}.svg`
      : `${filenameStem(icon)}-${effectiveSize()}.png`;
  };

  const handleExport = () => {
    const icon = props.state.icon;
    if (!icon) return;
    if (panel().format === 'svg') {
      downloadSvg(
        renderIconSvg(props.state, { size: SVG_EXPORT_SIZE, metadata: true }),
        filename(),
      );
      logger.info('Exported an icon.', {
        pack: icon.pack,
        name: icon.name,
        format: 'svg',
      });
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
    ).then(
      () => {
        logger.info('Exported an icon.', {
          pack: icon.pack,
          name: icon.name,
          format: 'png',
          size: target,
        });
      },
      // Was a floating promise; a failed rasterize would silently no-op.
      (error: unknown) => {
        logger.error('PNG export failed.', {
          pack: icon.pack,
          name: icon.name,
          error: toError(error),
        });
      },
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
          value={panel().format}
          onValueChange={(value) =>
            commit(formatChanged(value as ExportFormat))
          }
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

      <Show when={panel().format === 'png'}>
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
              value={String(panel().size)}
              onInput={(event) => {
                const next = Number(event.currentTarget.value);
                if (Number.isFinite(next)) commit(sizeChanged(next));
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
                    onClick={() => commit(sizeChanged(preset))}
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
    </Flex>
  );
};
