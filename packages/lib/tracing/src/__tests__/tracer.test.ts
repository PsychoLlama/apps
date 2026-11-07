import { configure } from '../tracer';

describe('configure', () => {
  it('exposes the configured clock', () => {
    const clock = () => 1_000;
    const tracer = configure({ clock });

    expect(tracer.clock).toBe(clock);
  });
});
