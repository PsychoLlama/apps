import { createEffect } from 'solid-js';
import { useClientResource } from '@lib/effects/solid';
import { $appearance } from '../../behavior/appearance';
import { $motion } from '../../behavior/motion';
import { $theme } from '../../behavior/theme';
import {
  COLOR_SCHEME_ATTRIBUTE,
  MOTION_ATTRIBUTE,
  THEME_ATTRIBUTE,
} from '../../constants';

/**
 * Keeps the `<html>` preference attributes on the current theme,
 * appearance, and motion, whichever tab changed them. The prelude stamps
 * them before paint; this takes over once mounted.
 */
export const RootAttributes = () => {
  // Unresolved until mount, so the prelude's stamp stands until then.
  const theme = useClientResource($theme);
  const appearance = useClientResource($appearance);
  const motion = useClientResource($motion);

  // `'system'` drops the attribute so media queries take over.
  const follow = (key: string, value: () => string | undefined) => {
    createEffect(() => {
      const current = value();
      if (current === undefined) return;

      const { dataset } = document.documentElement;
      if (current === 'system') delete dataset[key];
      else dataset[key] = current;
    });
  };

  follow(THEME_ATTRIBUTE, theme);
  follow(COLOR_SCHEME_ATTRIBUTE, appearance);
  follow(MOTION_ATTRIBUTE, motion);

  return null;
};
