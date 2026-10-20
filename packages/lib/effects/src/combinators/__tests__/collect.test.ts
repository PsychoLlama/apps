import { collect } from '../collect';
import { pipe } from '../pipe';
import { build, shape } from './helpers';

const one = () => 1;
const two = () => 2;
const add = (left: number, right: number) => left + right;
const double = (value: number) => value * 2;

describe('collect', () => {
  it('joins the branches into one boxed node', () => {
    const graph = build(collect([one, two]));

    expect(shape(graph)).toEqual({
      nodes: ['one()', 'two()', '{one(), two()}'],
      output: '{one(), two()}',
    });
  });

  it('joins the branches through a function', () => {
    const graph = build(collect([one, two], add));

    expect(shape(graph)).toEqual({
      nodes: ['one()', 'two()', 'add(one(), two())'],
      output: 'add(one(), two())',
    });
  });

  it('shares the input across branches', () => {
    const graph = build(pipe([one, collect([double, double], add)]));

    expect(shape(graph).output).toBe('add(double(one()), double(one()))');
  });

  it('nests joins as branches', () => {
    const graph = build(collect([collect([one, two]), collect([one, two])]));

    expect(shape(graph).output).toBe('{{one(), two()}, {one(), two()}}');
  });

  it('keys every join by the plan that built it', () => {
    const plan = collect([one, two], add);
    const first = build(plan).output;
    const second = build(plan).output;

    expect(first).not.toBe(second);
    expect(first).toMatchObject({ kind: 'join', plan, fn: add });
    expect(second).toMatchObject({ kind: 'join', plan, fn: add });
  });

  it('builds fresh nodes for every placement of the same task', () => {
    const graph = build(collect([one, one]));
    assert(graph.output.kind === 'join');
    const [first, second] = graph.output.branches;

    expect(first).not.toBe(second);
    expect(first).toMatchObject({ task: one });
    expect(second).toMatchObject({ task: one });
  });
});
