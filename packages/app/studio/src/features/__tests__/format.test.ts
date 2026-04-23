import { formatBytes } from '../format';

describe('formatBytes', () => {
  it('renders raw bytes with no fraction below 1 KB', () => {
    expect(formatBytes(0)).toMatch(/0\s*byte/i);
    expect(formatBytes(512)).toMatch(/512\s*byte/i);
  });

  it('switches to KB above 1000 bytes', () => {
    expect(formatBytes(1500)).toMatch(/1\.5\s*kB/i);
  });

  it('drops the fraction once the value crosses 10', () => {
    expect(formatBytes(15_000)).toMatch(/15\s*kB/i);
  });

  it('walks up units as magnitude grows', () => {
    expect(formatBytes(2_500_000)).toMatch(/2\.5\s*MB/i);
    expect(formatBytes(3_500_000_000)).toMatch(/3\.5\s*GB/i);
  });
});
