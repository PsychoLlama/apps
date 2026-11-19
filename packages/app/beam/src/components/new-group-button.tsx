import { createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAction } from '@lib/effects/solid';
import { Button } from '@lib/ui';
import IconPlus from 'virtual:icons/mdi/plus';
import { $createGroup } from '../effects';

/**
 * Start another group, and land in it. Nothing to fill in: it exists on
 * this device alone until another is linked, and is named when someone
 * wants it named.
 */
export const NewGroupButton = () => {
  const navigate = useNavigate();
  const createGroup = useAction($createGroup);

  // An action answers through `latest`, not a return value.
  createEffect(() => {
    const id = createGroup.latest;
    if (id) navigate(`/group/${id}`);
  });

  return (
    <Button
      testId="new-group"
      variant="soft"
      color="neutral"
      disabled={createGroup.pending}
      onClick={() => createGroup()}
    >
      <IconPlus width="18" height="18" aria-hidden="true" />
      New group
    </Button>
  );
};
