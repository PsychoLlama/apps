import { pipe } from '../combinators';
import { FLOW, type Flow } from '../flow';
import { isSourceTask, source, SOURCE } from '../source';

describe('source', () => {
  it('is a complete flow yielding its value type', () => {
    const count = source(1);

    expectTypeOf(count).toExtend<Flow<[], [number]>>();
    expectTypeOf(pipe([count, (value: number) => String(value)])).toExtend<
      Flow<[], [string]>
    >();

    // @ts-expect-error The downstream task wants a string.
    pipe([count, (value: string) => value]);
  });

  it('builds one node whose task is tagged with the initial value', () => {
    const count = source(1);
    const other = () => 1;
    const { nodes, outputs } = count[FLOW]([]);

    expect(nodes).toHaveLength(1);
    expect(outputs).toEqual(nodes);
    expect(isSourceTask(nodes[0].task)).toBe(true);
    expect(isSourceTask(other)).toBe(false);
    expect(count[SOURCE][SOURCE]).toBe(1);
  });
});
