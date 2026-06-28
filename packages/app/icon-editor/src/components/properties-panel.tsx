/* eslint-disable solid/no-innerhtml -- the glyph body comes from a
 * resolved iconify entry already held in state; no untrusted input
 * ever reaches innerHTML. */

import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Badge, Button, Flex, ScrollArea, Separator, Text } from '@lib/ui';
import IconPlaceholder from 'virtual:icons/mdi/image-outline';
import IconShuffle from 'virtual:icons/mdi/shuffle-variant';
import type { IconPackSummary } from '../icons';
import type { IconEditorShape, IconEditorState } from '../store';
import type { PaletteName } from '../palette';
import { ExportActions } from './export-actions';
import { Field } from './field';
import { InlineField } from './inline-field';
import { PackCard } from './pack-card';
import { PaddingSlider } from './padding-slider';
import { PalettePicker } from './palette-picker';
import { ShapeSelector } from './shape-selector';
import * as css from './properties-panel.css';

interface PropertiesPanelProps {
  /** Reactive icon-under-construction. */
  state: IconEditorState;
  /** Currently selected pack — rendered as a pack card. */
  activePack: IconPackSummary | undefined;
  /** Apply a palette pick. */
  onPalette: (name: PaletteName) => void;
  /** Apply a shape pick. */
  onShape: (shape: IconEditorShape) => void;
  /** Apply a padding change. */
  onPadding: (value: number) => void;
  /** Open the pack list to choose a different pack. */
  onChoosePack: () => void;
  /** Open the active pack's grid to choose an icon. */
  onChooseIcon: () => void;
  /** Roll a random icon + style. */
  onRandomize: () => void;
}

/**
 * Selected-icon row — the glyph thumbnail is itself the button that
 * opens the active pack's grid, with the icon id alongside as a neutral
 * badge and a Randomize action pinned to the top-right. Empty state
 * swaps in a dashed placeholder and a prompt.
 */
const IconChooser: Component<{
  icon: IconEditorState['icon'];
  onClick: () => void;
  onRandomize: () => void;
}> = (props) => (
  <Flex as="div" align="start" gap={3}>
    <Show
      when={props.icon}
      fallback={
        <>
          {/* The thumbnail is the click target; no @lib/ui analogue
              for a framed glyph button. */}
          {/* eslint-disable-next-line custom/require-ui-primitives */}
          <button
            type="button"
            class={`${css.thumbButton} ${css.thumbButtonEmpty}`}
            aria-label="Choose an icon"
            onClick={props.onClick}
          >
            <IconPlaceholder class={css.thumbIcon} aria-hidden />
          </button>
          <Flex as="div" grow class={css.idSlot}>
            <Text as="span" size={2} color="lowContrast" selectable={false}>
              Choose an icon
            </Text>
          </Flex>
        </>
      }
    >
      {(icon) => (
        <>
          {/* eslint-disable-next-line custom/require-ui-primitives */}
          <button
            type="button"
            class={css.thumbButton}
            aria-label={`Change icon: ${icon().name}`}
            onClick={props.onClick}
          >
            <svg
              class={css.thumbIcon}
              viewBox={`0 0 ${icon().width} ${icon().height}`}
              innerHTML={icon().body}
              aria-hidden="true"
            />
          </button>
          <Flex as="div" grow class={css.idSlot}>
            <Badge
              class={css.iconBadge}
              size={2}
              variant="soft"
              color="neutral"
            >
              {icon().name}
            </Badge>
          </Flex>
        </>
      )}
    </Show>
    <Button
      testId="randomize"
      size={1}
      variant="ghost"
      color="neutral"
      onClick={props.onRandomize}
    >
      <IconShuffle aria-hidden /> Randomize
    </Button>
  </Flex>
);

/**
 * The always-on editing inspector — the selected icon and pack, style
 * controls, and export, stacked into one scrolling column. The icon
 * thumbnail and the pack card each swap the whole rail to the relevant
 * picker surface (handled by the parent), so this panel never owns it.
 */
export const PropertiesPanel: Component<PropertiesPanelProps> = (props) => {
  return (
    <ScrollArea type="hover" scrollbars="vertical" class={css.scroller}>
      <Flex as="div" direction="column" gap={4} class={css.panel}>
        <Flex
          as="section"
          direction="column"
          gap={3}
          class={css.section}
          aria-label="Icon"
        >
          <IconChooser
            icon={props.state.icon}
            onClick={props.onChooseIcon}
            onRandomize={props.onRandomize}
          />
          <Show when={props.activePack}>
            {(pack) => (
              <PackCard
                pack={pack()}
                testId="icon-editor-choose-pack"
                aria-label={`Change pack: ${pack().name}`}
                onClick={props.onChoosePack}
              />
            )}
          </Show>
        </Flex>

        <Separator decorative size={4} />

        <Flex
          as="section"
          direction="column"
          gap={3}
          class={css.section}
          aria-label="Style"
        >
          <Field label="Palette">
            <PalettePicker
              value={props.state.palette}
              onChange={props.onPalette}
            />
          </Field>
          <InlineField label="Shape">
            <ShapeSelector value={props.state.shape} onChange={props.onShape} />
          </InlineField>
          <InlineField label="Padding">
            <PaddingSlider
              value={props.state.padding}
              onInput={props.onPadding}
            />
          </InlineField>
        </Flex>

        <Separator decorative size={4} />

        <Flex
          as="section"
          direction="column"
          gap={3}
          class={css.section}
          aria-label="Export"
        >
          <ExportActions state={props.state} />
        </Flex>
      </Flex>
    </ScrollArea>
  );
};
