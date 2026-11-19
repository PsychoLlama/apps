import { createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAction } from '@lib/effects/solid';
import { Button, Flex, TextField } from '@lib/ui';
import IconPlus from 'virtual:icons/mdi/plus';
import { $createGroup } from '../effects';
import { GROUP_NAME_MAX_LENGTH } from '../state';

/**
 * Start a group: name it, and land in it. The group exists on this device
 * alone until another is linked.
 *
 * A real `<form>`, so Enter in the field and the button arrive at the same
 * handler. The field is uncontrolled: the name matters for exactly one
 * submit, and the form already holds it.
 */
export const NewGroupForm = () => {
  const navigate = useNavigate();
  const createGroup = useAction($createGroup);

  // An action answers through `latest`, not a return value.
  createEffect(() => {
    const id = createGroup.latest;
    if (id) navigate(`/group/${id}`);
  });

  const handleSubmit = (
    event: SubmitEvent & { currentTarget: HTMLFormElement },
  ) => {
    event.preventDefault();

    const name = new FormData(event.currentTarget).get('name');
    if (typeof name === 'string') createGroup(name);
  };

  return (
    <Flex as="form" gap={2} onSubmit={handleSubmit}>
      <Flex as="div" direction="column" grow>
        <TextField
          testId="new-group-name"
          name="name"
          aria-label="Group name"
          placeholder="Name a new group"
          required
          maxlength={GROUP_NAME_MAX_LENGTH}
          autocomplete="off"
          autocapitalize="words"
          enterkeyhint="done"
        />
      </Flex>

      <Button
        testId="new-group-create"
        type="submit"
        disabled={createGroup.pending}
      >
        <IconPlus width="18" height="18" aria-hidden="true" />
        Create
      </Button>
    </Flex>
  );
};
