/* eslint-disable solid/no-innerhtml -- sample bodies come from bundled
 * iconify packs, sliced and emitted as static assets at build time. No
 * untrusted input ever reaches innerHTML. */

import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Badge, Card, Flex, Text } from '@lib/ui';
import type { IconPackSummary } from '../icons';
import * as css from './pack-card.css';

const numberFormat = new Intl.NumberFormat();

/**
 * Stand-in summary rendered while the catalog is still in flight. Its
 * only job is geometry: the card measures the same as a real one, so
 * the pack index landing swaps content in without moving anything
 * below it. Every field is hidden behind the skeleton pulse — the
 * sample count (matching the build's `SAMPLE_COUNT`) and the text
 * sizes are what actually matter.
 */
const PLACEHOLDER_PACK: IconPackSummary = {
  id: '',
  name: 'Loading pack',
  total: 0,
  width: 24,
  height: 24,
  samples: Array.from({ length: 5 }, () => ({ name: '', body: '' })),
  license: { spdx: 'MIT' },
  manifestUrl: '',
};

interface PackCardProps {
  /**
   * Pack to summarize. `undefined` renders the card as a skeleton
   * placeholder of identical height — the pack index is fetched, and
   * the properties panel holds this slot open until it lands.
   */
  pack: IconPackSummary | undefined;
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
export const PackCard: Component<PackCardProps> = (props) => {
  const pack = () => props.pack ?? PLACEHOLDER_PACK;
  const loading = () => props.pack === undefined;

  return (
    <Card
      as="button"
      variant="surface"
      skeleton={loading()}
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
            {pack().name}
          </Text>
          <Text as="span" size={1} color="lowContrast" selectable={false}>
            {numberFormat.format(pack().total)}
          </Text>
        </Flex>
        <Flex as="div" align="center" justify="between" gap={2}>
          <Flex as="div" align="center" gap={2}>
            <For each={pack().samples}>
              {(sample) => (
                <svg
                  class={css.packSample}
                  viewBox={`0 0 ${sample.width ?? pack().width} ${sample.height ?? pack().height}`}
                  innerHTML={sample.body}
                />
              )}
            </For>
          </Flex>
          <Show when={pack().license?.spdx}>
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
};
