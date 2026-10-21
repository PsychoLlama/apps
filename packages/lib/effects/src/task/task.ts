/**
 * A task is a plain function. Its one parameter is what the upstream node
 * yields, and a root task takes none; its return value (possibly a
 * promise, possibly a resource or reactive) is the node's output.
 *
 * The default `Input = never` makes bare `Task` the top of all tasks:
 * every concrete task is assignable to it, and nothing can call it without
 * first knowing its real input.
 */
export type Task<Input = never, Output = unknown> = (input: Input) => Output;
