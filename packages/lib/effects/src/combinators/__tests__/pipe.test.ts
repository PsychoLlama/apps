import type { FlowNode } from '../../flow';
import { pipe } from '../pipe';
import { build, shape } from './helpers';

const one = () => 1;
const double = (value: number) => value * 2;

describe('pipe', () => {
  it('wires each step to the previous outputs', () => {
    const graph = build(pipe([one, double, double]));

    expect(shape(graph)).toEqual({
      nodes: ['one()', 'double(one())', 'double(double(one()))'],
      outputs: ['double(double(one()))'],
    });
  });

  it('feeds flow inputs into the first step', () => {
    const upstream: FlowNode = { task: one, inputs: [] };
    const graph = build(pipe([double]), [upstream]);

    expect(shape(graph)).toEqual({
      nodes: ['double(one())'],
      outputs: ['double(one())'],
    });
    expect(graph.nodes[0]?.inputs[0]).toBe(upstream);
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
