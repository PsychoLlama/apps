import type { Collected, Reactive, Resource } from '../task';

type Primitive = string | number | boolean | bigint | null | undefined;

/**
 * `Value` with every part the server can't hand to the client turned to
 * `never`. Plain data maps to itself: primitives, dates, and arrays, maps,
 * sets, and objects of them. Bound a type parameter by it, `Value extends
 * Serializable<Value>`, to accept only plain data.
 *
 * It maps the value's own keys, so a property can't slip in by subtyping.
 * Functions need their own branch: a function type also fits an object
 * shape.
 */
export type Serializable<Value> = Value extends Primitive | Date
  ? Value
  : Value extends (...args: never) => unknown
    ? never
    : Value extends ReadonlyMap<infer Key, infer Item>
      ? ReadonlyMap<Serializable<Key>, Serializable<Item>>
      : Value extends ReadonlySet<infer Item>
        ? ReadonlySet<Serializable<Item>>
        : Value extends object
          ? {
              [Key in keyof Value]: Key extends symbol
                ? never
                : Serializable<Value[Key]>;
            }
          : never;

/**
 * A plan output that reads as {@link Serializable} data: plain data, or
 * wrappers around it. Bound like `Serializable`.
 */
export type SerializableOutput<Output> =
  Output extends Resource<infer Inner>
    ? Resource<Serializable<Inner>>
    : Output extends Reactive<infer Inner>
      ? Reactive<Serializable<Inner>>
      : Output extends Collected<infer Items>
        ? Collected<{
            [Index in keyof Items]: SerializableOutput<Items[Index]>;
          }>
        : Serializable<Output>;
