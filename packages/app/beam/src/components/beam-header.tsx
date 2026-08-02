import { Show } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { useValue } from '@lib/state';
import { SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { Text } from '@lib/ui';
import { selfLabelFormula } from '../state/device';

/**
 * The breadcrumb for a `/beam/*` path. Matched on the prefix, never on the
 * id: each dynamic route is served from one prerendered shell for every id,
 * so anything derived from the id would ship the `__id` build sentinel in the
 * markup — and Solid hydrates by adopting the server's DOM rather than
 * rewriting it, which would leave it stuck there. The prefix is the same for
 * every id, so it survives that.
 */
const trailFor = (pathname: string): SiteHeaderCrumb[] => {
  const beam = { label: 'Beam', href: '/beam' };

  if (pathname.startsWith('/beam/share/')) return [beam, { label: 'Share' }];
  if (pathname.startsWith('/beam/contacts/')) {
    return [beam, { label: 'Contact' }];
  }

  // The root of the section links nowhere — never a link to the page you're
  // already on.
  return [{ label: 'Beam' }];
};

/**
 * The header for every `/beam/*` route, rendered once by the layout rather
 * than by each view.
 *
 * It's the layout's because of what sits under it: the contacts rail spans
 * the width below the header, so the header has to be the layout's own child
 * to have a width for the rail to sit under. A header rendered per route
 * would be inside the pane the rail leaves, and the rail would run up the
 * side of it instead.
 *
 * The trail comes off the path for the same reason — there's one header now,
 * and it has to say where it is. The device's own name rides in the actions
 * tray on every route: it's this device's identity, which is chrome, and the
 * question "what do they see me as" doesn't only come up on the home page.
 * It's derived from the endpoint key, so it turns up as soon as the key is
 * loaded rather than waiting on the relay; until then the tray is empty,
 * since a placeholder name is a lie someone might read out to the person
 * beside them.
 */
export const BeamHeader = () => {
  const location = useLocation();
  const selfLabel = useValue(selfLabelFormula);

  return (
    <SiteHeader
      trail={trailFor(location.pathname)}
      actions={
        <Show when={selfLabel()}>
          {(label) => (
            <Text
              as="span"
              size={2}
              color="lowContrast"
              title="The name other devices see you by"
              selectable
            >
              {label()}
            </Text>
          )}
        </Show>
      }
    />
  );
};
