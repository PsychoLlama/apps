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

import { copyFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { defineCommand } from 'citty';
import { x } from 'tinyexec';

export default defineCommand({
  meta: {
    name: 'patch-workerd',
    description: 'Rewrite the workerd binary loader for NixOS hosts.',
  },
  async run() {
    const loader = process.env.WORKERD_DYNAMIC_LOADER;
    const libs = process.env.WORKERD_BINARY_LIBS;
    if (!loader || !libs) return;

    for (const dir of await findWorkerdPackages()) {
      const binary = path.join(dir, 'bin', 'workerd');

      // Compare against the current env vars rather than just probing
      // for any `/nix/store` prefix. A flake bump produces new store
      // paths even though the old ones look "patched"; equality forces
      // a re-patch when the shell's glibc moves.
      const currentLoader = await patchelf(['--print-interpreter', binary]);
      const currentRpath = await patchelf(['--print-rpath', binary]);
      if (currentLoader === loader && currentRpath === libs) continue;

      // Atomic-replace via tmp file. Modifying the binary in place
      // throws ETXTBSY when a dev server is running it; renaming a
      // fresh inode over the original leaves the running process
      // attached to the old file and points future invocations at
      // the new one.
      const tmp = `${binary}.patchelf.tmp`;
      await copyFile(binary, tmp);
      await patchelf(['--set-interpreter', loader, '--set-rpath', libs, tmp]);
      await rename(tmp, binary);
      console.log(`Patched ${binary}`);
    }
  },
});

// pnpm tracks every platform-specific workerd package in the graph
// but only extracts the tarball matching the host arch. Asking pnpm
// about the host's package alone keeps `pnpm ls` from returning a
// path that has no binary on disk.
const WORKERD_PACKAGE_BY_ARCH: Record<string, string | undefined> = {
  x64: '@cloudflare/workerd-linux-64',
  arm64: '@cloudflare/workerd-linux-arm64',
};

/**
 * Asks pnpm where the host-arch `@cloudflare/workerd-linux-*`
 * package lives. Filters out workspace packages and intermediate
 * deps that show up in `pnpm ls`'s recursive output — only the
 * platform package itself carries the binary we need to patch.
 */
const findWorkerdPackages = async (): Promise<string[]> => {
  const pkg = WORKERD_PACKAGE_BY_ARCH[process.arch];
  if (pkg === undefined) return [];

  const { stdout } = await x(
    'pnpm',
    ['ls', '--parseable', '--depth', 'Infinity', '--recursive', pkg],
    { throwOnError: true },
  );

  return stdout.split('\n').filter((line) => line.includes(`/${pkg}`));
};

const patchelf = async (args: string[]): Promise<string> => {
  const { stdout } = await x('patchelf', args, { throwOnError: true });
  return stdout.trim();
};
