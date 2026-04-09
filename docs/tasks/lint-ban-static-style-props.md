## Lint rule: ban static style props

Add a custom lint rule that forbids `style={}` props containing static
values. Static styles should be defined in vanilla-extract, not inlined
on elements. Dynamic runtime values are the only valid use of `style`.
