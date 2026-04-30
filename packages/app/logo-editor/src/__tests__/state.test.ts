import { DEFAULT_LOGO_EDITOR_STATE, resolveHydrateInput } from '../state';
import { findIcon } from '../icons';

describe('resolveHydrateInput', () => {
  it('returns the canonical defaults for an empty input', () => {
    expect(resolveHydrateInput({})).toEqual(DEFAULT_LOGO_EDITOR_STATE);
  });

  it('resets each field that is absent — a clean URL must not inherit prior session state', () => {
    const partial = resolveHydrateInput({ icon: 'cog' });

    expect(partial.icon.name).toBe('cog');
    expect(partial.palette).toBe(DEFAULT_LOGO_EDITOR_STATE.palette);
    expect(partial.shape).toBe(DEFAULT_LOGO_EDITOR_STATE.shape);
    expect(partial.padding).toBe(DEFAULT_LOGO_EDITOR_STATE.padding);
  });

  it('falls back to the default when an unknown icon name is supplied', () => {
    const next = resolveHydrateInput({ icon: 'totally-not-an-icon' });

    expect(next.icon).toEqual(DEFAULT_LOGO_EDITOR_STATE.icon);
  });

  it('falls back to the default when an unknown palette name is supplied', () => {
    const next = resolveHydrateInput({ palette: 'mauvelous' });

    expect(next.palette).toBe(DEFAULT_LOGO_EDITOR_STATE.palette);
  });

  it('falls back to the default when an unknown shape is supplied', () => {
    const next = resolveHydrateInput({ shape: 'pentagon' });

    expect(next.shape).toBe(DEFAULT_LOGO_EDITOR_STATE.shape);
  });

  it('clamps the padding into the slider range and floors fractionals', () => {
    expect(resolveHydrateInput({ padding: -10 }).padding).toBe(0);
    expect(resolveHydrateInput({ padding: 9999 }).padding).toBe(40);
    expect(resolveHydrateInput({ padding: 18.7 }).padding).toBe(18);
  });

  it('rejects non-finite padding values rather than poisoning the store', () => {
    expect(resolveHydrateInput({ padding: Number.NaN }).padding).toBe(
      DEFAULT_LOGO_EDITOR_STATE.padding,
    );
    expect(
      resolveHydrateInput({ padding: Number.POSITIVE_INFINITY }).padding,
    ).toBe(DEFAULT_LOGO_EDITOR_STATE.padding);
  });

  it('applies a fully-specified valid input verbatim', () => {
    const next = resolveHydrateInput({
      icon: 'cog',
      palette: 'mint',
      shape: 'circle',
      padding: 8,
    });

    expect(next.icon).toEqual(findIcon('cog'));
    expect(next.palette).toBe('mint');
    expect(next.shape).toBe('circle');
    expect(next.padding).toBe(8);
  });
});
