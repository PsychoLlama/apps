/* eslint-disable solid/no-innerhtml -- the glyph body comes from a
 * resolved iconify entry already held in state; no untrusted input
 * ever reaches innerHTML. */

import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Button, Flex, ScrollArea, Separator, Text } from '@lib/ui';
import IconBrowse from 'virtual:icons/mdi/view-grid-outline';
import IconPlaceholder from 'virtual:icons/mdi/image-outline';
import type { IconEditorShape, IconEditorState } from '../store';
import type { PaletteName } from '../palette';
import { ExportActions } from './export-actions';
import { Field } from './field';
import { InlineField } from './inline-field';
import { LicenseBadge } from './license-badge';
import { PaddingSlider } from './padding-slider';
import { PalettePicker } from './palette-picker';
import { ShapeSelector } from './shape-selector';
import * as css from './properties-panel.css';

interface PropertiesPanelProps {
  /** Reactive icon-under-construction. */
  state: IconEditorState;
  /** Apply a palette pick. */
  onPalette: (name: PaletteName) => void;
  /** Apply a shape pick. */
  onShape: (shape: IconEditorShape) => void;
  /** Apply a padding change. */
  onPadding: (value: number) => void;
  /** Open the full-rail icon browser. */
  onBrowse: () => void;
}

/** Selected-icon chip — glyph thumbnail beside its `pack:name` identifier. */
const IconSummary: Component<{ icon: IconEditorState['icon'] }> = (props) => (
  <Flex as="div" align="center" gap={3} class={css.summary}>
    <Show
      when={props.icon}
      fallback={
        <>
          {/* Square placeholder frame; no @lib/ui analogue for the
              dashed glyph well. */}
          {/* eslint-disable-next-line custom/require-ui-primitives */}
          <span class={`${css.thumb} ${css.thumbEmpty}`} aria-hidden>
            <IconPlaceholder class={css.thumbIcon} />
          </span>
          <Text as="span" size={2} color="lowContrast" selectable={false}>
            No icon selected
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
            <Text
              as="span"
              size={1}
              color="lowContrast"
              truncate
              selectable={false}
            >
              {icon().pack}
            </Text>
          </Flex>
          <LicenseBadge license={icon().license} />
        </>
      )}
    </Show>
  </Flex>
);

/**
 * The always-on editing inspector — selected icon, style controls, and
 * export, stacked into one scrolling column. Browsing for a different
 * icon swaps the whole rail to the picker (handled by the parent), so
 * this panel never owns the pack list.
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
          <IconSummary icon={props.state.icon} />
          <Button
            testId="icon-editor-browse"
            variant="soft"
            color="neutral"
            onClick={props.onBrowse}
          >
            <IconBrowse aria-hidden /> Browse icons
          </Button>
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
