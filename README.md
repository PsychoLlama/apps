# [Apps](https://apps.psychollama.io/)

A Productivity Playground 🛝

## Purpose

1. It's an excuse to try a [Dark Factory Architecture](https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/). Nothing in this repo matters, so it's all open for automation.
2. [Simon Willison's Tools](https://tools.simonwillison.net/) inspired me to create my own playground of tools.
3. It's a single place to invest in dev tooling rather than copy-pasting across 10 different projects.

## Project Status

:construction: Experimental

May keep it, may abandon it. Who knows. [Wild card](https://www.youtube.com/watch?v=ecRytTfWL8Q&t=23s).

## Developer Tools

Theory: with careful tooling, AI-generated code can achieve [equivalent or better results](https://paulgraham.com/avg.html) than a human baseline.

This repo is definitely over-engineered.

### Stack

**Client Side:** hydrated pre-rendered SPA.

- [SolidJS / SolidStart](https://start.solidjs.com/): Frontend framework providing SSG and fine-grained reactivity. Improves on React with scalable performance and bundle size.
- [Vanilla Extract](https://vanilla-extract.style/): Compile-time CSS in TS. Improves on alternatives with dead code elimination, type safety, and easier targeting with custom ESLint rules.

**Server Side:** Static hosting only.

- [Cloudflare Workers](https://workers.cloudflare.com/): Asset hosting, dynamic route redirects, and custom headers.

### Design System

:point_right: View in [Storybook](https://apps.psychollama.io/__storybook/) :point_left:

I ported open design systems and component libraries to SolidJS and Vanilla Extract.

Sources:

- [Radix](https://www.radix-ui.com/): Incredible design system with deep attention to detail. This is the foundation.
- [IBM Carbon](https://carbondesignsystem.com/): Animation and typography concepts.
- [The New CSS Reset](https://elad2412.github.io/the-new-css-reset/): Strips UA styling. Ported almost verbatim.

Deviations:

- API designed for agents, not humans.
- Some features excluded for smaller bundles.
- Modern browsers only.
- Opinionated settings for native feel.
