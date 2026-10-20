import { PLAN, type Plan, type PlanNode, type Graph } from '../../plan';

/** Wire a plan against a placeholder upstream node. */
export const build = (plan: Plan<never>, input?: PlanNode): Graph =>
  plan[PLAN](input);

/**
 * Readable shape: task names wired to their upstream, and joins' `fn`
 * applied to their branches.
 */
const describeNode = (node: PlanNode): string => {
  if (node.kind === 'task') {
    return `${node.task.name}(${node.input ? describeNode(node.input) : ''})`;
  }

  const branches = node.branches.map(describeNode).join(', ');
  return `${node.fn.name}(${branches})`;
};

export const shape = (graph: Graph) => ({
  nodes: graph.nodes.map(describeNode),
  output: describeNode(graph.output),
});
