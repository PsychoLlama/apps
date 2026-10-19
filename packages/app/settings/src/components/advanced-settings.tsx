import { Suspense, useFlow } from '@lib/effects/solid';
import { useAnchor, useRun } from '@lib/state';
import { Button, Code, Flex, Heading, Link, Text, TextField } from '@lib/ui';
import IconChevron from 'virtual:icons/mdi/chevron-right';
import { LogStorage } from './log-storage';
import { ResetButton } from './reset-button';
import {
  advancedSettingsScope,
  commitLogFilterSaga,
  resetLogFilterSaga,
} from '../state/advanced';
import { defaultLogFilter, observeLogFilter } from '../effects/log-filter';
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
  useAnchor(advancedSettingsScope);
  const commitFilter = useRun(commitLogFilterSaga);
  const resetFilter = useRun(resetLogFilterSaga);

  const logFilter = useFlow(observeLogFilter);

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

      {/* `details` lays out its content as one slotted box, so its own
          gap never reaches the sections. This column spaces them. */}
      <Flex as="div" direction="column" gap={5}>
        <Flex as="section" direction="column" gap={3}>
          <Flex as="header" direction="column" gap={2}>
            <Flex
              as="div"
              direction="row"
              justify="between"
              align="center"
              gap={3}
            >
              <Heading
                as="h3"
                id={logFilterHeadingId}
                size={4}
                weight="medium"
                selectable={false}
              >
                Log filter
              </Heading>
              <Suspense>
                <ResetButton
                  testId="advanced-log-filter-reset"
                  label="Reset log filter"
                  disabled={logFilter() === defaultLogFilter}
                  onReset={() => void resetFilter()}
                />
              </Suspense>
            </Flex>
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
          <Suspense
            fallback={
              <TextField
                testId="advanced-log-filter"
                aria-labelledby={logFilterHeadingId}
                skeleton
                placeholder="*"
                autocomplete="off"
                autocapitalize="off"
                enterkeyhint="done"
              />
            }
          >
            <TextField
              testId="advanced-log-filter"
              aria-labelledby={logFilterHeadingId}
              value={logFilter()}
              placeholder="*"
              autocomplete="off"
              autocapitalize="off"
              enterkeyhint="done"
              spellcheck={false}
              onBlur={(event) => {
                const next = event.currentTarget.value;
                if (next !== logFilter()) void commitFilter(next);
              }}
            />
          </Suspense>
        </Flex>

        <LogStorage />
      </Flex>
    </Flex>
  );
};
