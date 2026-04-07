_:
    just --list

# Format all code
fmt:
    treefmt

# Check formatting
fmt-check:
    treefmt --ci

# Launch Storybook dev server
storybook:
    pnpm storybook

# Build the Solid app
build-app:
    pnpm build

# Build Storybook
build-storybook:
    pnpm storybook:build

# Build everything
build: build-app build-storybook
    cp -r storybook-static .output/public/__storybook

# Run all checks
check:
    #!/usr/bin/env bash
    set -uo pipefail
    failed=0
    just fmt-check || failed=1
    pnpm lint || failed=1
    pnpm typecheck || failed=1
    pnpm test || failed=1
    exit $failed
