Guidelines for each `@app/*` package.

# General

- 1 file per component.
- Organize by feature.
- Use subdirs for complex features.

# Routes

- Under `src/routes/*.tsx`.
- Package export: `./routes/*`.
- Thin: delegates to `components/`.
- Provides `@lib/shell` layout.

# Components

- Under `src/components/*`.
- Consumes `src/state/`.

# State

- Under `src/state/*`.
- Uses `@lib/state` for app state and effects.

# Config

- Under `src/config.ts`.
- Exports `@lib/runtime-config` flags and settings.
- Package export: `./config`.
