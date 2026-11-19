import { For, Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Card, Flex, Text } from '@lib/ui';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import { $groups, groupLabel } from '../state';

/**
 * Every group this device holds, each a way in to its feed. Renders
 * nothing until the database has answered: an empty list before then
 * would read as "you have no groups".
 */
export const GroupList = () => {
  const groups = useValue($groups);

  return (
    <Show when={groups().loaded}>
      <Show
        when={groups().list.length > 0}
        fallback={
          <Text
            as="p"
            selectable={false}
            color="lowContrast"
            testId="groups-empty"
          >
            No groups yet. A group is a set of devices that share what's added
            to it. Start one for your own devices.
          </Text>
        }
      >
        <Flex as="ul" direction="column" gap={2} testId="groups">
          <For each={groups().list}>
            {(group) => (
              <Flex as="li" direction="column">
                <Card as="a" href={`/group/${group.id}`} size={2}>
                  <Flex as="div" align="center" justify="between" gap={3}>
                    <Flex as="div" direction="column" gap={1}>
                      <Text
                        as="span"
                        weight="medium"
                        truncate
                        selectable={false}
                      >
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
                          {group.removed ? 'Removed' : 'Joining…'}
                        </Text>
                      </Show>
                    </Flex>
                    <IconChevronRight
                      width="20"
                      height="20"
                      aria-hidden="true"
                    />
                  </Flex>
                </Card>
              </Flex>
            )}
          </For>
        </Flex>
      </Show>
    </Show>
  );
};
