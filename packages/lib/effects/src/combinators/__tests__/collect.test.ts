import type { Task } from '../../task';
import { collect } from '../collect';
import { concurrent } from '../concurrent';
import { build, shape } from './helpers';

const one = () => 1;
const two = () => 2;

describe('collect', () => {
  it('gathers the joined outputs through one node', () => {
    const graph = build(collect([one, two]));

    expect(shape(graph)).toEqual({
      nodes: ['one()', 'two()', '[one(), two()]', 'gather([one(), two()])'],
      output: 'gather([one(), two()])',
    });
  });

  it('shares the gather task across every collect', () => {
    const first = build(collect([one])).output;
    const second = build(collect([two])).output;
    assert(first.kind === 'task' && second.kind === 'task');

    expect(first.task).toBe(second.task);
    expect((first.task as Task<unknown[]>)(1, 2)).toEqual([1, 2]);
  });

  it('nests without flattening', () => {
    const graph = build(concurrent([collect([one, two]), collect([one, two])]));

    expect(shape(graph).output).toBe(
      '[gather([one(), two()]), gather([one(), two()])]',
    );
  });
});
