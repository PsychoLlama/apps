import { solidStart, type SolidStartOptions } from '@solidjs/start/config';
import type { PluginOption } from 'vite';
import solid, { type Options as SolidOptions } from 'vite-plugin-solid';
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

export interface SolidFrameworkOptions {
  /**
   * Options for `vite-plugin-solid`. The house babel plugins are added
   * to whatever `babel` holds. With `solidStart`, these become its
   * `solid` options (its own `solid` wins per key), though SolidStart
   * overrides `ssr` and `extensions`.
   */
  solid?: Configure<SolidPluginOptions>;

  /**
   * Build with SolidStart instead of plain Solid. Only apps need it:
   * its file router and server environments expect an `src/app.tsx`,
   * and don't run under vitest. Pass `true` for the defaults (dev
   * overlay off).
   */
  solidStart?: true | Configure<SolidStartPluginOptions>;
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

/**
 * Returns SolidStart when `solidStart` is set, plain `vite-plugin-solid`
 * otherwise, with the house defaults applied to either. The two are
 * mutually exclusive: SolidStart wraps its own copy of the Solid plugin.
 */
export const solidOrSolidStart = (
  options: SolidFrameworkOptions,
): PluginOption => {
  const solidOptions = resolve(options.solid);

  if (!options.solidStart) {
    applySolidDefaults(solidOptions);
    return solid(solidOptions);
  }

  const startOptions = resolve(
    options.solidStart === true ? undefined : options.solidStart,
  );

  startOptions.solid = { ...solidOptions, ...startOptions.solid };
  applySolidDefaults(startOptions.solid);

  // Suppresses the dev toolbar added in 2.0.0-rc.2, which otherwise
  // pins a persistent overlay to every dev page. Turning it off swaps
  // `<DevToolbar>` back out for the plain error boundary, so uncaught
  // errors still surface — just as the 500 fallback plus a console
  // trace instead of the toolbar's error viewer.
  startOptions.devOverlay ??= false;

  return solidStart(startOptions);
};
