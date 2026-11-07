import { configure } from '../tracer';

describe('configure', () => {
  it('exposes the configured clock', () => {
    const clock = () => 1_000;
    const tracer = configure({ clock });

    expect(tracer.clock).toBe(clock);
  });
});

describe('tracer.span', () => {
  it('creates a span with the given name', () => {
    const tracer = configure({ clock: () => 1_000 });

    expect(tracer.span('load-page').name).toBe('load-page');
  });
});
