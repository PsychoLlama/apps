import {
  SUBSCRIBERS,
  type Fact,
  type Fold,
  type PayloadArgs,
  type Topic,
} from './internal';

export type { Fact, Topic };

/**
 * Define a topic — an identity for facts. Calling the topic wraps a
 * payload into an inert `[topic, payload]` fact; nothing happens until
 * the fact is committed. Facts are the only interface between the effect
 * world and the state world. Exporting a topic is a deliberate API act:
 * it becomes the feature's outbound contract.
 */
export const defineTopic = <Payload = void>(): Topic<Payload> => {
  const topic = (...args: PayloadArgs<Payload>): Fact<Payload> => [
    wired,
    args[0] as Payload,
  ];

  const wired: Topic<Payload> = Object.assign(topic, {
    [SUBSCRIBERS]: [] as Fold[],
  });

  return wired;
};
