# Asset Caching

How deployed apps cache their static assets on Cloudflare. `@dev/vite-plugin-headers` applies this policy through `_headers` by default, and substrate includes it in every app.

## Policy

- Files under `/_build/` are assumed immutable and are cached indefinitely.
- Everything else requiring a stable URL revalidates (i.e., `.html`, `/manifest.webmanifest`).

## Enforcement

- `assertHashedAssets` (enabled through `substrate(...)`) fails the build if an output emits without `[hash]`.
