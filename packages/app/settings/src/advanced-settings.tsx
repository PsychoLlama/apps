import { onCleanup, onMount } from 'solid-js';
import { useAction, useEffect } from '@lib/state';
import { Code, Flex, Switch, Text, TextField } from '@lib/ui';
import { setExperimentalEnabled, setLogFilter } from './state/advanced/actions';
import {
  commitExperimentalEffect,
  commitLogFilterEffect,
  hydrateExperimentalEffect,
  hydrateLogFilterEffect,
} from './state/advanced/bindings';
import {
  watchExperimentalEnabled,
  watchLogFilter,
} from './state/advanced/capabilities';
import { advancedSettings } from './state/advanced/store';

/**
 * `id` of the heading the Advanced section is labelled by. Shared between
 * the heading element and the section so the two stay in sync.
 */
export const advancedHeadingId = 'settings-advanced-heading';

const logFilterId = 'settings-log-filter';
const experimentalLabelId = 'settings-experimental-label';

/**
 * Advanced settings — runtime-config controls for debugging and preview
 * features. Each control reads/writes through `@lib/runtime-config`,
 * persisting an OPFS override on top of the per-environment default and
 * fanning the change out to every browsing context (sibling tabs and
 * workers included).
 */
export const AdvancedSettings = () => {
  const advanced = advancedSettings;
  const reconcileFilter = useEffect(hydrateLogFilterEffect);
  const reconcileExperimental = useEffect(hydrateExperimentalEffect);
  const commitFilter = useEffect(commitLogFilterEffect);
  const commitExperimental = useEffect(commitExperimentalEffect);
  const mirrorFilter = useAction(setLogFilter);
  const mirrorExperimental = useAction(setExperimentalEnabled);

  // The store is seeded with the build-environment default, so first
  // paint (and prerender) match without a flash. OPFS is client-only —
  // unavailable during SSG — so reconcile with any persisted override
  // after mount, then subscribe. Writes echo back through the
  // subscription, making it the single source of truth.
  onMount(() => {
    void reconcileFilter();
    void reconcileExperimental();
    onCleanup(watchLogFilter(mirrorFilter));
    onCleanup(watchExperimentalEnabled(mirrorExperimental));
  });

  return (
    <Flex as="div" direction="column" gap={4}>
      <Flex as="div" direction="column" gap={2}>
        <Text
          as="label"
          for={logFilterId}
          size={2}
          weight="medium"
          selectable={false}
        >
          Debug log filter
        </Text>
        <Text as="p" size={1} color="lowContrast" selectable={false}>
          Controls which logs reach the browser console. Uses{' '}
          <Code>@holz/pattern-filter</Code> syntax — <Code>*</Code> shows
          everything, empty hides all. Applies live, workers included.
        </Text>
        <TextField
          testId="advanced-log-filter"
          id={logFilterId}
          value={advanced.logFilter}
          placeholder="*"
          autocomplete="off"
          autocapitalize="off"
          enterkeyhint="done"
          spellcheck={false}
          onBlur={(event) => {
            const next = event.currentTarget.value;
            if (next !== advanced.logFilter) void commitFilter(next);
          }}
        />
      </Flex>

      <Flex as="div" direction="row" justify="between" align="center" gap={4}>
        <Flex as="div" direction="column" gap={1}>
          <Text
            as="span"
            id={experimentalLabelId}
            size={2}
            weight="medium"
            selectable={false}
          >
            Experimental app
          </Text>
          <Text as="p" size={1} color="lowContrast" selectable={false}>
            Surfaces the experimental scratchpad in the launcher.
          </Text>
        </Flex>
        <Switch
          testId="advanced-experimental-toggle"
          aria-labelledby={experimentalLabelId}
          checked={advanced.experimentalEnabled}
          onCheckedChange={(next) => void commitExperimental(next)}
        />
      </Flex>
    </Flex>
  );
};
