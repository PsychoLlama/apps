import { createContext, type TracerConfig } from '../config';

describe('config', () => {
  const setup = (overrides?: Partial<TracerConfig>) =>
    createContext({
      processor: vi.fn(),
      holz: { processor: vi.fn() },
      ...overrides,
    });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createContext', () => {
    it('uses the configured getCurrentTime', () => {
      const getCurrentTime = () => 1_000;

      expect(setup({ getCurrentTime }).getCurrentTime).toBe(getCurrentTime);
    });

    it('defaults getCurrentTime to epoch milliseconds', () => {
      vi.useFakeTimers({ now: 5_000 });
      const { getCurrentTime } = setup();

      vi.advanceTimersByTime(250);

      expect(getCurrentTime()).toBe(5_250);
    });

    it('uses the configured getRandomBytes', () => {
      const getRandomBytes = (count: number) => new Uint8Array(count);

      expect(setup({ getRandomBytes }).getRandomBytes).toBe(getRandomBytes);
    });

    it('defaults getRandomBytes to the requested number of bytes', () => {
      expect(setup().getRandomBytes(8)).toHaveLength(8);
    });
  });
});
