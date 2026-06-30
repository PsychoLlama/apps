import { onCleanup, onMount } from 'solid-js';
import { useAction, useEffect } from '@lib/state';
import {
  Button,
  Code,
  Flex,
  Heading,
  Link,
  Switch,
  Text,
  TextField,
} from '@lib/ui';
import IconChevron from 'virtual:icons/mdi/chevron-right';
import { setExperimentalEnabled, setLogFilter } from './state/advanced/actions';
import {
  commitExperimentalEffect,
  commitLogFilterEffect,
  hydrateAdvancedSettingsEffect,
} from './state/advanced/bindings';
import {
  watchExperimentalEnabled,
  watchLogFilter,
} from './state/advanced/capabilities';
import { advancedSettings } from './state/advanced/store';
import * as css from './advanced-settings.css';

const advancedHeadingId = 'settings-advanced-heading';
const logFilterHeadingId = 'settings-log-filter-heading';

/**
 * Advanced settings — runtime-config controls for debugging and preview
 * features, tucked behind a disclosure that's collapsed by default. Each
 * control reads/writes through `@lib/runtime-config`, persisting an OPFS
 * override on top of the per-environment default and fanning the change
 * out to every browsing context (sibling tabs and workers included).
 */
export const AdvancedSettings = () => {
  const advanced = advancedSettings;
  const reconcile = useEffect(hydrateAdvancedSettingsEffect);
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
    void reconcile();
    onCleanup(watchLogFilter(mirrorFilter));
    onCleanup(watchExperimentalEnabled(mirrorExperimental));
  });

  return (
    <Flex as="details" direction="column" gap={5}>
      <Button
        as="summary"
        variant="ghost"
        color="neutral"
        class={css.summary}
        testId="advanced-disclosure"
      >
        <Heading
          as="h2"
          id={advancedHeadingId}
          size={4}
          weight="medium"
          selectable={false}
        >
          Advanced
        </Heading>
        <IconChevron
          width="20"
          height="20"
          aria-hidden="true"
          class={css.chevron}
        />
      </Button>

      <Flex as="div" direction="column" gap={6}>
        <Flex as="section" direction="column" gap={3}>
          <Flex as="header" direction="column" gap={2}>
            <Heading
              as="h3"
              id={logFilterHeadingId}
              size={4}
              weight="medium"
              selectable={false}
            >
              Log filter
            </Heading>
            <Text as="p" size={2} color="lowContrast" selectable={false}>
              Control what's logged to the console. Use <Code>*</Code> to show
              all logs. See{' '}
              <Link
                testId="holz-readme"
                href="https://github.com/PsychoLlama/holz/blob/main/packages/holz-pattern-filter/README.md"
                target="_blank"
              >
                @holz/pattern-filter
              </Link>{' '}
              for the syntax guide.
            </Text>
          </Flex>
          <TextField
            testId="advanced-log-filter"
            aria-labelledby={logFilterHeadingId}
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

        <Flex as="section" direction="column" gap={2}>
          <Heading as="h3" size={4} weight="medium" selectable={false}>
            Experimental app
          </Heading>
          <Text as="label" size={2} color="lowContrast" selectable={false}>
            <Flex
              as="div"
              direction="row"
              justify="between"
              align="center"
              gap={3}
            >
              Surface the experimental scratchpad in the launcher.
              <Switch
                testId="advanced-experimental-toggle"
                checked={advanced.experimentalEnabled}
                onCheckedChange={(next) => void commitExperimental(next)}
              />
            </Flex>
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
