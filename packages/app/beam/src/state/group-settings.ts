import { defineCell, defineCommand } from '@lib/state';

/** Whether the settings of the group on screen are showing. */
export const $groupSettings = defineCell<boolean>(() => false);

/** The group's settings were opened or put away. */
export const $groupSettingsToggled = defineCommand(
  [$groupSettings],
  ([, setOpen]) =>
    (open: boolean) => {
      setOpen(open);
    },
);
