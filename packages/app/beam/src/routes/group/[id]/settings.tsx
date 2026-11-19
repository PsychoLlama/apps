import { createEffect, onCleanup, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useAction, useValue } from '@lib/effects/solid';
import { Container } from '@lib/ui';
import { BeamFrame } from '../../../components/beam-frame';
import { GroupMissing } from '../../../components/group-missing';
import { GroupSettings } from '../../../components/group-settings';
import { $viewGroup } from '../../../effects';
import { $groups, groupLabel } from '../../../state';

/**
 * A group's settings at `/group/:id/settings`. Served from one
 * prerendered shell for every id, like the group itself.
 */
const BeamGroupSettings = () => {
  const params = useParams<{ id: string }>();
  const groups = useValue($groups);
  const viewGroup = useAction($viewGroup);

  // The group's devices come with its feed.
  createEffect(() => viewGroup(params.id));
  onCleanup(() => viewGroup(null));

  /** This group, once this device's database has listed it. */
  const group = () => groups().list.find((it) => it.id === params.id);

  const trail = () => {
    const known = group();
    if (!known) return [{ label: 'Settings' }];

    return [
      { label: groupLabel(known), href: `/group/${known.id}` },
      { label: 'Settings' },
    ];
  };

  return (
    <BeamFrame trail={trail()}>
      <Show
        when={group()}
        fallback={
          <Show when={groups().loaded}>
            <GroupMissing />
          </Show>
        }
      >
        {(known) => (
          <Container as="div" size={2}>
            <GroupSettings group={known()} />
          </Container>
        )}
      </Show>
    </BeamFrame>
  );
};

export default BeamGroupSettings;
