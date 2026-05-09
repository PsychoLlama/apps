import { stripAnimations } from '../strip-animations.ts';

describe('stripAnimations', () => {
  it('passes non-animated bodies through verbatim — fast path keyed on tag substring', () => {
    const body = '<path d="M0 0h24v24H0z" fill="currentColor"/>';

    expect(stripAnimations(body)).toBe(body);
  });

  it('drops the animation element and hoists its `freeze` final value onto the parent', () => {
    const body =
      '<path stroke-dashoffset="28" d="M0 0"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.4s" to="0"/></path>';

    expect(stripAnimations(body)).toBe(
      '<path stroke-dashoffset="0" d="M0 0"></path>',
    );
  });

  it('reads the final value from the last entry of `values=` when `to` is absent', () => {
    const body =
      '<path d="M0 0"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="28;14;0"/></path>';

    expect(stripAnimations(body)).toBe(
      '<path d="M0 0" stroke-dashoffset="0"></path>',
    );
  });

  it('falls back to `from` when neither `to` nor `values` are present — covers the no-end-state edge case', () => {
    const body =
      '<path d="M0 0"><animate fill="freeze" attributeName="opacity" dur="0.4s" from="0.5"/></path>';

    expect(stripAnimations(body)).toBe('<path d="M0 0" opacity="0.5"></path>');
  });

  it('drops non-`freeze` animations without hoisting — without freeze the post-animation pose is undefined', () => {
    const body =
      '<path d="M0 0"><animate attributeName="opacity" dur="0.4s" values="0;1"/></path>';

    expect(stripAnimations(body)).toBe('<path d="M0 0"></path>');
  });

  it('handles multiple animations on the same parent', () => {
    const body =
      '<path d="M0 0"><animate fill="freeze" attributeName="opacity" dur="0.4s" to="1"/><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" to="0"/></path>';
    const result = stripAnimations(body);

    expect(result).toContain('opacity="1"');
    expect(result).toContain('stroke-dashoffset="0"');
    expect(result).not.toContain('<animate');
  });

  it('handles a real line-md body — every glyph in the pack ships one of these', () => {
    const body =
      '<g fill="none" stroke="currentColor" stroke-dasharray="28" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M4 21v-1c0 -3.31 2.69 -6 6 -6h4c3.31 0 6 2.69 6 6v1"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="28;0"/></path><path stroke-dashoffset="28" d="M12 11c-2.21 0 -4 -1.79 -4 -4c0 -2.21 1.79 -4 4 -4c2.21 0 4 1.79 4 4c0 2.21 -1.79 4 -4 4Z"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.4s" to="0"/></path></g>';
    const result = stripAnimations(body);

    expect(result).not.toContain('<animate');
    // Both paths now carry the freeze final value of 0 so the icon
    // renders fully drawn rather than stuck at the start of the pulse.
    expect(result.match(/stroke-dashoffset="0"/g)).toHaveLength(2);
  });

  it('drops `<set>` elements alongside `<animate>` — same SMIL family', () => {
    const body =
      '<rect width="10" height="10"><set attributeName="fill" to="red"/></rect>';

    expect(stripAnimations(body)).toBe(
      '<rect width="10" height="10" fill="red"></rect>',
    );
  });
});
