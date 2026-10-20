import { PLAN, type Plan, type PlanNode, type Graph } from '../../plan';

/** Wire a plan against a placeholder upstream node. */
export const build = (plan: Plan<never>, input?: PlanNode): Graph =>
  plan[PLAN](input);

/**
 * Readable shape: task names wired to their upstream, joins as `[...]`
 * when spread and `{...}` when collected.
 */
const describeNode = (node: PlanNode): string => {
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
