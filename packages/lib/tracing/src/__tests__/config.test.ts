import { createContext, type TracerConfig } from '../config';

const setup = (overrides?: Partial<TracerConfig>) =>
  createContext({
    getCurrentTime: () => 1_000,
    processor: vi.fn(),
    holz: { processor: vi.fn() },
    ...overrides,
  });

describe('createContext', () => {
  it('uses the configured getCurrentTime', () => {
    const getCurrentTime = () => 1_000;

    expect(setup({ getCurrentTime }).getCurrentTime).toBe(getCurrentTime);
  });

  it('uses the configured getRandomBytes', () => {
    const getRandomBytes = (count: number) => new Uint8Array(count);

    expect(setup({ getRandomBytes }).getRandomBytes).toBe(getRandomBytes);
  });

  it('defaults getRandomBytes to the requested number of bytes', () => {
    expect(setup().getRandomBytes(8)).toHaveLength(8);
  });
});
