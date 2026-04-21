import { defineAction } from '../action';
import { bindRegistry } from '../bindings';
import { defineEffect } from '../effect';
import { createRegistry } from '../registry';
import { defineStore } from '../store';

// Compile-time assertions. The `@ts-expect-error` directives below fail
// the build if a previously rejected expression starts type-checking.
// The runtime `it` is a placeholder; the assertions live in the types.

interface Counter {
  count: number;
}

const counterStore = defineStore<Counter>(() => ({ count: 0 }));

const noInput = defineAction([counterStore], (counter) => {
  counter.count += 1;
});

const withNumber = defineAction([counterStore], (counter, amount: number) => {
  counter.count += amount;
});

const withError = defineAction([counterStore], (counter, error: Error) => {
  counter.count += error.message.length;
});

const numberEffect = defineEffect((value: number) => value);

// Expressions below are type-checked but never executed.
const check = (): void => {
  const { useAction, useEffect } = bindRegistry(createRegistry());

  // Call-site: no-input action accepts zero args, rejects extras.
  useAction(noInput)();
  // @ts-expect-error — no-input action rejects an argument.
  useAction(noInput)(42);

  // Call-site: typed-input action requires exactly that type.
  useAction(withNumber)(5);
  // @ts-expect-error — string is not assignable to number.
  useAction(withNumber)('nope');
  // @ts-expect-error — missing required input.
  useAction(withNumber)();

  // Effects behave the same at the call site.
  useEffect(numberEffect)(1);
  // @ts-expect-error — effect requires its input.
  useEffect(numberEffect)();

  // Lifecycle slots: an action with Input = unknown reuses across any
  // effect (intended pattern, via contravariance on the phantom brand).
  defineEffect((value: number) => value, { onStart: noInput });
  defineEffect((value: string) => value, { onStart: noInput });

  // Lifecycle slots: a narrower Input can't accept a wider slot's input.
  defineEffect((value: number) => value, {
    // @ts-expect-error — onStart expects number; action accepts Error.
    onStart: withError,
  });
  defineEffect((value: number) => value, {
    // @ts-expect-error — onSuccess expects number; action accepts Error.
    onSuccess: withError,
  });
  defineEffect((value: number) => value, {
    // @ts-expect-error — onFailure expects Error; action accepts number.
    onFailure: withNumber,
  });

  // Inline defineAction: Stores and draft types still flow through.
  defineEffect((value: number) => value, {
    onStart: defineAction([counterStore], (counter) => {
      // @ts-expect-error — `missing` is not on Counter.
      counter.missing = true;
      counter.count += 1;
    }),
  });
};

describe('type safety', () => {
  it('compile-time assertions hold', () => {
    expect(typeof check).toBe('function');
  });
});
