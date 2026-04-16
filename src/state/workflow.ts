import type { ActivityDef } from './activity';
import { executeActivity } from './activity';
import { type EventBus, GLOBAL_EVENT_BUS, publish } from './event-bus';
import { defineTopic, type Topic } from './topic';

const WORKFLOW_EXECUTOR: unique symbol = Symbol();

/** Context passed to workflow functions. */
export interface WorkflowContext {
  /** Run an activity. Returns whatever the activity returns. */
  run<Args extends unknown[], Return>(
    activity: ActivityDef<Args, Return>,
    ...args: Args
  ): Return;
}

/** Opaque handle to a workflow definition with lifecycle topics. */
export interface WorkflowDef<Input, RawReturn> {
  readonly started: Topic<Input>;
  readonly resolved: Topic<Awaited<RawReturn>>;
  readonly rejected: Topic<Error>;
  readonly [WORKFLOW_EXECUTOR]: (
    ctx: WorkflowContext,
    input: Input,
  ) => RawReturn;
}

/** Define a workflow with typed input. */
export function defineWorkflow<Input, RawReturn>(
  execute: (ctx: WorkflowContext, input: Input) => RawReturn,
): WorkflowDef<Input, RawReturn>;

/** Define a workflow with no input. */
export function defineWorkflow<RawReturn>(
  execute: (ctx: WorkflowContext) => RawReturn,
): WorkflowDef<void, RawReturn>;

export function defineWorkflow<Input, RawReturn>(
  execute: (ctx: WorkflowContext, input: Input) => RawReturn,
): WorkflowDef<Input, RawReturn> {
  return {
    started: defineTopic(),
    resolved: defineTopic(),
    rejected: defineTopic(),
    [WORKFLOW_EXECUTOR]: execute,
  };
}

const ctx: WorkflowContext = { run: executeActivity };

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function reject(eventBus: EventBus, topic: Topic<Error>, error: unknown): void {
  const err = toError(error);
  if (!publish(eventBus, topic, err)) throw err;
}

type WorkflowRunner<Input, RawReturn> = (
  ...args: void extends Input ? [] : [Input]
) => RawReturn extends Promise<unknown> ? Promise<void> : void;

/** Bind a workflow to an event bus, returning a callable function. */
export function useWorkflow<Input, RawReturn>(
  workflow: WorkflowDef<Input, RawReturn>,
  eventBus: EventBus = GLOBAL_EVENT_BUS,
): WorkflowRunner<Input, RawReturn> {
  return ((input: Input) => {
    publish(eventBus, workflow.started, input);

    try {
      const result = workflow[WORKFLOW_EXECUTOR](ctx, input);

      if (result instanceof Promise) {
        return result.then(
          (value: Awaited<RawReturn>) =>
            publish(eventBus, workflow.resolved, value),
          (error: unknown) => reject(eventBus, workflow.rejected, error),
        );
      }

      publish(eventBus, workflow.resolved, result as Awaited<RawReturn>);
    } catch (error) {
      reject(eventBus, workflow.rejected, error);
    }
  }) as unknown as WorkflowRunner<Input, RawReturn>;
}
