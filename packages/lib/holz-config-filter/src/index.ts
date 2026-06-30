// The package's public surface — a holz filter whose pattern is a
// `@lib/runtime-config` option, resolved from OPFS and live-updated as the
// option changes. The counterpart to `@holz/env-filter`, but readable in
// every realm OPFS reaches (workers included) and reactive to changes.
export { createConfigFilter } from './config-filter';
export type {
  ConfigFilterOption,
  CreateConfigFilterOptions,
} from './config-filter';
