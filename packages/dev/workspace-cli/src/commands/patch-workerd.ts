/**
 * `patch-workerd` rewrites the dynamic loader and library path
 * baked into the prebuilt `workerd` binary so it can run on NixOS.
 * No-op when `WORKERD_DYNAMIC_LOADER` is unset (CI, non-NixOS).
 *
 * Wired as the root `prepare` script so every `pnpm install` keeps
 * each installed `@cloudflare/workerd-linux-*` binary's interpreter
 * pointed at the current shell's glibc. The flake's `nixos`
 * devshell supplies the env vars and `patchelf` itself.
 */

/* eslint-disable no-console -- stdout is this CLI's output surface. */

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { defineCommand } from 'citty';

export default defineCommand({
  meta: {
    name: 'patch-workerd',
    description: 'Rewrite the workerd binary loader for NixOS hosts.',
  },
  run() {
    const loader = process.env.WORKERD_DYNAMIC_LOADER;
    const libs = process.env.WORKERD_BINARY_LIBS;
    if (!loader || !libs) return;

    for (const dir of findWorkerdPackages()) {
      const binary = path.join(dir, 'bin', 'workerd');
      if (!existsSync(binary)) continue;

      // Compare against the current env vars rather than just probing
      // for any `/nix/store` prefix. A flake bump produces new store
      // paths even though the old ones look "patched"; equality forces
      // a re-patch when the shell's glibc moves.
      const currentLoader = patchelf(['--print-interpreter', binary]);
      const currentRpath = patchelf(['--print-rpath', binary]);
      if (currentLoader === loader && currentRpath === libs) continue;

      // Atomic-replace via tmp file. Modifying the binary in place
      // throws ETXTBSY when a dev server is running it; renaming a
      // fresh inode over the original leaves the running process
      // attached to the old file and points future invocations at
      // the new one.
      const tmp = `${binary}.patchelf.tmp`;
      copyFileSync(binary, tmp);
      patchelf(['--set-interpreter', loader, '--set-rpath', libs, tmp]);
      renameSync(tmp, binary);
      console.log(`Patched ${binary}`);
    }
  },
});

/**
 * Asks pnpm where each installed `@cloudflare/workerd-linux-*`
 * package lives. Filters out workspace packages and intermediate
 * deps that show up in `pnpm ls`'s recursive output — only the
 * platform packages themselves carry the binary we need to patch.
 */
const findWorkerdPackages = (): string[] => {
  const stdout = execFileSync(
    'pnpm',
    [
      'ls',
      '--parseable',
      '--depth',
      'Infinity',
      '--recursive',
      '@cloudflare/workerd-linux-64',
      '@cloudflare/workerd-linux-arm64',
    ],
    { encoding: 'utf8' },
  );

  return stdout
    .split('\n')
    .filter((line) => line.includes('/@cloudflare/workerd-linux-'));
};

const patchelf = (args: string[]): string =>
  execFileSync('patchelf', args, { encoding: 'utf8' }).trim();
