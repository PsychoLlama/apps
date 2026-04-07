# Launcher Vision

A page at `/` listing all apps in the repository. Apps are hard-coded — no auto-discovery, no registry.

## Requirements

### Launcher Page

- Route: `/`
- Display a list of available apps with name and link
- Each entry navigates to the app's route

### Shared Layout

- All apps share a common shell with a header
- Header contains a link back to `/` (the launcher)
- Header is minimal — it should not compete with app content
- The launcher page itself uses the same shell

### Known Apps

Hard-coded list, updated manually as apps are added:

- [Recording Studio](../studio/vision.md) — `/studio`

## Open Decisions

1. **Layout/visual density:** Deferred. Start with whatever looks reasonable for 1-2 apps; revisit as the list grows.
2. **App metadata structure:** Currently just name, route, and description. May evolve if we need icons, categories, or tags.
