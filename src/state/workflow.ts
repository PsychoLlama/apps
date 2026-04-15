import type { ActivityDef } from './activity';
import { executeActivity } from './activity';
import { type EventBus, GLOBAL_EVENT_BUS, publish } from './event-bus';
import { REJECTED, RESOLVED, type Result } from './result';
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
  readonly settled: Topic<Result<Awaited<RawReturn>>>;
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
    settled: defineTopic(),
    [WORKFLOW_EXECUTOR]: execute,
  };
}

function createWorkflowContext(): WorkflowContext {
  return {
    run: executeActivity,
  };
}

function resolve<T>(value: T): Result<T> {
  return { type: RESOLVED, value };
}

function reject<T>(error: unknown): Result<T> {
  return {
    type: REJECTED,
    value: error instanceof Error ? error : new Error(String(error)),
  };
}

type WorkflowRunner<Input, RawReturn> = (
  ...args: void extends Input ? [] : [Input]
) => RawReturn extends Promise<unknown> ? Promise<void> : void;

/** Bind a workflow to an event bus, returning a callable function. */
export function useWorkflow<Input, RawReturn>(
  workflow: WorkflowDef<Input, RawReturn>,
  eventBus: EventBus = GLOBAL_EVENT_BUS,
): WorkflowRunner<Input, RawReturn> {
  return ((...args: unknown[]) => {
    type Settled = Result<Awaited<RawReturn>>;

    const input = args[0] as Input;
    publish(
      eventBus,
      workflow.started,
      ...(args as void extends Input ? [] : [Input]),
    );

    const settle = (result: Settled) =>
      publish(eventBus, workflow.settled, result);

    function execute(): void | Promise<void> {
      const ctx = createWorkflowContext();

      try {
        const result = workflow[WORKFLOW_EXECUTOR](ctx, input);

        if (result instanceof Promise) {
          return result.then(
            (value) => settle(resolve(value) as Settled),
            (error) => settle(reject(error)),
          );
        }

        settle(resolve(result) as Settled);
      } catch (error) {
        settle(reject(error));
      }
    }

    return execute();
  }) as unknown as WorkflowRunner<Input, RawReturn>;
}
