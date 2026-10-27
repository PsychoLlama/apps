import { createTestController } from '@lib/effects/testing';
import {
  createDecoder,
  terminateDecoder,
  type DecoderConnection,
} from '../../decoder';
import { $decoder } from '../decoder';

// Never spawn the real `?worker` module.
vi.mock('../../decoder', () => ({
  createDecoder: vi.fn(),
  terminateDecoder: vi.fn(),
}));

const connection = {} as DecoderConnection;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(createDecoder).mockResolvedValue(connection);
});

describe('$decoder', () => {
  it('yields the live connection', async () => {
    await using effects = createTestController();

    await expect(effects.run($decoder)).resolves.toBe(connection);
  });

  it('terminates the worker on release', async () => {
    await using effects = createTestController();

    {
      await using compute = effects.use($decoder);
      await compute();
      expect(terminateDecoder).not.toHaveBeenCalled();
    }

    expect(terminateDecoder).toHaveBeenCalledWith(connection);
  });
});
