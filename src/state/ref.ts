/**
 * Opaque, non-reactive handle to a value. Use for host objects (media
 * streams, recorders, etc) that must live inside a reactive store
 * without being proxied. Solid leaves class instances alone, so
 * reading `ref.current` bypasses proxy descent entirely.
 *
 * Refs are immutable. To swap the held value, replace the ref:
 * `state.recorder = ref(next)`.
 */
export class Ref<T> {
  readonly current: T;
  constructor(value: T) {
    this.current = value;
  }
}

/** Wrap a value in a {@link Ref}. */
export function ref<T>(value: T): Ref<T> {
  return new Ref(value);
}
