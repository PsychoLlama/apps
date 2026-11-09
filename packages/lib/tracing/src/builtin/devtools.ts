import type { ActionHandler, SpanProcessor } from '../processor/processor';
import type { Span } from '../processor/span-data';

const toProperties = (attrs: Span['attrs']): [string, string][] =>
  Object.entries(attrs)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]);

/**
 * Report finished spans to the browser's performance timeline. In Chrome
 * DevTools, they appear in the Performance panel under a "Traces" track, with
 * attributes shown in the details pane.
 */
export const createDevtoolsBackend = (): SpanProcessor => {
  const { timeOrigin } = performance;

  const onAction: ActionHandler = (action) => {
    if (action.type !== 'exit') return;

    const { name, time, attrs, status } = action.span;

    performance.measure(name, {
      start: time.started - timeOrigin,
      end: time.ended - timeOrigin,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Traces',
          properties: toProperties(attrs),
          ...(status.code === 'error' && {
            color: 'error',
            tooltipText: status.error.message,
          }),
        },
      },
    });
  };

  return () => onAction;
};
