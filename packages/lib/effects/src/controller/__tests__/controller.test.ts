import { pipe } from '../../combinators';
import { createManager } from '../../manager';
import { source } from '../../source';
import { createController } from '../controller';

describe('createController', () => {
  it('binds the manager operations to one manager', async () => {
    const manager = createManager();
    const controller = createController(manager);
    const count = source(1);
    const double = (value: number) => value * 2;
    const handle = controller.acquire(pipe([count, double]));

    await controller.compute(handle);
    expect(manager.handles.has(handle)).toBe(true);
    expect(controller.inspect(handle, handle.outputs[0])).toMatchObject({
      step: 'succeeded',
      value: 2,
    });

    await controller.setSource(count, 2);
    expect(controller.inspect(handle, handle.outputs[0])).toMatchObject({
      value: 4,
    });
    expect(controller.bound(handle, handle.outputs[0])()).toMatchObject({
      inputs: [2],
    });

    await controller.release(handle);
    expect(manager.handles.has(handle)).toBe(false);
  });
});
