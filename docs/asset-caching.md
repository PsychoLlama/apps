# Asset Caching

How deployed apps cache their static assets on Cloudflare. Each app applies this policy through substrate's `headers` option.

## Policy

- Files under `/_build/` are assumed immutable and are cached indefinitely.
- Everything else requiring a stable URL revalidates (i.e., `.html`, `/manifest.webmanifest`).

## Enforcement

- `assertHashedAssets` (enabled through `substrate(...)`) fails the build if an output emits without `[hash]`.
