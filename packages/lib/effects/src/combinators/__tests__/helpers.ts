import { FLOW, type Flow, type FlowNode, type Graph } from '../../flow';

/** Wire a flow against placeholder upstream nodes. */
export const build = (
  flow: Flow<never>,
  inputs: readonly FlowNode[] = [],
): Graph => flow[FLOW](inputs);

/** Readable shape: task names wired to the names of their inputs. */
const describeNode = (node: FlowNode): string =>
  `${node.task.name}(${node.inputs.map(describeNode).join(', ')})`;

export const shape = (graph: Graph) => ({
  nodes: graph.nodes.map(describeNode),
  outputs: graph.outputs.map(describeNode),
});
