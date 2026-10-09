// Ambient types for everything `substrate()` always provides: Vite's
// client env, icon components, `import.meta.INSTRUMENTATION_SCOPE`, and
// the `?to-png=<size>` / `?inline-script` imports. Opt-in plugins
// (`pwa`, icon packs) ship their own `/types` for the modules that use
// them.

/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/solid" />
/// <reference types="@dev/vite-plugin-instrumentation-scope/types" />
/// <reference types="@dev/vite-plugin-svg-to-png/types" />
/// <reference types="@dev/vite-plugin-inline-script/types" />
