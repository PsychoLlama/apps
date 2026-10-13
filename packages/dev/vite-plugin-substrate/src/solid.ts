import {
  solidStart as solidStartPlugin,
  type SolidStartOptions,
} from '@solidjs/start/config';
import type { PluginOption } from 'vite';
import solidPlugin, { type Options as SolidOptions } from 'vite-plugin-solid';
import { eraseOverloadSignatures } from '@dev/babel-plugin-erase-overload-signatures';

/**
 * Edits plugin options in place. They arrive with the house defaults
 * already applied.
 */
export type Configure<Options> = (options: Options) => void;

// Solid also accepts `babel` as a per-file function. Only the object
// form is allowed here, so configure functions can append to the house
// plugins.
type BabelConfig = Exclude<
  NonNullable<SolidOptions['babel']>,
  (...args: never[]) => unknown
>;

/** `vite-plugin-solid` options, with `babel` limited to an object. */
export interface SolidPluginOptions extends Omit<
  Partial<SolidOptions>,
  'babel'
> {
  babel?: BabelConfig;
}

/** SolidStart options, with `solid.babel` limited to an object. */
export interface SolidStartPluginOptions extends Omit<
  SolidStartOptions,
  'solid'
> {
  solid?: SolidPluginOptions;
}

const solidDefaults = (): SolidPluginOptions => ({
  babel: { plugins: [eraseOverloadSignatures()] },
});

/** Plain `vite-plugin-solid` with the house defaults, for packages. */
export const solid = (
  configure: Configure<SolidPluginOptions> | undefined,
): PluginOption => {
  const options = solidDefaults();
  configure?.(options);

  return solidPlugin(options);
};

/**
 * SolidStart with the house defaults, for apps. It wraps its own copy of
 * the Solid plugin, configured by `configureSolid` first and then
 * `configureStart` (as its `solid` options).
 */
export const solidStart = (
  configureSolid: Configure<SolidPluginOptions> | undefined,
  configureStart: Configure<SolidStartPluginOptions> | undefined,
): PluginOption => {
  const solidOptions = solidDefaults();
  const options: SolidStartPluginOptions = {
    solid: solidOptions,

    // Suppresses the dev toolbar added in 2.0.0-rc.2, which otherwise
    // pins a persistent overlay to every dev page. Turning it off swaps
    // `<DevToolbar>` back out for the plain error boundary, so uncaught
    // errors still surface — just as the 500 fallback plus a console
    // trace instead of the toolbar's error viewer.
    devOverlay: false,
  };

  configureSolid?.(solidOptions);
  configureStart?.(options);

  return solidStartPlugin(options);
};
