import { DEFAULT_ICON_EDITOR_STATE, resolveHydrateInput } from '../state';
import { DEFAULT_ICON, type IconRef } from '../icons';

const customIcon: IconRef = {
  pack: 'tabler',
  name: 'rocket',
  body: '<path d="M0 0"/>',
  width: 24,
  height: 24,
};

describe('resolveHydrateInput', () => {
  it('returns the canonical defaults for an empty input', () => {
    expect(resolveHydrateInput({})).toEqual(DEFAULT_ICON_EDITOR_STATE);
  });

  it('keeps the default icon when the caller does not supply a resolved one', () => {
    expect(resolveHydrateInput({ palette: 'mint' }).icon).toEqual(DEFAULT_ICON);
  });

  it('passes a resolved icon through verbatim', () => {
    expect(resolveHydrateInput({ icon: customIcon }).icon).toEqual(customIcon);
  });

  it('falls back to the default when an unknown palette name is supplied', () => {
    const next = resolveHydrateInput({ palette: 'mauvelous' });

    expect(next.palette).toBe(DEFAULT_ICON_EDITOR_STATE.palette);
  });

  it('falls back to the default when an unknown shape is supplied', () => {
    const next = resolveHydrateInput({ shape: 'pentagon' });

    expect(next.shape).toBe(DEFAULT_ICON_EDITOR_STATE.shape);
  });

  it('clamps the padding into the slider range and floors fractionals', () => {
    expect(resolveHydrateInput({ padding: -10 }).padding).toBe(0);
    expect(resolveHydrateInput({ padding: 9999 }).padding).toBe(40);
    expect(resolveHydrateInput({ padding: 18.7 }).padding).toBe(18);
  });

  it('rejects non-finite padding values rather than poisoning the store', () => {
    expect(resolveHydrateInput({ padding: Number.NaN }).padding).toBe(
      DEFAULT_ICON_EDITOR_STATE.padding,
    );
    expect(
      resolveHydrateInput({ padding: Number.POSITIVE_INFINITY }).padding,
    ).toBe(DEFAULT_ICON_EDITOR_STATE.padding);
  });

  it('applies a fully-specified valid input verbatim', () => {
    const next = resolveHydrateInput({
      icon: customIcon,
      palette: 'mint',
      shape: 'circle',
      padding: 8,
    });

    expect(next.icon).toEqual(customIcon);
    expect(next.palette).toBe('mint');
    expect(next.shape).toBe('circle');
    expect(next.padding).toBe(8);
  });
});
