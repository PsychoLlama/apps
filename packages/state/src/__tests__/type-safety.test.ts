import { defineAction } from '../action';
import { createTestBindings } from '../bindings';
import { defineEffect } from '../effect';
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

const numberEffect = defineEffect([], (value: number) => value);

// Expressions below are type-checked but never executed.
const check = (): void => {
  const { useAction, useEffect } = createTestBindings();

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
  defineEffect([], (value: number) => value, { onStart: noInput });
  defineEffect([], (value: string) => value, { onStart: noInput });

  // Lifecycle slots: a narrower Input can't accept a wider slot's input.
  // @ts-expect-error — onStart expects number; action accepts Error.
  defineEffect([], (value: number) => value, { onStart: withError });
  // @ts-expect-error — onSuccess expects number; action accepts Error.
  defineEffect([], (value: number) => value, { onSuccess: withError });
  // @ts-expect-error — onFailure expects Error; action accepts number.
  defineEffect([], (value: number) => value, { onFailure: withNumber });

  // Inline defineAction: Stores and draft types still flow through.
  defineEffect([], (value: number) => value, {
    onStart: defineAction([counterStore], (counter) => {
      // @ts-expect-error — `missing` is not on Counter.
      counter.missing = true;
      counter.count += 1;
    }),
  });

  // Read deps: the callback receives readonly views per store.
  defineEffect([counterStore], (counter) => {
    // @ts-expect-error — readonly views reject mutation.
    counter.count = 1;
    return counter.count;
  });

  // No-input overload: a callback whose arity matches the store count
  // stays zero-arg at the call site.
  const zeroArgEffect = defineEffect(
    [counterStore],
    (counter) => counter.count,
  );
  useEffect(zeroArgEffect)();
  // @ts-expect-error — no-input effect rejects an argument.
  useEffect(zeroArgEffect)(42);

  // With-input overload: the trailing parameter pins Input.
  const typedInputEffect = defineEffect(
    [counterStore],
    (_counter, amount: number) => amount + 1,
  );
  useEffect(typedInputEffect)(3);
  // @ts-expect-error — typed-input effect rejects the wrong type.
  useEffect(typedInputEffect)('nope');
};

describe('type safety', () => {
  it('compile-time assertions hold', () => {
    expect(typeof check).toBe('function');
  });
});
