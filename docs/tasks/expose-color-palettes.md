## Expose all color palettes as CSS custom properties

Make every color palette available as CSS custom properties so consumers
can reference any palette color directly. Semantic color tokens should
alias the palette vars in CSS rather than inlining raw values. This
keeps the palette layer accessible while letting semantic tokens remain
the default interface.
