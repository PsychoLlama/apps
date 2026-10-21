import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import {
  Button,
  Flex,
  RadioCardsItem,
  RadioCardsRoot,
  TextField,
} from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download-outline';
import { $exportIcon } from '../effects';
import {
  $exportPanel,
  $formatChanged,
  $sizeChanged,
  MAX_EXPORT_SIZE,
  MIN_EXPORT_SIZE,
  exportFilenameOf,
  exportSizeOf,
  type ExportFormat,
  type IconEditorState,
} from '../state';
import { Field } from './field';

interface ExportActionsProps {
  /** Reactive icon state — exported on every Export click. */
  state: IconEditorState;
}

const FORMATS: ReadonlyArray<{ value: ExportFormat; label: string }> = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

const SIZE_PRESETS = [32, 192, 512] as const;

/**
 * Compose an icon export. Format toggles between SVG (vector, single
 * download) and PNG (rasterized at the chosen size). The PNG row
 * surfaces three preset chips for the most common sizes plus a
 * free-form number input — always square, since the canvas itself is
 * square.
 */
export const ExportActions: Component<ExportActionsProps> = (props) => {
  const panel = useValue($exportPanel);
  const changeFormat = useAction($formatChanged);
  const changeSize = useAction($sizeChanged);
  const exportIcon = useAction($exportIcon);

  const effectiveSize = () => exportSizeOf(panel());

  return (
    <Flex as="div" direction="column" gap={3}>
      <Field label="Format">
        <RadioCardsRoot
          testId="export-format"
          name="export-format"
          size={1}
          columns={2}
          value={panel().format}
          onValueChange={(value) => changeFormat(value as ExportFormat)}
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
              min={MIN_EXPORT_SIZE}
              max={MAX_EXPORT_SIZE}
              step={1}
              autocomplete="off"
              autocapitalize="off"
              enterkeyhint="done"
              value={String(panel().size)}
              onInput={(event) => {
                const next = Number(event.currentTarget.value);
                if (Number.isFinite(next)) changeSize(next);
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
                    onClick={() => changeSize(preset)}
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
        onClick={() => exportIcon(props.state)}
        aria-label={
          props.state.icon
            ? `Export ${exportFilenameOf(panel(), props.state.icon)}`
            : 'Choose an icon to export'
        }
      >
        <IconDownload aria-hidden /> Export
      </Button>
    </Flex>
  );
};
