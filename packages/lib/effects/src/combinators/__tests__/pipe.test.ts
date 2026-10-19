import type { FlowNode } from '../../flow';
import { pipe } from '../pipe';
import { build, shape } from './helpers';

const one = () => 1;
const double = (value: number) => value * 2;

describe('pipe', () => {
  it('wires each step to the previous output', () => {
    const graph = build(pipe([one, double, double]));

    expect(shape(graph)).toEqual({
      nodes: ['one()', 'double(one())', 'double(double(one()))'],
      output: 'double(double(one()))',
    });
  });

  it('feeds the flow input into the first step', () => {
    const upstream: FlowNode = { kind: 'task', task: one };
    const graph = build(pipe([double]), upstream);

    expect(shape(graph)).toEqual({
      nodes: ['double(one())'],
      output: 'double(one())',
    });
    expect(graph.output).toMatchObject({ input: upstream });
  });

  it('splices sub-flows in place', () => {
    const inner = pipe([double, double]);
    const graph = build(pipe([one, inner, double]));

    expect(shape(graph).nodes).toEqual([
      'one()',
      'double(one())',
      'double(double(one()))',
      'double(double(double(one())))',
    ]);
  });
});
