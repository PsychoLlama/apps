import { Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Flex } from '@lib/ui';
import { $entryToggled, $expansion, type ArchivedLog } from '../state';
import { AttributeTable } from './attribute-table';
import { hasAttributes } from './log-context';
import { LogSummary } from './log-summary';
import * as css from './log-panel.css';

/**
 * One entry in the day's list. A log with attributes is a `<details>`:
 * clicking its summary opens an attribute table beneath. The table only
 * renders while open, so a closed entry never flattens or formats its
 * context. Errors aren't attributes here; they show in the summary either
 * way.
 */
export const LogEntry = (props: { log: ArchivedLog }) => {
  const expansion = useValue($expansion);
  const entryToggled = useValue($entryToggled);
  const open = () => expansion().open[props.log.id] === true;
  const expandable = () => hasAttributes(props.log.context);

  return (
    <Flex as="li" direction="column" class={css.entry}>
      <Show
        when={expandable()}
        fallback={
          <Flex
            as="div"
            direction="row"
            align="start"
            gap={3}
            class={css.summary}
          >
            <LogSummary log={props.log} expandable={false} />
          </Flex>
        }
      >
        <Flex
          as="details"
          direction="column"
          open={open()}
          onToggle={(event) =>
            entryToggled()(props.log.id, event.currentTarget.open)
          }
        >
          <Flex
            as="summary"
            direction="row"
            align="start"
            gap={3}
            class={`${css.summary} ${css.expandable}`}
          >
            <LogSummary log={props.log} expandable />
          </Flex>

          <Show when={open()}>
            <AttributeTable context={props.log.context} />
          </Show>
        </Flex>
      </Show>
    </Flex>
  );
};
