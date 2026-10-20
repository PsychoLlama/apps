import { collect } from '../collect';
import { concurrent } from '../concurrent';
import { build, shape } from './helpers';

const one = () => 1;
const two = () => 2;

describe('collect', () => {
  it('joins the branches into one boxed node', () => {
    const graph = build(collect([one, two]));

    expect(shape(graph)).toEqual({
      nodes: ['one()', 'two()', '{one(), two()}'],
      output: '{one(), two()}',
    });
  });

  it('keys every join by the plan that built it', () => {
    const plan = collect([one, two]);

    expect(build(plan).output).toMatchObject({
      kind: 'join',
      plan,
      collect: true,
    });
  });

  it('nests without flattening', () => {
    const graph = build(concurrent([collect([one, two]), collect([one, two])]));

    expect(shape(graph).output).toBe('[{one(), two()}, {one(), two()}]');
  });
});
