import { configure } from '../tracer';

describe('configure', () => {
  it('exposes the configured getCurrentTime', () => {
    const getCurrentTime = () => 1_000;
    const tracer = configure({ getCurrentTime });

    expect(tracer.getCurrentTime).toBe(getCurrentTime);
  });
});

describe('tracer.span', () => {
  it('creates a span with the given name', () => {
    const tracer = configure({ getCurrentTime: () => 1_000 });

    expect(tracer.span('load-page').name).toBe('load-page');
  });
});
