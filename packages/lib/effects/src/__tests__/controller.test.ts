import { pipe } from '../combinators';
import { createController } from '../controller';
import { createManager } from '../manager';
import { source } from '../source';

describe('controller', () => {
  it('binds the manager operations to one manager', async () => {
    const manager = createManager();
    const controller = createController(manager);
    const count = source(1);
    const double = (value: number) => value * 2;
    const handle = controller.acquire(pipe([count, double]));

    expect(manager.handles.has(handle)).toBe(true);

    await controller.compute(handle);
    expect(controller.inspect(handle, handle.outputs[0])).toMatchObject({
      step: 'succeeded',
      value: 2,
    });

    await controller.setSource(count, 2);
    expect(controller.inspect(handle, handle.outputs[0])).toMatchObject({
      value: 4,
    });

    await controller.release(handle);
    expect(manager.handles.has(handle)).toBe(false);
  });
});
