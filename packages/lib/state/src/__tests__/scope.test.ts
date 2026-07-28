import { createTestRuntime } from '../bindings';
import { defineScope } from '../scope';
import { defineCell, defineStore } from '../space';

interface Counter {
  count: number;
}

const setup = () => {
  const scope = defineScope();
  const counter = defineStore<Counter>(scope, () => ({ count: 0 }));
  return { scope, counter, ...createTestRuntime() };
};

describe('scopes', () => {
  it('rejects reads while the scope has no anchors', () => {
    const { counter, peek } = setup();
    expect(() => peek(counter)).toThrow(/dead scope/i);
  });

  it('materializes space lazily and keeps identity across reads', () => {
    const { scope, counter, anchor, peek } = setup();
    anchor(scope);

    expect(peek(counter)).toBe(peek(counter));
    expect(peek(counter).count).toBe(0);
  });

  it('refcounts anchors: only the last release kills the scope', () => {
    const { scope, counter, anchor, peek } = setup();
    const releaseFirst = anchor(scope);
    const releaseSecond = anchor(scope);

    releaseFirst();
    expect(peek(counter).count).toBe(0);

    releaseSecond();
    expect(() => peek(counter)).toThrow(/dead scope/i);
  });

  it('makes release idempotent: double-release cannot steal an anchor', () => {
    const { scope, counter, anchor, peek } = setup();
    const releaseFirst = anchor(scope);
    anchor(scope);

    releaseFirst();
    releaseFirst();

    expect(peek(counter).count).toBe(0);
  });

  it('runs cell drop hooks with the held value when the scope dies', () => {
    const scope = defineScope();
    const drop = vi.fn();
    const handle = defineCell(scope, () => ({ id: 1 }), { drop });
    const { anchor, peek } = createTestRuntime();

    const release = anchor(scope);
    expect(peek(handle)).toEqual({ id: 1 });

    release();
    expect(drop).toHaveBeenCalledTimes(1);
    expect(drop).toHaveBeenCalledWith({ id: 1 });
  });

  it('skips drop hooks for cells that never materialized', () => {
    const scope = defineScope();
    const drop = vi.fn();
    defineCell(scope, () => null, { drop });
    const { anchor } = createTestRuntime();

    anchor(scope)();

    expect(drop).not.toHaveBeenCalled();
  });

  it('holds host objects in cells without proxying them', () => {
    const scope = defineScope();
    const track = new (class FakeTrack {})();
    const handle = defineCell(scope, () => track);
    const { anchor, peek } = createTestRuntime();
    anchor(scope);

    expect(peek(handle)).toBe(track);
  });

  it('isolates the same definitions across runtimes', () => {
    const scope = defineScope();
    const counter = defineStore<Counter>(scope, () => ({ count: 0 }));
    const first = createTestRuntime();
    const second = createTestRuntime();

    first.anchor(scope);
    expect(first.peek(counter).count).toBe(0);
    expect(() => second.peek(counter)).toThrow(/dead scope/i);
  });
});
