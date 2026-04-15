import { defineActivity, executeActivity } from '../activity';

describe('defineActivity', () => {
  it('creates an opaque handle', () => {
    const activity = defineActivity({}, () => 42);
    expect(activity).toBeDefined();
  });

  it('executes with arguments and returns the result', () => {
    const add = defineActivity({}, (a: number, b: number) => a + b);
    expect(executeActivity(add, 2, 3)).toBe(5);
  });

  it('supports async activities', async () => {
    const fetch = defineActivity({}, async (id: string) => ({ id }));
    const result = await executeActivity(fetch, 'abc');
    expect(result).toEqual({ id: 'abc' });
  });
});
