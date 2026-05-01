import { createTestBindings } from '@lib/state';
import {
  ackWrongAction,
  arithmeticStore,
  endSessionAction,
  generateProblem,
  setInputAction,
  startSessionAction,
  submitAnswerAction,
  summarize,
  type Attempt,
  type Difficulty,
} from '../state';

const DIFFICULTY_MAX: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 100,
};

const attempt = (
  op: '+' | '-' | '*' | '/',
  correct: boolean,
  given = 0,
): Attempt => ({
  problem: { lhs: 1, rhs: 1, op, answer: 0 },
  given,
  correct,
});

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, state: bindings.createStore(arithmeticStore) };
};

describe('generateProblem', () => {
  it.each(['easy', 'medium', 'hard'] as const)(
    'computes a consistent answer for %s difficulty',
    (difficulty) => {
      for (let iter = 0; iter < 200; iter++) {
        const problem = generateProblem(difficulty);
        const expected =
          problem.op === '+'
            ? problem.lhs + problem.rhs
            : problem.op === '-'
              ? problem.lhs - problem.rhs
              : problem.op === '*'
                ? problem.lhs * problem.rhs
                : problem.lhs / problem.rhs;

        expect(problem.answer).toBe(expected);
      }
    },
  );

  it('never produces a negative subtraction result', () => {
    for (let iter = 0; iter < 500; iter++) {
      const problem = generateProblem('hard');
      if (problem.op === '-') {
        expect(problem.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('never divides by zero and always yields a whole-number quotient', () => {
    for (let iter = 0; iter < 500; iter++) {
      const problem = generateProblem('hard');
      if (problem.op === '/') {
        expect(problem.rhs).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(problem.answer)).toBe(true);
      }
    }
  });

  it.each(['easy', 'medium', 'hard'] as const)(
    'keeps division operands inside the %s difficulty bound',
    (difficulty) => {
      const max = DIFFICULTY_MAX[difficulty];
      for (let iter = 0; iter < 1000; iter++) {
        const problem = generateProblem(difficulty);
        if (problem.op === '/') {
          expect(problem.lhs).toBeLessThanOrEqual(max);
          expect(problem.rhs).toBeLessThanOrEqual(max);
          expect(problem.answer).toBeLessThanOrEqual(max);
        }
      }
    },
  );
});

describe('endSessionAction', () => {
  it('records a pending wrong answer when ending mid-feedback', () => {
    const { state, useAction } = setup();
    useAction(startSessionAction)();
    const wrongAnswer = String((state.problem?.answer ?? 0) + 1);
    useAction(setInputAction)(wrongAnswer);
    useAction(submitAnswerAction)();
    expect(state.feedback).toBe('wrong-pending');

    useAction(endSessionAction)();

    expect(state.phase).toBe('stats');
    expect(state.attempts).toHaveLength(1);
    expect(state.attempts[0].correct).toBe(false);
  });

  it('does not double-count when ending after Continue', () => {
    const { state, useAction } = setup();
    useAction(startSessionAction)();
    const wrongAnswer = String((state.problem?.answer ?? 0) + 1);
    useAction(setInputAction)(wrongAnswer);
    useAction(submitAnswerAction)();
    useAction(ackWrongAction)();
    expect(state.attempts).toHaveLength(1);

    useAction(endSessionAction)();

    expect(state.attempts).toHaveLength(1);
  });
});

describe('summarize', () => {
  it('returns zeroed totals when no attempts have been logged', () => {
    const summary = summarize([]);

    expect(summary.total).toBe(0);
    expect(summary.correct).toBe(0);
    expect(summary.wrong).toBe(0);
    expect(summary.accuracy).toBe(0);
  });

  it('counts correct vs wrong and rounds the accuracy percent', () => {
    const summary = summarize([
      attempt('+', true),
      attempt('+', false),
      attempt('+', true),
    ]);

    expect(summary.total).toBe(3);
    expect(summary.correct).toBe(2);
    expect(summary.wrong).toBe(1);
    expect(summary.accuracy).toBe(67);
  });

  it('groups attempts by operation', () => {
    const summary = summarize([
      attempt('+', true),
      attempt('-', false),
      attempt('*', true),
      attempt('*', true),
    ]);

    expect(summary.byOperation['+']).toEqual({ total: 1, correct: 1 });
    expect(summary.byOperation['-']).toEqual({ total: 1, correct: 0 });
    expect(summary.byOperation['*']).toEqual({ total: 2, correct: 2 });
    expect(summary.byOperation['/']).toEqual({ total: 0, correct: 0 });
  });
});
