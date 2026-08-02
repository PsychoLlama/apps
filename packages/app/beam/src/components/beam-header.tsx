import { Show } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { useCommit, useValue } from '@lib/state';
import { SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { Button, Text } from '@lib/ui';
import { renameOpenedTopic, selfLabelFormula } from '../state/contacts';
import { RenameDialog } from './rename-dialog';

/**
 * What the name is, said once. It's the tooltip whether or not the name can be
 * changed from here — the question it answers is "what do they see me as",
 * which is why the name is in the header at all.
 */
const TOOLTIP = 'The name other devices see you by';

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
 *
 * Changing it is the name itself, as a button, rather than a control parked
 * next to one. It belongs here rather than under settings — the moment you
 * want it is the moment you've just read the name and found it wrong — and
 * the name is already exactly the thing you'd aim at, so nothing smaller has
 * to appear to be aimed at. That also settles the touchscreen, which has no
 * hover state for a control to hide behind.
 *
 * Nothing marks it as one at rest. The bar is uniformly low-contrast chrome
 * by design, and a name that stays a name until you reach for it costs
 * nothing to whoever only wanted to read it — which is almost every glance.
 * The ghost fill under the pointer is what answers when somebody does.
 */
export const BeamHeader = (props: {
  /**
   * Whether the name may be changed from here. The layout says: the setup
   * step that collects the name owns it while it's on screen.
   */
  renameable: boolean;
}) => {
  const location = useLocation();
  const selfLabel = useValue(selfLabelFormula);
  const commit = useCommit();

  return (
    <>
      <SiteHeader
        trail={trailFor(location.pathname)}
        actions={
          <Show when={selfLabel()}>
            {(label) => (
              <Show
                when={props.renameable}
                fallback={
                  <Text
                    as="span"
                    size={2}
                    color="lowContrast"
                    title={TOOLTIP}
                    selectable
                  >
                    {label()}
                  </Text>
                }
              >
                {/* Named for what it does rather than for what it says. The
                    visible text is a name, and a button announced as one is a
                    button whose purpose nobody has said. */}
                <Button
                  testId="beam-rename-self"
                  aria-label={`Rename this device, currently ${label()}`}
                  title={TOOLTIP}
                  variant="ghost"
                  color="neutral"
                  onClick={() => commit(renameOpenedTopic({ kind: 'self' }))}
                >
                  {label()}
                </Button>
              </Show>
            )}
          </Show>
        }
      />

      {/* Mounted by the header rather than by whichever route is showing, so
          the form outlives navigation — the same reason the name it edits is
          up here at all. It renders nothing until it's opened. */}
      <RenameDialog target={{ kind: 'self' }} />
    </>
  );
};
