import { resolveStyleHydration } from '../capabilities';
import { DEFAULT_ICON_EDITOR_STATE } from '../store';

const DEFAULT_STYLE = {
  palette: DEFAULT_ICON_EDITOR_STATE.palette,
  shape: DEFAULT_ICON_EDITOR_STATE.shape,
  padding: DEFAULT_ICON_EDITOR_STATE.padding,
};

describe('resolveStyleHydration', () => {
  it('returns the canonical defaults for an empty input', () => {
    expect(resolveStyleHydration({})).toEqual(DEFAULT_STYLE);
  });

  it('falls back to the default when an unknown palette name is supplied', () => {
    expect(resolveStyleHydration({ palette: 'mauvelous' }).palette).toBe(
      DEFAULT_STYLE.palette,
    );
  });

  it('falls back to the default when an unknown shape is supplied', () => {
    expect(resolveStyleHydration({ shape: 'pentagon' }).shape).toBe(
      DEFAULT_STYLE.shape,
    );
  });

  it('clamps the padding into the slider range and floors fractionals', () => {
    expect(resolveStyleHydration({ padding: -10 }).padding).toBe(0);
    expect(resolveStyleHydration({ padding: 9999 }).padding).toBe(40);
    expect(resolveStyleHydration({ padding: 18.7 }).padding).toBe(18);
  });

  it('rejects non-finite padding values rather than poisoning the store', () => {
    expect(resolveStyleHydration({ padding: Number.NaN }).padding).toBe(
      DEFAULT_STYLE.padding,
    );
    expect(
      resolveStyleHydration({ padding: Number.POSITIVE_INFINITY }).padding,
    ).toBe(DEFAULT_STYLE.padding);
  });

  it('applies a fully-specified valid input verbatim', () => {
    expect(
      resolveStyleHydration({
        palette: 'mint',
        shape: 'circle',
        padding: 8,
      }),
    ).toEqual({ palette: 'mint', shape: 'circle', padding: 8 });
  });
});
