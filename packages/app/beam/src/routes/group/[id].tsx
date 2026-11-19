import { createEffect, onCleanup } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useAction, useValue } from '@lib/effects/solid';
import { Flex } from '@lib/ui';
import { BeamFrame } from '../../components/beam-frame';
import { Composer } from '../../components/composer';
import { Feed } from '../../components/feed';
import { $viewGroup } from '../../effects';
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

  // Effects don't run during SSG, which is what keeps the worker off the
  // server: turning the feed is the first thing that reaches for it.
  createEffect(() => viewGroup(params.id));
  onCleanup(() => viewGroup(null));

  /**
   * The group's own crumb, once this device knows the group. Until then
   * the header says nothing rather than something it would have to correct.
   */
  const trail = () => {
    const group = groups().list.find((it) => it.id === params.id);
    return group ? [{ label: groupLabel(group) }] : [];
  };

  return (
    <BeamFrame trail={trail()}>
      <Flex as="div" direction="column" gap={4}>
        <Composer groupId={params.id} />
        <Feed groupId={params.id} />
      </Flex>
    </BeamFrame>
  );
};

export default BeamGroup;
