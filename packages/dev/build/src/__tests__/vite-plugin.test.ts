import type { Plugin, ResolvedConfig } from 'vite';
import { assertHashedAssetNames } from '../vite-plugin.ts';

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

const callConfigResolved = (plugin: Plugin, ssr = false) => {
  const hook = plugin.configResolved as (config: ResolvedConfig) => void;
  hook.call(fakeContext, { build: { ssr } } as ResolvedConfig);
};

const callRenderStart = (
  plugin: Plugin,
  templates: Record<string, unknown>,
) => {
  const hook = plugin.renderStart as (options: unknown) => void;
  hook.call(fakeContext, templates);
};

describe('assertHashedAssetNames', () => {
  it('accepts templates that all contain [hash]', () => {
    const plugin = assertHashedAssetNames();
    callConfigResolved(plugin);

    expect(() => callRenderStart(plugin, goodTemplates)).not.toThrow();
  });

  it('rejects an entry template missing [hash]', () => {
    const plugin = assertHashedAssetNames();
    callConfigResolved(plugin);

    expect(() =>
      callRenderStart(plugin, {
        ...goodTemplates,
        entryFileNames: 'assets/[name].js',
      }),
    ).toThrow(/entryFileNames/);
  });

  it('rejects a chunk template missing [hash]', () => {
    const plugin = assertHashedAssetNames();
    callConfigResolved(plugin);

    expect(() =>
      callRenderStart(plugin, {
        ...goodTemplates,
        chunkFileNames: 'chunks/[name].js',
      }),
    ).toThrow(/chunkFileNames/);
  });

  it('rejects an asset template missing [hash]', () => {
    const plugin = assertHashedAssetNames();
    callConfigResolved(plugin);

    expect(() =>
      callRenderStart(plugin, {
        ...goodTemplates,
        assetFileNames: 'assets/[name][extname]',
      }),
    ).toThrow(/assetFileNames/);
  });

  it('rejects function templates (cannot statically verify)', () => {
    const plugin = assertHashedAssetNames();
    callConfigResolved(plugin);

    expect(() =>
      callRenderStart(plugin, {
        ...goodTemplates,
        entryFileNames: () => 'assets/safe-[hash].js',
      }),
    ).toThrow(/function/);
  });

  it('skips SSR builds', () => {
    const plugin = assertHashedAssetNames();
    callConfigResolved(plugin, true);

    expect(() =>
      callRenderStart(plugin, {
        entryFileNames: 'server/[name].js',
        chunkFileNames: 'server/[name].js',
        assetFileNames: 'server/[name][extname]',
      }),
    ).not.toThrow();
  });
});
