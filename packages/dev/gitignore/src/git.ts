import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Runs git in `cwd` and returns its trimmed stdout. Throws on failure. */
export const git = async (cwd: string, ...args: string[]): Promise<string> => {
  const { stdout } = await execFileAsync('git', args, { cwd });

  return stdout.trim();
};
