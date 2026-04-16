import { createEventBus, subscribe, useWorkflow } from '#state';
import { deleteRecordingWorkflow, renameRecordingWorkflow } from '../workflows';

describe('deleteRecordingWorkflow', () => {
  it('revokes the recording blob URL', () => {
    const bus = createEventBus();
    const spy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);

    const run = useWorkflow(deleteRecordingWorkflow, bus);
    run({ id: 'rec-1', url: 'blob:abc' });

    expect(spy).toHaveBeenCalledWith('blob:abc');
    spy.mockRestore();
  });

  it('resolves with the deleted id', () => {
    const bus = createEventBus();
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    let resolvedId: string | undefined;
    subscribe(bus, [deleteRecordingWorkflow.resolved], (_t, payload) => {
      resolvedId = payload as string;
    });

    const run = useWorkflow(deleteRecordingWorkflow, bus);
    run({ id: 'rec-2', url: 'blob:xyz' });

    expect(resolvedId).toBe('rec-2');
    vi.restoreAllMocks();
  });
});

describe('renameRecordingWorkflow', () => {
  it('resolves with the provided id and name', () => {
    const bus = createEventBus();

    let payload: { id: string; name: string } | undefined;
    subscribe(bus, [renameRecordingWorkflow.resolved], (_t, p) => {
      payload = p as { id: string; name: string };
    });

    const run = useWorkflow(renameRecordingWorkflow, bus);
    run({ id: 'rec-1', name: 'Demo' });

    expect(payload).toEqual({ id: 'rec-1', name: 'Demo' });
  });
});
