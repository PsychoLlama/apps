## Typography leading trim

Radix UI Themes exposes a `trim` prop on `Text` and `Heading` that
removes the intrinsic whitespace above and below text caused by
line-height / font metrics (half-leading). It applies negative margins
using CSS custom properties (`--default-leading-trim-start`,
`--default-leading-trim-end`) so container padding looks visually even
on all sides.

Our `Text` and `Heading` components only reset `margin: 0` — they don't
address the half-leading space. Audit the Radix implementation and add a
`trim` prop (`"start" | "end" | "both"`) with appropriate default trim
values for each size in our type scale.

Reference: https://www.radix-ui.com/themes/docs/components/text
