import { createEffect, onCleanup, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useAction, useValue } from '@lib/effects/solid';
import { BeamFrame } from '../../../components/beam-frame';
import { Composer } from '../../../components/composer';
import { DropTarget } from '../../../components/drop-target';
import { Feed } from '../../../components/feed';
import { GroupActions } from '../../../components/group-actions';
import { GroupMissing } from '../../../components/group-missing';
import { GroupOutside } from '../../../components/group-outside';
import { InviteDialog } from '../../../components/invite-dialog';
import { $viewGroup } from '../../../effects';
import { $groups, groupLabel } from '../../../state';

/**
 * One group at `/group/:id`: everything shared to it, oldest at the top,
 * and a composer held to the bottom. Anything dropped on the page is
 * shared to it.
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
    <BeamFrame
      trail={trail()}
      actions={
        <Show when={group()?.member}>
          <GroupActions groupId={params.id} />
        </Show>
      }
      footer={
        <Show when={group()?.member}>
          <Composer groupId={params.id} />
        </Show>
      }
      overlay={
        <Show when={group()?.member}>
          <DropTarget groupId={params.id} />
        </Show>
      }
    >
      <Show
        when={group()}
        fallback={
          // Only once the database has said so. Before that, nothing.
          <Show when={groups().loaded}>
            <GroupMissing />
          </Show>
        }
      >
        {(known) => (
          <Show
            when={known().member}
            fallback={<GroupOutside group={known()} />}
          >
            <Feed groupId={params.id} />
          </Show>
        )}
      </Show>

      <InviteDialog />
    </BeamFrame>
  );
};

export default BeamGroup;
