import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../prefer-assert';

const tester = new RuleTester();

tester.run('prefer-assert', rule, {
  valid: [
    // A named subclass is a handling contract. `assert` would collapse it.
    { code: "if (!supported) throw new CameraError('unsupported')" },
    {
      code: 'if (!response.ok) throw new IconAssetError(url, response.status)',
    },

    // Refined built-ins carry meaning of their own — the service worker
    // throws `TypeError` so the browser shows its offline page.
    { code: "if (!response) throw new TypeError('Offline with no cache.')" },
    { code: "if (index < 0) throw new RangeError('out of bounds')" },
    {
      code: "if (failures.length) throw new AggregateError(failures, 'failed')",
    },

    // Setup before the throw means a report is being assembled from runtime
    // state, not an invariant being noted.
    {
      code: `
        if (!head || outputs.length !== 1) {
          const paths = outputs.map((file) => file.path).join(', ');
          throw new Error(\`expected one output, got \${paths}\`);
        }
      `,
    },

    // Bodies that do something other than throw.
    { code: 'if (!db) return null' },
    { code: "if (!ctx) { logger.warn('missing'); }" },
    { code: "if (!ctx) { throw new Error('a'); } else { use(ctx); }" },

    // The tail of an `else if` chain is a branch, not a precondition.
    {
      code: "if (a) { run(); } else if (!b) { throw new Error('unreachable'); }",
    },

    // A local `Error` isn't the global one.
    {
      code: "const make = (Error) => { if (!x) throw new Error('shadowed'); }",
    },

    // Throws that aren't guarded, and guards that rethrow a binding.
    { code: "throw new Error('unconditional')" },
    { code: 'if (!x) throw cached' },
    { code: 'if (!x) throw err' },
  ],

  invalid: [
    // The canonical context guard.
    {
      code: "if (!ctx) throw new Error('<TabsTrigger> rendered outside of <TabsList>.')",
      errors: [{ messageId: 'preferAssert' as const }],
    },

    // Block form is the same guard.
    {
      code: `
        if (!ctx) {
          throw new Error('<RadioGroupItem> rendered outside of <RadioGroupRoot>.');
        }
      `,
      errors: [{ messageId: 'preferAssert' as const }],
    },

    // An invariant may interpolate the value that broke it.
    {
      code: 'if (!entry) throw new Error(`No live connection for peer ${peerId}.`)',
      errors: [{ messageId: 'preferAssert' as const }],
    },

    // Inverted polarity still lifts: `assert(!this.endpoint, …)`.
    {
      code: "if (this.endpoint) throw new Error('Already joined the relay network.')",
      errors: [{ messageId: 'preferAssert' as const }],
    },

    // A compound condition is still a single precondition.
    {
      code: "if (options.maxBytes !== undefined && over) throw new Error('too big')",
      errors: [{ messageId: 'preferAssert' as const }],
    },

    // Comments carry no setup, so the block still holds only the throw.
    {
      code: `
        if (db === null) {
          // The valve only opens from within \`connect\`, which sets \`db\` first.
          throw new Error('Cannot drain logs: the database is not connected.');
        }
      `,
      errors: [{ messageId: 'preferAssert' as const }],
    },

    // A messageless guard says less than the stack trace already does.
    {
      code: 'if (!x) throw new Error()',
      errors: [{ messageId: 'preferAssert' as const }],
    },
  ],
});
