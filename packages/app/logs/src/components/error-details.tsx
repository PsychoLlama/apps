import { Callout, Code, Text } from '@lib/ui';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import { errorChain, type ErrorFrame } from './error-chain';
import * as css from './log-panel.css';

/**
 * An error attribute under the entry's message: a danger callout rendering
 * the error and its `cause` chain as preformatted text, outermost first,
 * with each deeper cause prefixed "caused by" so a hydrated chain reads
 * top-down. The monospace face and danger tint come from the inner `Code`;
 * the `pre` preserves the chain's line breaks.
 */
export const ErrorDetails = (props: { error: Error }) => (
  <Callout
    size={1}
    color="danger"
    icon={<IconAlert />}
    class={css.errorCallout}
    // Inside an entry's `<summary>`, a click would toggle the entry. Keep
    // it for selecting the error text instead.
    onClick={(event) => event.preventDefault()}
  >
    <Text as="pre" size={1} selectable class={css.errorOutput}>
      <Code size={1} variant="ghost" color="danger">
        {errorChain(props.error).map(formatFrame).join('\n')}
      </Code>
    </Text>
  </Callout>
);

/** One chain frame as a line of text; deeper causes are flagged "caused by". */
const formatFrame = (frame: ErrorFrame, index: number): string => {
  const label = index > 0 ? `caused by ${frame.name}` : frame.name;
  return frame.message ? `${label}: ${frame.message}` : label;
};
