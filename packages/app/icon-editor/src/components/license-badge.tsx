import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Badge, Link } from '@lib/ui';
import type { IconPackLicense } from '../icons';
import * as css from './license-badge.css';

interface LicenseBadgeProps {
  /** Pack license metadata from the resolved icon, if any. */
  license: IconPackLicense | undefined;
}

/**
 * SPDX license chip for the selected icon's pack. Links to the upstream
 * license text when iconify provides a URL, otherwise renders a bare
 * badge. Renders nothing when no SPDX identifier is known.
 *
 * Aligns to the top of its flex row so it sits as a corner tag beside
 * the taller icon thumbnail.
 */
export const LicenseBadge: Component<LicenseBadgeProps> = (props) => (
  <Show when={props.license?.spdx}>
    {(spdx) => (
      <Show
        when={props.license?.url}
        fallback={
          <Badge class={css.root} size={1} variant="soft" color="neutral">
            {spdx()}
          </Badge>
        }
      >
        {(url) => (
          <Link
            class={css.root}
            testId="icon-license"
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
    )}
  </Show>
);
