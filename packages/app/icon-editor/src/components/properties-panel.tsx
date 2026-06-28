/* eslint-disable solid/no-innerhtml -- the glyph body comes from a
 * resolved iconify entry already held in state; no untrusted input
 * ever reaches innerHTML. */

import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Card, Flex, ScrollArea, Separator, Text } from '@lib/ui';
import IconPlaceholder from 'virtual:icons/mdi/image-outline';
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
}

/**
 * Clickable icon chip — glyph thumbnail beside the icon name, or a
 * dashed placeholder when nothing's chosen. Activating it opens the
 * active pack's grid to pick (or swap) the icon.
 */
const IconChooser: Component<{
  icon: IconEditorState['icon'];
  onClick: () => void;
}> = (props) => (
  <Card
    as="button"
    variant="surface"
    testId="icon-editor-choose-icon"
    class={css.chooser}
    aria-label={
      props.icon ? `Change icon: ${props.icon.name}` : 'Choose an icon'
    }
    onClick={props.onClick}
  >
    <Flex as="div" align="center" gap={3}>
      <Show
        when={props.icon}
        fallback={
          <>
            {/* Dashed glyph well; no @lib/ui analogue. */}
            {/* eslint-disable-next-line custom/require-ui-primitives */}
            <span class={`${css.thumb} ${css.thumbEmpty}`} aria-hidden>
              <IconPlaceholder class={css.thumbIcon} />
            </span>
            <Text as="span" size={2} color="lowContrast" selectable={false}>
              Choose an icon
            </Text>
          </>
        }
      >
        {(icon) => (
          <>
            {/* eslint-disable-next-line custom/require-ui-primitives */}
            <span class={css.thumb} aria-hidden>
              <svg
                class={css.thumbIcon}
                viewBox={`0 0 ${icon().width} ${icon().height}`}
                innerHTML={icon().body}
              />
            </span>
            <Flex as="div" direction="column" grow class={css.summaryText}>
              <Text
                as="span"
                size={2}
                weight="medium"
                truncate
                selectable={false}
              >
                {icon().name}
              </Text>
            </Flex>
          </>
        )}
      </Show>
    </Flex>
  </Card>
);

/**
 * The always-on editing inspector — the selected pack and icon, style
 * controls, and export, stacked into one scrolling column. The pack and
 * icon are each a card that swaps the whole rail to the relevant picker
 * surface (handled by the parent), so this panel never owns the picker.
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
          <IconChooser icon={props.state.icon} onClick={props.onChooseIcon} />
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
