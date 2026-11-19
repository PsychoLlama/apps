import { createEffect, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAction, useValue } from '@lib/effects/solid';
import { Flex, Link, Text } from '@lib/ui';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import { $createGroup } from '../effects';
import { $groups, groupLabel } from '../state';
import * as styles from './group-list.css';
import { NewGroupButton } from './new-group-button';

/**
 * Every group this device holds, each a way in to its feed, and a way to
 * start another.
 *
 * A device with no groups never sees this. It's given one and taken
 * straight to it: someone arriving for the first time wants to share
 * something, and doesn't yet know what a group is or why they'd name one.
 *
 * Renders nothing until the database has answered. An empty list before
 * then would be mistaken for a device with no groups.
 */
export const GroupList = () => {
  const navigate = useNavigate();
  const groups = useValue($groups);
  const createGroup = useAction($createGroup);

  /** Whether this device's first group has been asked for. Once. */
  let founding = false;

  createEffect(() => {
    if (founding || !groups().loaded || groups().list.length > 0) return;

    founding = true;
    createGroup();
  });

  // Replaces the empty home in history: there's nothing there to go back to.
  createEffect(() => {
    const id = createGroup.latest;
    if (id) navigate(`/group/${id}`, { replace: true });
  });

  return (
    <Show when={groups().loaded && groups().list.length > 0}>
      <Flex as="div" direction="column" gap={5}>
        <Flex as="ul" direction="column" testId="groups">
          <For each={groups().list}>
            {(group) => (
              <Flex as="li" direction="column">
                <Link
                  testId="group-open"
                  href={`/group/${group.id}`}
                  color="neutral"
                  class={styles.row}
                >
                  <Text as="span" selectable={false} class={styles.label}>
                    <Text as="span" weight="medium" truncate selectable={false}>
                      {groupLabel(group)}
                    </Text>

                    {/* Held, and not one this device is in. */}
                    <Show when={!group.member}>
                      <Text
                        as="span"
                        size={1}
                        color="lowContrast"
                        selectable={false}
                      >
                        Joining…
                      </Text>
                    </Show>
                  </Text>
                  <IconChevronRight width="20" height="20" aria-hidden="true" />
                </Link>
              </Flex>
            )}
          </For>
        </Flex>

        <Flex as="div">
          <NewGroupButton />
        </Flex>
      </Flex>
    </Show>
  );
};
