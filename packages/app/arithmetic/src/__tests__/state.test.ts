import { generateProblem, summarize, type Attempt } from '../state';

const attempt = (
  op: '+' | '-' | '*' | '/',
  correct: boolean,
  given = 0,
): Attempt => ({
  problem: { lhs: 1, rhs: 1, op, answer: 0 },
  given,
  correct,
});

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
