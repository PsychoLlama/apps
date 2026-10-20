import { concurrent } from '../concurrent';
import { pipe } from '../pipe';
import { build, shape } from './helpers';

const one = () => 1;
const two = () => 2;
const add = (left: number, right: number) => left + right;
const double = (value: number) => value * 2;

describe('concurrent', () => {
  it('shares the input across branches and joins their outputs', () => {
    const graph = build(pipe([one, concurrent([double, double]), add]));

    expect(shape(graph)).toEqual({
      nodes: [
        'one()',
        'double(one())',
        'double(one())',
        '[double(one()), double(one())]',
        'add([double(one()), double(one())])',
      ],
      output: 'add([double(one()), double(one())])',
    });
  });

  it('nests joins as branches', () => {
    const graph = build(
      concurrent([concurrent([one, two]), concurrent([one, two])]),
    );

    expect(shape(graph).output).toBe('[[one(), two()], [one(), two()]]');
  });

  it('keys every join by the plan that built it', () => {
    const plan = concurrent([one, two]);
    const first = build(plan).output;
    const second = build(plan).output;

    expect(first).not.toBe(second);
    expect(first).toMatchObject({ kind: 'join', plan });
    expect(second).toMatchObject({ kind: 'join', plan });
  });

  it('builds fresh nodes for every placement of the same task', () => {
    const graph = build(concurrent([one, one]));
    assert(graph.output.kind === 'join');
    const [first, second] = graph.output.branches;

    expect(first).not.toBe(second);
    expect(first).toMatchObject({ task: one });
    expect(second).toMatchObject({ task: one });
  });
});
