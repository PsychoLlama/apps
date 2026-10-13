import {
  solidStart as solidStartPlugin,
  type SolidStartOptions,
} from '@solidjs/start/config';
import type { PluginOption } from 'vite';
import solidPlugin, { type Options as SolidOptions } from 'vite-plugin-solid';
import { eraseOverloadSignatures } from '@dev/babel-plugin-erase-overload-signatures';

/**
 * Plugin options, as an object or a function that fills in an empty
 * one. Either way, the house defaults are layered on afterward.
 */
export type Configure<Options> = Options | ((options: Options) => void);

// Solid also accepts `babel` as a per-file function. Only the object
// form is allowed here, so the house plugins can always be appended.
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

const resolve = <Options extends object>(
  custom: Configure<Options> | undefined,
): Options => {
  if (typeof custom !== 'function') return custom ?? ({} as Options);

  const options = {} as Options;
  custom(options);

  return options;
};

const applySolidDefaults = (options: SolidPluginOptions) => {
  const babel = (options.babel ??= {});
  const plugins = (babel.plugins ??= []);
  plugins.push(eraseOverloadSignatures());
};

/** Plain `vite-plugin-solid` with the house defaults, for packages. */
export const solid = (
  custom: Configure<SolidPluginOptions> | undefined,
): PluginOption => {
  const options = resolve(custom);
  applySolidDefaults(options);

  return solidPlugin(options);
};

/**
 * SolidStart with the house defaults, for apps. It wraps its own copy of
 * the Solid plugin, which gets `solid` as its options (its own `solid`
 * wins per key).
 */
export const solidStart = (
  solidCustom: Configure<SolidPluginOptions> | undefined,
  startCustom: Configure<SolidStartPluginOptions> | undefined,
): PluginOption => {
  const startOptions = resolve(startCustom);

  startOptions.solid = { ...resolve(solidCustom), ...startOptions.solid };
  applySolidDefaults(startOptions.solid);

  // Suppresses the dev toolbar added in 2.0.0-rc.2, which otherwise
  // pins a persistent overlay to every dev page. Turning it off swaps
  // `<DevToolbar>` back out for the plain error boundary, so uncaught
  // errors still surface — just as the 500 fallback plus a console
  // trace instead of the toolbar's error viewer.
  startOptions.devOverlay ??= false;

  return solidStartPlugin(startOptions);
};
