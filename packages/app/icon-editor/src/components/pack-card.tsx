/* eslint-disable solid/no-innerhtml -- sample bodies come from bundled
 * iconify packs, sliced and emitted as static assets at build time. No
 * untrusted input ever reaches innerHTML. */

import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Badge, Card, Flex, Text } from '@lib/ui';
import type { IconPackSummary } from '../icons';
import * as css from './pack-card.css';

const numberFormat = new Intl.NumberFormat();

interface PackCardProps {
  /** Pack to summarize. */
  pack: IconPackSummary;
  /** Highlights the card as the current selection (pack list). */
  active?: boolean;
  /** Accessible label — defaults to the pack name. */
  'aria-label'?: string;
  /** Forwarded test id. */
  testId?: string;
  /** Capture the underlying button (the pack list focuses the active one). */
  ref?: (el: HTMLButtonElement) => void;
  /** Activate the card. */
  onClick: () => void;
}

/**
 * Pack summary card — name, icon count, a row of sample glyphs, and the
 * license SPDX. Rendered both in the picker's pack list and as the
 * editor's "current pack" affordance, so the two stay visually identical.
 */
export const PackCard: Component<PackCardProps> = (props) => (
  <Card
    as="button"
    variant="surface"
    testId={props.testId}
    class={`${css.packCard}${props.active ? ` ${css.packCardActive}` : ''}`}
    aria-pressed={props.active}
    aria-label={props['aria-label']}
    ref={props.ref}
    onClick={props.onClick}
  >
    <Flex as="div" direction="column" gap={2} grow>
      <Flex as="div" align="baseline" justify="between" gap={2}>
        <Text as="span" size={2} weight="medium" truncate selectable={false}>
          {props.pack.name}
        </Text>
        <Text as="span" size={1} color="lowContrast" selectable={false}>
          {numberFormat.format(props.pack.total)}
        </Text>
      </Flex>
      <Flex as="div" align="center" justify="between" gap={2}>
        <Flex as="div" align="center" gap={2}>
          <For each={props.pack.samples}>
            {(sample) => (
              <svg
                class={css.packSample}
                viewBox={`0 0 ${sample.width ?? props.pack.width} ${sample.height ?? props.pack.height}`}
                innerHTML={sample.body}
              />
            )}
          </For>
        </Flex>
        <Show when={props.pack.license?.spdx}>
          {(spdx) => (
            <Badge size={1} variant="soft" color="neutral">
              {spdx()}
            </Badge>
          )}
        </Show>
      </Flex>
    </Flex>
  </Card>
);
