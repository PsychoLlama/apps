import { collect, concurrent, pipe } from '../combinators';
import { FLOW, type Flow, type FlowNode, type Graph } from '../flow';
import type { Task } from '../task';

const one = () => 1;
const two = () => 2;
const add = (left: number, right: number) => left + right;
const double = (value: number) => value * 2;

/** Wire a flow against placeholder upstream nodes. */
const build = (flow: Flow<never>, inputs: readonly FlowNode[] = []): Graph =>
  flow[FLOW](inputs);

/** Readable shape: task names wired to the names of their inputs. */
const describeNode = (node: FlowNode): string =>
  `${node.task.name}(${node.inputs.map(describeNode).join(', ')})`;

const shape = (graph: Graph) => ({
  nodes: graph.nodes.map(describeNode),
  outputs: graph.outputs.map(describeNode),
});

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

describe('collect', () => {
  it('joins branch outputs through one gather node', () => {
    const graph = build(collect([one, two]));

    expect(shape(graph)).toEqual({
      nodes: ['one()', 'two()', 'gather(one(), two())'],
      outputs: ['gather(one(), two())'],
    });
  });

  it('shares the gather task across every collect', () => {
    const first = build(collect([one])).outputs[0];
    const second = build(collect([two])).outputs[0];

    expect(first?.task).toBe(second?.task);
    expect((first?.task as Task<unknown[]>)(1, 2)).toEqual([1, 2]);
  });

  it('nests without flattening', () => {
    const graph = build(concurrent([collect([one, two]), collect([one, two])]));

    expect(shape(graph).outputs).toEqual([
      'gather(one(), two())',
      'gather(one(), two())',
    ]);
  });
});
