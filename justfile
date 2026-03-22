_:
    just --list

# Format all code
format:
    treefmt

# Check formatting
format-check:
    treefmt --ci

# Run all checks
check:
    #!/usr/bin/env bash
    set -uo pipefail
    failed=0
    just format-check || failed=1
    pnpm lint || failed=1
    pnpm typecheck || failed=1
    exit $failed
