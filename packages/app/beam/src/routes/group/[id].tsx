import { createEffect, onCleanup, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useAction, useValue } from '@lib/effects/solid';
import { Button, Callout, Flex, Text } from '@lib/ui';
import IconLink from 'virtual:icons/mdi/cellphone-link';
import { BeamFrame } from '../../components/beam-frame';
import { Composer } from '../../components/composer';
import { Feed } from '../../components/feed';
import { InviteDialog } from '../../components/invite-dialog';
import { $openInvite, $viewGroup } from '../../effects';
import { $groups, groupLabel } from '../../state';

/**
 * One group at `/group/:id`: a composer, and everything shared to the
 * group under it.
 *
 * Served from one prerendered shell for every id, so the shell's `:id` is
 * a placeholder and nothing drawn from it is prerendered. The feed only
 * exists once the client's database has answered for the real id. See
 * `docs/dynamic-prerendered-shells.md`.
 */
const BeamGroup = () => {
  const params = useParams<{ id: string }>();
  const groups = useValue($groups);
  const viewGroup = useAction($viewGroup);
  const openInvite = useAction($openInvite);

  // Effects don't run during SSG, which is what keeps the worker off the
  // server: turning the feed is the first thing that reaches for it.
  createEffect(() => viewGroup(params.id));
  onCleanup(() => viewGroup(null));

  /** This group, once this device's database has listed it. */
  const group = () => groups().list.find((it) => it.id === params.id);

  /**
   * The group's own crumb, once this device knows the group. Until then
   * the header says nothing rather than something it would have to correct.
   */
  const trail = () => {
    const known = group();
    return known ? [{ label: groupLabel(known) }] : [];
  };

  return (
    <BeamFrame trail={trail()}>
      <Show when={group()}>
        {(known) => (
          <Show
            when={known().member}
            fallback={
              <Callout testId="group-joining" color="neutral">
                <Text as="p" selectable={false}>
                  Joining. This device is let in once enough of the group's
                  devices are online to agree to it.
                </Text>
              </Callout>
            }
          >
            <Flex as="div" direction="column" gap={4}>
              <Composer groupId={params.id} />
              <Feed groupId={params.id} />

              {/* Linking is rare, so it sits below what the page is for. */}
              <Flex as="div" justify="start">
                <Button
                  testId="group-invite"
                  variant="ghost"
                  color="neutral"
                  size={1}
                  disabled={openInvite.pending}
                  onClick={() => openInvite(params.id)}
                >
                  <IconLink width="16" height="16" aria-hidden="true" />
                  Link a device
                </Button>
              </Flex>
            </Flex>
          </Show>
        )}
      </Show>

      <InviteDialog />
    </BeamFrame>
  );
};

export default BeamGroup;
