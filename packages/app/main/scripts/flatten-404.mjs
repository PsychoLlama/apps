// Nitro prerenders `/404` to `.output/public/404/index.html`, but
// Cloudflare Pages' `not_found_handling = "404-page"` looks for
// `404.html` at the root of the assets directory. Flatten it.
import { rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const publicDir = resolve(import.meta.dirname, '../.output/public');
const src = resolve(publicDir, '404/index.html');
const dst = resolve(publicDir, '404.html');

await rename(src, dst);
await rm(resolve(publicDir, '404'), { recursive: true, force: true });
