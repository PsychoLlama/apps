import type { TabsListContextValue, TabsTriggerRecord } from './context';

type Triggers = Map<string, TabsTriggerRecord>;

const isEnabled = (triggers: Triggers, value: string): boolean =>
  triggers.get(value)?.disabled() === false;

/**
 * Trigger values in DOM order. Map insertion order matches mount order,
 * which matches DOM order for static JSX — but conditional triggers can
 * mount out of order, so re-sort by DOM position.
 */
const orderedValues = (triggers: Triggers): string[] =>
  [...triggers.entries()]
    .sort(([, left], [, right]) =>
      left.el.compareDocumentPosition(right.el) &
      Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    )
    .map(([value]) => value);

export const firstEnabledTrigger = (triggers: Triggers): string | undefined =>
  orderedValues(triggers).find((value) => isEnabled(triggers, value));

export const lastEnabledTrigger = (triggers: Triggers): string | undefined =>
  orderedValues(triggers).findLast((value) => isEnabled(triggers, value));

/**
 * Step from `from` to the next or previous enabled trigger value. Skips
 * disabled triggers. Wraps around when `loop` is set; otherwise returns
 * `undefined` past either end.
 */
export const neighbor = (
  listCtx: TabsListContextValue,
  from: string,
  step: 1 | -1,
): string | undefined => {
  const order = orderedValues(listCtx.triggers);
  const start = order.indexOf(from);
  if (start === -1) return undefined;
  const enabled = (value: string) => isEnabled(listCtx.triggers, value);

  const forward =
    step === 1 ? order.slice(start + 1) : order.slice(0, start).reverse();
  const next = forward.find(enabled);
  if (next || !listCtx.loop()) return next;

  const wrap =
    step === 1 ? order.slice(0, start) : order.slice(start + 1).reverse();
  return wrap.find(enabled);
};
