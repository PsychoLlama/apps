import type { EnteredSpan, ExitedSpan, Span } from '../../processor/span-data';
import { createDevtoolsBackend } from '../devtools';

describe('devtools backend', () => {
  const span: Span = {
    name: 'load-page',
    id: new Uint8Array(8),
    parent: null,
    trace: { id: new Uint8Array(16) },
    attrs: {},
  };

  const entered: EnteredSpan = { ...span, time: { started: 1_500 } };

  const exited: ExitedSpan = {
    ...entered,
    time: { started: 1_500, ended: 2_250.5 },
    status: { code: 'ok' },
  };

  const setup = () => {
    const measure = vi.fn<typeof performance.measure>();
    vi.stubGlobal('performance', { timeOrigin: 1_000, measure });

    return { measure, onAction: createDevtoolsBackend()(span) };
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('measures nothing until the span exits', () => {
    const { measure, onAction } = setup();

    onAction({ type: 'enter', span: entered });
    onAction({ type: 'attributes-updated', span: entered });

    expect(measure).not.toHaveBeenCalled();
  });

  it('measures the span relative to the time origin', () => {
    const { measure, onAction } = setup();

    onAction({ type: 'exit', span: exited });

    expect(measure).toHaveBeenCalledExactlyOnceWith('load-page', {
      start: 500,
      end: 1_250.5,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Traces',
          properties: [],
        },
      },
    });
  });

  it('reports attributes as strings', () => {
    const { measure, onAction } = setup();

    onAction({
      type: 'exit',
      span: {
        ...exited,
        attrs: {
          route: '/share',
          cached: true,
          http: { status: 200 },
          missing: undefined,
        },
      },
    });

    expect(measure.mock.lastCall?.[1]).toEqual({
      start: 500,
      end: 1_250.5,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Traces',
          properties: [
            ['route', '/share'],
            ['cached', 'true'],
            ['http', '{"status":200}'],
          ],
        },
      },
    });
  });

  it('highlights failed spans with the error message', () => {
    const { measure, onAction } = setup();

    onAction({
      type: 'exit',
      span: {
        ...exited,
        status: { code: 'error', error: new Error('Request failed.') },
      },
    });

    expect(measure.mock.lastCall?.[1]).toEqual({
      start: 500,
      end: 1_250.5,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Traces',
          properties: [],
          color: 'error',
          tooltipText: 'Request failed.',
        },
      },
    });
  });
});
