import { FLOW, type Flow, type FlowNode, type Graph } from '../../flow';

/** Wire a flow against a placeholder upstream node. */
export const build = (flow: Flow<never>, input?: FlowNode): Graph =>
  flow[FLOW](input);

/**
 * Readable shape: task names wired to their upstream, joins as `[...]`
 * when spread and `{...}` when collected.
 */
const describeNode = (node: FlowNode): string => {
  if (node.kind === 'task') {
    return `${node.task.name}(${node.input ? describeNode(node.input) : ''})`;
  }

  const branches = node.branches.map(describeNode).join(', ');
  return node.collect ? `{${branches}}` : `[${branches}]`;
};

export const shape = (graph: Graph) => ({
  nodes: graph.nodes.map(describeNode),
  output: describeNode(graph.output),
});
