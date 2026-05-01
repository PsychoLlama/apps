import { For, Match, Show, Switch, createEffect, createMemo } from 'solid-js';
import type { JSX } from 'solid-js';
import { SiteHeader } from '@lib/shell';
import { Button, Card, Flex, Heading, Separator, Text } from '@lib/ui';
import IconCheck from 'virtual:icons/mdi/check-circle-outline';
import IconClose from 'virtual:icons/mdi/close-circle-outline';
import IconStop from 'virtual:icons/mdi/stop-circle-outline';
import {
  arithmetic,
  summarize,
  useArithmeticActions,
  type Difficulty,
  type Operation,
  type Problem,
} from './state';
import * as css from './index.css';

const DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: Difficulty;
  label: string;
  range: string;
}> = [
  { value: 'easy', label: 'Easy', range: '0–10' },
  { value: 'medium', label: 'Medium', range: '0–25' },
  { value: 'hard', label: 'Hard', range: '0–100' },
];

const OPERATION_LABEL: Record<Operation, string> = {
  '+': 'Addition',
  '-': 'Subtraction',
  '*': 'Multiplication',
  '/': 'Division',
};

/** Render a problem as `lhs op rhs` using printable operator glyphs. */
const formatProblem = (problem: Problem): string => {
  const symbol =
    problem.op === '*' ? '×' : problem.op === '/' ? '÷' : problem.op;
  return `${problem.lhs} ${symbol} ${problem.rhs}`;
};

const Setup = () => {
  const actions = useArithmeticActions();

  return (
    <Card as="section" size={3} variant="surface" class={css.card}>
      <Flex as="div" direction="column" gap={5}>
        <Flex as="div" direction="column" gap={2}>
          <Heading as="h1" size={6} weight="bold" trim="start">
            Arithmetic worksheet
          </Heading>
          <Text as="p" size={3} color="lowContrast" selectable={false}>
            Drill the four operations. Pick a difficulty, hit Start, and answer
            until you've had enough.
          </Text>
        </Flex>

        <Flex
          as="div"
          direction="column"
          gap={2}
          role="radiogroup"
          aria-label="Difficulty"
        >
          <For each={DIFFICULTY_OPTIONS}>
            {(option) => (
              <Button
                testId={`arithmetic-difficulty-${option.value}`}
                variant={
                  arithmetic.difficulty === option.value ? 'soft' : 'surface'
                }
                color="accent"
                size={2}
                role="radio"
                aria-checked={arithmetic.difficulty === option.value}
                class={css.difficultyOption}
                onClick={() => actions.setDifficulty(option.value)}
              >
                {option.label} ({option.range})
              </Button>
            )}
          </For>
        </Flex>

        <Button
          testId="arithmetic-start"
          size={3}
          variant="solid"
          color="accent"
          onClick={() => actions.start()}
        >
          Start drill
        </Button>
      </Flex>
    </Card>
  );
};

const Drill = () => {
  const actions = useArithmeticActions();
  let inputEl: HTMLInputElement | undefined;
  let continueEl: HTMLButtonElement | undefined;

  const correctCount = createMemo(
    () => arithmetic.attempts.filter((attempt) => attempt.correct).length,
  );
  const wrongCount = createMemo(
    () => arithmetic.attempts.length - correctCount(),
  );

  // Keep focus on whichever element accepts the next interaction.
  // Correct/idle → input; wrong-pending → continue button.
  createEffect(() => {
    if (arithmetic.feedback === 'wrong-pending') {
      continueEl?.focus();
    } else {
      inputEl?.focus();
    }
  });

  const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (
    event,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      actions.submit();
    }
  };

  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={6}
      class={css.tallyRow}
    >
      <Flex
        as="div"
        align="center"
        justify="between"
        gap={3}
        class={css.tallyRow}
      >
        <Flex as="div" align="center" gap={2}>
          <Text
            as="span"
            size={2}
            class={`${css.tallyPill} ${css.tallyPillCorrect}`}
            aria-label="Correct answers"
            selectable={false}
          >
            <IconCheck width="16" height="16" aria-hidden="true" />
            {correctCount()}
          </Text>
          <Text
            as="span"
            size={2}
            class={`${css.tallyPill} ${css.tallyPillWrong}`}
            aria-label="Wrong answers"
            selectable={false}
          >
            <IconClose width="16" height="16" aria-hidden="true" />
            {wrongCount()}
          </Text>
        </Flex>
        <Button
          testId="arithmetic-end"
          variant="soft"
          color="neutral"
          size={2}
          onClick={() => actions.end()}
        >
          <IconStop aria-hidden="true" /> End
        </Button>
      </Flex>

      <Card as="section" size={3} variant="surface" class={css.card}>
        <Flex as="div" direction="column" gap={5} align="stretch">
          <Show when={arithmetic.problem} keyed>
            {(problem) => (
              <Text
                as="p"
                class={css.problem}
                aria-live="polite"
                aria-label={`Problem: ${formatProblem(problem)} equals what?`}
                selectable={false}
              >
                {formatProblem(problem)} = ?
              </Text>
            )}
          </Show>

          <Flex as="div" direction="column" gap={3}>
            <input
              ref={inputEl}
              class={css.answerInput}
              type="text"
              inputMode="numeric"
              autocomplete="off"
              autocorrect="off"
              spellcheck={false}
              aria-label="Your answer"
              value={arithmetic.input}
              disabled={arithmetic.feedback === 'wrong-pending'}
              onInput={(event) => actions.setInput(event.currentTarget.value)}
              onKeyDown={handleKeyDown}
            />
            <Show when={arithmetic.feedback === 'idle'}>
              <Button
                testId="arithmetic-submit"
                size={3}
                variant="solid"
                color="accent"
                disabled={arithmetic.input.trim() === ''}
                onClick={() => actions.submit()}
              >
                Submit
              </Button>
            </Show>
          </Flex>

          <Show
            when={arithmetic.feedback === 'wrong-pending' && arithmetic.problem}
          >
            <Flex
              as="div"
              direction="column"
              gap={3}
              class={css.wrongPanel}
              role="status"
            >
              <Flex as="div" direction="column" gap={1}>
                <Text as="p" size={2} weight="medium" selectable={false}>
                  Not quite.
                </Text>
                <Text as="p" size={3} selectable={false}>
                  {formatProblem(arithmetic.problem!)} ={' '}
                  <Text as="strong" weight="bold" selectable={false}>
                    {arithmetic.problem!.answer}
                  </Text>
                </Text>
                <Show when={arithmetic.lastGiven !== null}>
                  <Text as="p" size={2} color="lowContrast" selectable={false}>
                    You answered {arithmetic.lastGiven}.
                  </Text>
                </Show>
              </Flex>
              <Button
                ref={continueEl}
                testId="arithmetic-continue"
                variant="solid"
                color="danger"
                size={2}
                onClick={() => actions.ackWrong()}
              >
                Continue
              </Button>
            </Flex>
          </Show>
        </Flex>
      </Card>
    </Flex>
  );
};

