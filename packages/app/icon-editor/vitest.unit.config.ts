import { defineConfig, mergeConfig } from 'vitest/config';
import { iconPacks } from '@dev/vite-plugin-icon-packs';
import unit from '@dev/vitest-config/unit';

// Only the icon editor imports `virtual:icon-packs`, so the plugin layers
// onto the shared preset here rather than living in it.
export default mergeConfig(unit, defineConfig({ plugins: [iconPacks()] }));
