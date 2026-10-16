import { concurrent } from '../concurrent';
import { pipe } from '../pipe';
import { build, shape } from './helpers';

const one = () => 1;
const two = () => 2;
const add = (left: number, right: number) => left + right;
const double = (value: number) => value * 2;

describe('concurrent', () => {
  it('shares inputs across branches and concatenates outputs', () => {
    const graph = build(pipe([one, concurrent([double, double]), add]));

    expect(shape(graph)).toEqual({
      nodes: [
        'one()',
        'double(one())',
        'double(one())',
        'add(double(one()), double(one()))',
      ],
      outputs: ['add(double(one()), double(one()))'],
    });
  });

  it('flattens nested fan-outs', () => {
    const graph = build(
      concurrent([concurrent([one, two]), concurrent([one, two])]),
    );

    expect(shape(graph).outputs).toEqual(['one()', 'two()', 'one()', 'two()']);
  });

  it('builds fresh nodes for every placement of the same task', () => {
    const graph = build(concurrent([one, one]));
    const [first, second] = graph.outputs;

    expect(first).not.toBe(second);
    expect(first?.task).toBe(second?.task);
  });
});
