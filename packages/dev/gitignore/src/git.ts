import { x } from 'tinyexec';

/** Runs git in `cwd` and returns its trimmed stdout. Throws on failure. */
export const git = async (cwd: string, ...args: string[]): Promise<string> => {
  const { stdout } = await x('git', args, {
    nodeOptions: { cwd },
    throwOnError: true,
  });

  return stdout.trim();
};