const Stats = () => {
  const actions = useArithmeticActions();
  const summary = createMemo(() => summarize(arithmetic.attempts));

  return (
    <Card as="section" size={3} variant="surface" class={css.card}>
      <Flex as="div" direction="column" gap={5}>
        <Flex as="div" direction="column" gap={1} align="center">
          <Text
            as="p"
            size={2}
            color="lowContrast"
            weight="medium"
            selectable={false}
          >
            Session accuracy
          </Text>
          <Text as="p" class={css.accuracyNumber} selectable={false}>
            {summary().accuracy}%
          </Text>
          <Text as="p" size={2} color="lowContrast" selectable={false}>
            {summary().correct} correct of {summary().total}
          </Text>
        </Flex>

        <Separator orientation="horizontal" decorative />

        <Show
          when={summary().total > 0}
          fallback={
            <Text
              as="p"
              size={2}
              color="lowContrast"
              align="center"
              selectable={false}
            >
              No problems answered.
            </Text>
          }
        >
          <Flex as="div" direction="column">
            <For
              each={
                Object.entries(summary().byOperation) as ReadonlyArray<
                  [Operation, { total: number; correct: number }]
                >
              }
            >
              {([op, bucket]) => (
                <Show when={bucket.total > 0}>
                  <Flex
                    as="div"
                    align="center"
                    justify="between"
                    gap={3}
                    class={css.statRow}
                  >
                    <Text as="p" size={3} weight="medium" selectable={false}>
                      {OPERATION_LABEL[op]}
                    </Text>
                    <Text
                      as="p"
                      size={3}
                      color="lowContrast"
                      class={css.statValue}
                      selectable={false}
                    >
                      {bucket.correct}/{bucket.total}
                    </Text>
                  </Flex>
                </Show>
              )}
            </For>
          </Flex>
        </Show>

        <Flex as="div" direction="column" gap={2}>
          <Button
            testId="arithmetic-replay"
            size={3}
            variant="solid"
            color="accent"
            onClick={() => {
              actions.reset();
              actions.start();
            }}
          >
            Play again
          </Button>
          <Button
            testId="arithmetic-change-difficulty"
            size={3}
            variant="soft"
            color="neutral"
            onClick={() => actions.reset()}
          >
            Change difficulty
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export const Arithmetic = () => (
  <Flex as="main" direction="column" grow>
    <SiteHeader
      trail={[{ label: 'Apps', href: '/' }, { label: 'Arithmetic' }]}
    />

    <Flex
      as="section"
      direction="column"
      align="center"
      grow
      gap={5}
      class={css.stage}
    >
      <Switch>
        <Match when={arithmetic.phase === 'setup'}>
          <Setup />
        </Match>
        <Match when={arithmetic.phase === 'drill'}>
          <Drill />
        </Match>
        <Match when={arithmetic.phase === 'stats'}>
          <Stats />
        </Match>
      </Switch>
    </Flex>
  </Flex>
);
