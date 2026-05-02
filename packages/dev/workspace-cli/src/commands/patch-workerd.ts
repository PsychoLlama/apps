/**
 * `patch-workerd` rewrites the dynamic loader and library path
 * baked into the prebuilt `workerd` binary so it can run on NixOS.
 * No-op when `WORKERD_DYNAMIC_LOADER` is unset (CI, non-NixOS).
 *
 * Wired as the root `prepare` script so every `pnpm install` keeps
 * the installed workerd binary pointed at the current shell's
 * glibc. The flake's `nixos` devshell supplies the env vars and
 * `patchelf` itself.
 *
 * Patches in place rather than via copy+rename. Workerd's
 * `install.js` hardlinks the meta `workerd/bin/workerd` to the
 * platform package's binary, and an in-place edit updates both
 * paths simultaneously without us having to track or re-establish
 * the hardlink. The trade-off is `ETXTBSY` when re-patching while
 * a dev server holds the file open — treated as a soft failure
 * (warn + exit 0) since the next install in a fresh shell will
 * pick the change back up.
 */

/* eslint-disable no-console -- stdout/stderr are this CLI's output surface. */

import path from 'node:path';
import { defineCommand } from 'citty';
import { NonZeroExitError, x } from 'tinyexec';

// pnpm tracks every platform-specific workerd package in the graph
// but only extracts the tarball matching the host arch. Asking pnpm
// about the host's package alone keeps `pnpm ls` from returning a
// path that has no binary on disk.
const WORKERD_PACKAGE_BY_ARCH: Record<string, string | undefined> = {
  x64: '@cloudflare/workerd-linux-64',
  arm64: '@cloudflare/workerd-linux-arm64',
};

export default defineCommand({
  meta: {
    name: 'patch-workerd',
    description: 'Rewrite the workerd binary loader for NixOS hosts.',
  },
  async run() {
    const loader = process.env.WORKERD_DYNAMIC_LOADER;
    const libs = process.env.WORKERD_BINARY_LIBS;
    if (!loader || !libs) return;

    const pkg = WORKERD_PACKAGE_BY_ARCH[process.arch];
    if (pkg === undefined) return;

    const dir = await findPackageDir(pkg);
    if (dir === undefined) return;

    const binary = path.join(dir, 'bin', 'workerd');

    // Compare against the current env vars rather than just probing
    // for any `/nix/store` prefix. A flake bump produces new store
    // paths even though the old ones look "patched"; equality forces
    // a re-patch when the shell's glibc moves.
    const [currentLoader, currentRpath] = await Promise.all([
      patchelf(['--print-interpreter', binary]),
      patchelf(['--print-rpath', binary]),
    ]);
    if (currentLoader === loader && currentRpath === libs) return;

    try {
      await patchelf([
        '--set-interpreter',
        loader,
        '--set-rpath',
        libs,
        binary,
      ]);
      console.log(`Patched ${binary}`);
    } catch (err) {
      if (!isTextFileBusy(err)) throw err;
      console.warn(
        `Skipped ${binary}: file is in use (likely a running dev server). ` +
          `Re-run after the server stops, or rely on the next fresh install.`,
      );
    }
  },
});

/**
 * Returns the file system directory of an installed package as
 * reported by `pnpm ls --parseable`. Filters by exact suffix so
 * `workerd` doesn't accidentally match `workerd-linux-64`, and
 * intermediate workspace packages are skipped.
 */
const findPackageDir = async (name: string): Promise<string | undefined> => {
  const { stdout } = await x(
    'pnpm',
    ['ls', '--parseable', '--depth', 'Infinity', '--recursive', name],
    { throwOnError: true },
  );
  return stdout.split('\n').find((line) => line.endsWith(`/${name}`));
};

const patchelf = async (args: string[]): Promise<string> => {
  const { stdout } = await x('patchelf', args, { throwOnError: true });
  return stdout.trim();
};

const isTextFileBusy = (err: unknown): boolean =>
  err instanceof NonZeroExitError &&
  /text file busy/i.test(err.output?.stderr ?? '');
