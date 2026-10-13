import { nitro as nitroPlugin, type NitroPluginConfig } from 'nitro/vite';
import type { PluginOption } from 'vite';
import { substrate as nitroSubstrate } from '@dev/nitro-module-substrate';
import type { Configure } from './solid.ts';

/**
 * Nitro options, with `modules` always present so configure functions can
 * append to the house modules.
 */
export interface NitroOptions extends NitroPluginConfig {
  modules: NonNullable<NitroPluginConfig['modules']>;
}

/** Nitro with the house defaults (static preset, substrate module), for apps. */
export const nitro = (
  configure: Configure<NitroOptions> | undefined,
): PluginOption => {
  const options: NitroOptions = {
    preset: 'static',
    modules: [nitroSubstrate()],
  };

  configure?.(options);

  return nitroPlugin(options);
};
