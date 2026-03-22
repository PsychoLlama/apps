_:
    just --list

# Format all code
fmt:
    treefmt

# Check formatting
fmt-check:
    treefmt --ci

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
