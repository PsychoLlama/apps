import { createTestRuntime } from '../bindings';
import { defineFold } from '../fold';
import { call, commit, defineSaga, read } from '../saga';
import { defineScope } from '../scope';
import {
  defineCell,
  defineFormula,
  defineStore,
  type DeepReadonly,
} from '../space';
import { defineTopic } from '../topic';

interface Counter {
  count: number;
}

const scope = defineScope();
const counter = defineStore<Counter>(scope, () => ({ count: 0 }));
const label = defineCell(scope, () => 'name');

describe('type safety', () => {
  it('types topic payloads at the fact constructor', () => {
    const added = defineTopic<number>();
    expectTypeOf(added).parameter(0).toEqualTypeOf<number>();

    const fired = defineTopic();
    expectTypeOf(fired).parameters.toEqualTypeOf<[]>();

    const illegal = () => {
      // @ts-expect-error — the payload is required
      added();
      // @ts-expect-error — payload type must match
      added('nope');
    };
    void illegal;
  });

  it('types fold drafts and payloads', () => {
    const added = defineTopic<number>();

    defineFold(added, [counter, label], (draft, name, amount) => {
      expectTypeOf(draft).toEqualTypeOf<Counter>();
      expectTypeOf(name).toEqualTypeOf<{ current: string }>();
      expectTypeOf(amount).toEqualTypeOf<number>();
    });
  });

  it('drops the payload parameter for payload-less topics', () => {
    const fired = defineTopic();

    defineFold(fired, [counter], (draft) => {
      expectTypeOf(draft).toEqualTypeOf<Counter>();
    });
  });

  it('returns readonly snapshots from reads', () => {
    const { peek, anchor } = createTestRuntime();
    anchor(scope);

    const view = peek(counter);
    expectTypeOf(view).toEqualTypeOf<DeepReadonly<Counter>>();
    expectTypeOf(peek(label)).toEqualTypeOf<string>();

    const illegal = () => {
      // @ts-expect-error — views are readonly; writes live in folds
      view.count = 5;
    };
    void illegal;
  });

  it('types saga inputs, reads, calls, and results', () => {
    const added = defineTopic<number>();

    const double = defineSaga(scope, async function* (amount: number) {
      const snapshot = yield* read(counter);
      expectTypeOf(snapshot).toEqualTypeOf<DeepReadonly<Counter>>();

      const handle = yield* read(label);
      expectTypeOf(handle).toEqualTypeOf<string>();

      const length = yield* call(
        async (_signal: AbortSignal, id: string) => id.length,
        'abc',
      );
      expectTypeOf(length).toEqualTypeOf<number>();

      yield commit(added(amount));
      return amount * 2;
    });

    const { useRun } = createTestRuntime();
    const runDouble = useRun(double);
    expectTypeOf(runDouble).parameters.toEqualTypeOf<[number]>();
    expectTypeOf(runDouble).returns.toEqualTypeOf<Promise<number>>();
  });

  it('types formula dependencies as snapshots', () => {
    defineFormula([counter, label], (count, name) => {
      expectTypeOf(count).toEqualTypeOf<DeepReadonly<Counter>>();
      expectTypeOf(name).toEqualTypeOf<string>();
      return `${name}:${count.count}`;
    });
  });
});
