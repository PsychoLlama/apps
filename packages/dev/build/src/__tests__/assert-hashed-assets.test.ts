import type { Plugin } from 'vite';
import { assertHashedAssets } from '../vite-plugin/assert-hashed-assets.ts';

const goodTemplates = {
  entryFileNames: 'assets/[name]-[hash].js',
  chunkFileNames: 'assets/[name]-[hash].js',
  assetFileNames: 'assets/[name]-[hash][extname]',
};

const fakeContext = {
  error: (message: string) => {
    throw new Error(message);
  },
};

const callRenderStart = (
  plugin: Plugin,
  templates: Record<string, unknown>,
) => {
  const hook = plugin.renderStart as (options: unknown) => void;
  hook.call(fakeContext, templates);
};

const callApplyToEnvironment = (plugin: Plugin, ssr: boolean) => {
  const hook = plugin.applyToEnvironment as (env: unknown) => boolean;
  return hook.call(fakeContext, { config: { build: { ssr } } });
};

describe('assertHashedAssets', () => {
  it('accepts templates that all contain [hash]', () => {
    const plugin = assertHashedAssets();

    expect(() => callRenderStart(plugin, goodTemplates)).not.toThrow();
  });

  it('rejects an entry template missing [hash]', () => {
    const plugin = assertHashedAssets();

    expect(() =>
      callRenderStart(plugin, {
        ...goodTemplates,
        entryFileNames: 'assets/[name].js',
      }),
    ).toThrow(/entryFileNames/);
  });

  it('rejects a chunk template missing [hash]', () => {
    const plugin = assertHashedAssets();

    expect(() =>
      callRenderStart(plugin, {
        ...goodTemplates,
        chunkFileNames: 'chunks/[name].js',
      }),
    ).toThrow(/chunkFileNames/);
  });

  it('rejects an asset template missing [hash]', () => {
    const plugin = assertHashedAssets();

    expect(() =>
      callRenderStart(plugin, {
        ...goodTemplates,
        assetFileNames: 'assets/[name][extname]',
      }),
    ).toThrow(/assetFileNames/);
  });

  it('rejects function templates (cannot statically verify)', () => {
    const plugin = assertHashedAssets();

    expect(() =>
      callRenderStart(plugin, {
        ...goodTemplates,
        entryFileNames: () => 'assets/safe-[hash].js',
      }),
    ).toThrow(/function/);
  });

  it('declines to attach to SSR environments', () => {
    const plugin = assertHashedAssets();

    expect(callApplyToEnvironment(plugin, true)).toBe(false);
    expect(callApplyToEnvironment(plugin, false)).toBe(true);
  });
});
