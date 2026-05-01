import { createStore, defineAction, defineStore, useAction } from '@lib/state';

/** One of the four arithmetic operations the worksheet drills. */
export type Operation = '+' | '-' | '*' | '/';

/** Difficulty bracket — controls operand range. */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** High-level UI phase. The store is a small state machine across three screens. */
export type Phase = 'setup' | 'drill' | 'stats';

/**
 * Feedback shown after a submission. `wrong-pending` blocks advance
 * until the user acknowledges — the requirement is to surface the
 * correct answer rather than silently move on.
 */
export type Feedback = 'idle' | 'correct' | 'wrong-pending';

/** A generated arithmetic problem with its expected answer pre-computed. */
export interface Problem {
  lhs: number;
  rhs: number;
  op: Operation;
  answer: number;
}

/** Record of a single submitted answer, kept for the stats screen. */
export interface Attempt {
  problem: Problem;
  given: number;
  correct: boolean;
}

export interface ArithmeticState {
  phase: Phase;
  difficulty: Difficulty;
  problem: Problem | null;
  input: string;
  feedback: Feedback;
  /** Parsed value the user typed when they got it wrong; null otherwise. */
  lastGiven: number | null;
  attempts: Attempt[];
}

const DIFFICULTY_RANGE: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 0, max: 10 },
  medium: { min: 0, max: 25 },
  hard: { min: 0, max: 100 },
};

const OPS: ReadonlyArray<Operation> = ['+', '-', '*', '/'];

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: ReadonlyArray<T>): T =>
  arr[Math.floor(Math.random() * arr.length)];

/**
 * Generate a fresh problem for the given difficulty. Operands stay in
 * range; subtraction never goes negative and division always divides
 * cleanly into a whole-number quotient.
 */
export const generateProblem = (difficulty: Difficulty): Problem => {
  const op = pick(OPS);
  const { min, max } = DIFFICULTY_RANGE[difficulty];

  switch (op) {
    case '+': {
      const lhs = randInt(min, max);
      const rhs = randInt(min, max);
      return { lhs, rhs, op, answer: lhs + rhs };
    }
    case '-': {
      const lhs = randInt(min, max);
      const rhs = randInt(min, lhs);
      return { lhs, rhs, op, answer: lhs - rhs };
    }
    case '*': {
      const lhs = randInt(min, max);
      const rhs = randInt(min, max);
      return { lhs, rhs, op, answer: lhs * rhs };
    }
    case '/': {
      // Cap the divisor so the dividend (rhs * quotient) stays in the
      // advertised operand range. Without this, hard could mint a
      // 100×100=10000 dividend.
      const divisorCap = Math.max(1, Math.floor(Math.sqrt(max)));
      const rhs = randInt(1, divisorCap);
      const quotient = randInt(min, Math.floor(max / rhs));
      return { lhs: rhs * quotient, rhs, op, answer: quotient };
    }
  }
};

const initialState = (): ArithmeticState => ({
  phase: 'setup',
  difficulty: 'medium',
  problem: null,
  input: '',
  feedback: 'idle',
  lastGiven: null,
  attempts: [],
});

/** Store handle. Exported for test bindings; production code should
 * read state through {@link arithmetic}. */
export const arithmeticStore = defineStore<ArithmeticState>(initialState);

/** Live, readonly view of the worksheet session. */
export const arithmetic = createStore(arithmeticStore);

export const setDifficultyAction = defineAction(
  [arithmeticStore],
  (state, difficulty: Difficulty) => {
    state.difficulty = difficulty;
  },
);

export const startSessionAction = defineAction([arithmeticStore], (state) => {
  state.phase = 'drill';
  state.attempts = [];
  state.input = '';
  state.feedback = 'idle';
  state.lastGiven = null;
  state.problem = generateProblem(state.difficulty);
});

export const setInputAction = defineAction(
  [arithmeticStore],
  (state, value: string) => {
    state.input = value;
  },
);

const parseInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '+') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Grade the typed answer. Correct answers tally and advance
 * immediately; wrong answers stage feedback so the user can see
 * the correct value before pressing continue.
 */
export const submitAnswerAction = defineAction([arithmeticStore], (state) => {
  if (state.phase !== 'drill') return;
  if (state.feedback !== 'idle') return;
  if (!state.problem) return;

  const given = parseInput(state.input);
  if (given === null) return;

  if (given === state.problem.answer) {
    state.attempts.push({ problem: state.problem, given, correct: true });
    state.problem = generateProblem(state.difficulty);
    state.input = '';
    state.feedback = 'idle';
    state.lastGiven = null;
  } else {
    state.feedback = 'wrong-pending';
    state.lastGiven = given;
  }
});

/** Acknowledge a wrong answer, record it, and advance to the next problem. */
export const ackWrongAction = defineAction([arithmeticStore], (state) => {
  if (state.feedback !== 'wrong-pending') return;
  if (!state.problem || state.lastGiven === null) return;

  state.attempts.push({
    problem: state.problem,
    given: state.lastGiven,
    correct: false,
  });
  state.problem = generateProblem(state.difficulty);
  state.input = '';
  state.feedback = 'idle';
  state.lastGiven = null;
});

export const endSessionAction = defineAction([arithmeticStore], (state) => {
  // Persist a pending wrong answer so accuracy reflects what the user
  // actually answered when they hit End mid-feedback, instead of
  // silently dropping the attempt.
  if (
    state.feedback === 'wrong-pending' &&
    state.problem &&
    state.lastGiven !== null
  ) {
    state.attempts.push({
      problem: state.problem,
      given: state.lastGiven,
      correct: false,
    });
  }
  state.phase = 'stats';
  state.feedback = 'idle';
  state.lastGiven = null;
});

export const resetSessionAction = defineAction([arithmeticStore], (state) => {
  Object.assign(state, initialState(), { difficulty: state.difficulty });
});

/** Shape returned by {@link useArithmeticActions}. */
export interface ArithmeticActions {
  setDifficulty: (difficulty: Difficulty) => void;
  start: () => void;
  setInput: (value: string) => void;
  submit: () => void;
  ackWrong: () => void;
  end: () => void;
  reset: () => void;
}

/** Bind the worksheet actions inside a component scope. */
export const useArithmeticActions = (): ArithmeticActions => ({
  setDifficulty: useAction(setDifficultyAction),
  start: useAction(startSessionAction),
  setInput: useAction(setInputAction),
  submit: useAction(submitAnswerAction),
  ackWrong: useAction(ackWrongAction),
  end: useAction(endSessionAction),
  reset: useAction(resetSessionAction),
});

/** Roll-up totals for the stats screen. */
export interface SessionSummary {
  total: number;
  correct: number;
  wrong: number;
  /** 0–100. Returns 0 when no attempts were made. */
  accuracy: number;
  byOperation: Record<Operation, { total: number; correct: number }>;
}

const emptyByOperation = (): SessionSummary['byOperation'] => ({
  '+': { total: 0, correct: 0 },
  '-': { total: 0, correct: 0 },
  '*': { total: 0, correct: 0 },
  '/': { total: 0, correct: 0 },
});

/** Derive a session summary from the recorded attempt log. */
export const summarize = (attempts: ReadonlyArray<Attempt>): SessionSummary => {
  const byOperation = emptyByOperation();
  let correct = 0;

  for (const attempt of attempts) {
    const bucket = byOperation[attempt.problem.op];
    bucket.total += 1;
    if (attempt.correct) {
      bucket.correct += 1;
      correct += 1;
    }
  }

  const total = attempts.length;
  return {
    total,
    correct,
    wrong: total - correct,
    accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
    byOperation,
  };
};
