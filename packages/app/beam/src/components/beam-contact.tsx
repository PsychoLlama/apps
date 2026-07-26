import { FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Text } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';

/**
 * The contact detail view at `/beam/contacts/:id` — one peer's record: its
 * label, how it was paired, and the controls to rename, block, or forget it.
 *
 * A stub for now; the address book it reads from doesn't exist yet.
 */
export const BeamContact = () => {
  return (
    <>
      {/* The trail is deliberately free of `:id`. This route is served from
          one prerendered shell (`/beam/__contact.html`) for every id, and
          Solid's hydration adopts the server's DOM without rewriting
          attributes — so a param-derived `href` would render once with the
          `__id` build sentinel and stay frozen there until some unrelated
          update re-ran the effect. `useParams()` itself is correct on the
          client; it's only the prerendered markup that can't depend on it.
          The same rule binds anything this page renders from the id. */}
      <SiteHeader
        trail={[{ label: 'Beam', href: '/beam' }, { label: 'Contact' }]}
        actions={<ConnectionIndicator />}
      />
      <FrameBody>
        <Container as="div" size={2}>
          <Callout color="neutral">
            <Text as="span" size={2} selectable={false}>
              Work in progress.
            </Text>
          </Callout>
        </Container>
      </FrameBody>
    </>
  );
};
