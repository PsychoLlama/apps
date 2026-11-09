import type { Action, SpanProcessor } from '../../processor/processor';
import type { EnteredSpan } from '../../processor/span-data';
import { createFilter } from '../filter';

describe('createFilter', () => {
  const span: EnteredSpan = {
    name: 'load-page',
    id: new Uint8Array(8),
    parent: null,
    trace: { id: new Uint8Array(16) },
    attrs: {},
    time: { started: 1_000 },
  };

  const action: Action = { type: 'enter', span };

  const setup = () => {
    const onAction = vi.fn<(action: Action) => void>();
    const processor = vi.fn<SpanProcessor>(() => onAction);

    return { onAction, processor };
  };

  it('forwards the span and its actions when the test passes', () => {
    const { onAction, processor } = setup();

    createFilter(() => true, processor)(span)(action);

    expect(processor).toHaveBeenCalledExactlyOnceWith(span);
    expect(onAction).toHaveBeenCalledExactlyOnceWith(action);
  });

  it('drops the span and its actions when the test fails', () => {
    const { onAction, processor } = setup();

    createFilter(() => false, processor)(span)(action);

    expect(processor).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
  });

  it('tests the span once, regardless of how many actions follow', () => {
    const { processor } = setup();
    const predicate = vi.fn(() => true);

    const onAction = createFilter(predicate, processor)(span);
    onAction(action);
    onAction(action);

    expect(predicate).toHaveBeenCalledExactlyOnceWith(span);
  });
});
