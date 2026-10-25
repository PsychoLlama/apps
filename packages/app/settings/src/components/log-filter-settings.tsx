import { useAction, useClientValue } from '@lib/effects/solid';
import { Code, Flex, Heading, Link, Text, TextField } from '@lib/ui';
import { ResetButton } from './reset-button';
import {
  defaultLogFilter,
  $logFilter,
  $resetFilter,
  $updateFilter,
} from '../effects/log-filter';

const headingId = 'settings-log-filter-heading';

/**
 * The Log filter group: the console's `@holz/pattern-filter` pattern.
 * Reads/writes through `@lib/runtime-config`, persisting an OPFS override
 * on top of the per-environment default and fanning the change out to
 * every browsing context (sibling tabs and workers included). Uses an
 * `h3`, since it sits under an "Advanced" heading.
 */
export const LogFilterSettings = () => {
  const updateFilter = useAction($updateFilter);
  const resetFilter = useAction($resetFilter);
  const logFilter = useClientValue($logFilter);

  return (
    <Flex as="section" direction="column" gap={3}>
      <Flex as="header" direction="column" gap={2}>
        <Flex as="div" direction="row" justify="between" align="center" gap={3}>
          <Heading
            as="h3"
            id={headingId}
            size={4}
            weight="medium"
            selectable={false}
          >
            Log filter
          </Heading>
          <ResetButton
            testId="advanced-log-filter-reset"
            label="Reset log filter"
            ready={logFilter.ready}
            disabled={
              resetFilter.pending || logFilter()?.pattern === defaultLogFilter
            }
            onReset={resetFilter}
          />
        </Flex>
        <Text as="p" size={2} color="lowContrast" selectable={false}>
          Control what's logged to the console. Use <Code>*</Code> to show all
          logs. See{' '}
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
        aria-labelledby={headingId}
        value={logFilter()?.pattern}
        skeleton={!logFilter.ready}
        placeholder="*"
        autocomplete="off"
        autocapitalize="off"
        enterkeyhint="done"
        spellcheck={false}
        onBlur={(event) => {
          const next = event.currentTarget.value;
          if (next !== logFilter()?.pattern) updateFilter(next);
        }}
      />
    </Flex>
  );
};
