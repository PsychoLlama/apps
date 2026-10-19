import { pipe } from '../../combinators';
import { createManager } from '../../manager';
import { createController } from '../controller';

describe('createController', () => {
  it('binds the manager operations to one manager', async () => {
    const manager = createManager();
    const controller = createController(manager);
    const one = () => 1;
    const double = (value: number) => value * 2;
    const handle = controller.acquire(pipe([one, double]));

    await controller.compute(handle);
    expect(manager.handles.has(handle)).toBe(true);
    expect(controller.inspect(handle, handle.output)).toMatchObject({
      step: 'succeeded',
      inputs: [1],
      outputs: [2],
    });

    await controller.release(handle);
    expect(manager.handles.has(handle)).toBe(false);
  });
});
