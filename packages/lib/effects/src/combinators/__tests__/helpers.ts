import { FLOW, type Flow, type FlowNode, type Graph } from '../../flow';

/** Wire a flow against a placeholder upstream node. */
export const build = (flow: Flow<never>, input?: FlowNode): Graph =>
  flow[FLOW](input);

/** Readable shape: task names wired to their upstream, joins as tuples. */
const describeNode = (node: FlowNode): string =>
  node.kind === 'join'
    ? `[${node.branches.map(describeNode).join(', ')}]`
    : `${node.task.name}(${node.input ? describeNode(node.input) : ''})`;

export const shape = (graph: Graph) => ({
  nodes: graph.nodes.map(describeNode),
  output: describeNode(graph.output),
});
