/**
 * Human-readable names for endpoints. A beam endpoint is a 32-byte public key
 * rendered as hex — unreadable, unmemorable, and impossible to tell apart at a
 * glance. Every endpoint therefore gets a generated two-word name derived from
 * its key, which is what the address book shows until someone renames it.
 *
 * The derivation is pure and deterministic, so both halves of a pair compute
 * the same name for the same endpoint without exchanging anything. It is not
 * unique: the word lists are small enough that names collide, which is why the
 * address book falls back to {@link keyFragment} to tell two same-named
 * contacts apart.
 */

/**
 * The leading half of a generated name. Concrete and neutral — nothing here
 * should read as a judgement about the device on the other end.
 */
const ADJECTIVES = [
  'amber',
  'arctic',
  'ashen',
  'autumn',
  'azure',
  'bold',
  'brass',
  'bright',
  'calm',
  'cedar',
  'citrus',
  'clay',
  'copper',
  'coral',
  'crisp',
  'dawn',
  'deep',
  'drifting',
  'dusk',
  'eager',
  'ember',
  'fleet',
  'frost',
  'gentle',
  'gilded',
  'glass',
  'golden',
  'hazy',
  'humble',
  'idle',
  'indigo',
  'ivory',
  'jade',
  'keen',
  'lively',
  'lunar',
  'marble',
  'mellow',
  'mint',
  'misty',
  'noble',
  'olive',
  'opal',
  'patient',
  'pearl',
  'plum',
  'polar',
  'quiet',
  'rapid',
  'rosy',
  'rugged',
  'sable',
  'sage',
  'sandy',
  'silent',
  'silver',
  'slate',
  'solar',
  'steady',
  'sunny',
  'teal',
  'tidal',
  'velvet',
  'wandering',
] as const;

/** The trailing half of a generated name. Short, common, easy to say aloud. */
const NOUNS = [
  'anchor',
  'arrow',
  'aspen',
  'basin',
  'beacon',
  'birch',
  'bloom',
  'bridge',
  'brook',
  'canyon',
  'cedar',
  'cinder',
  'cliff',
  'comet',
  'compass',
  'coral',
  'cove',
  'crest',
  'delta',
  'dune',
  'ember',
  'falcon',
  'fern',
  'ferry',
  'field',
  'forest',
  'garden',
  'glade',
  'grove',
  'harbor',
  'heron',
  'hollow',
  'island',
  'lantern',
  'ledge',
  'maple',
  'meadow',
  'mesa',
  'moth',
  'orbit',
  'otter',
  'peak',
  'pebble',
  'pine',
  'prairie',
  'quarry',
  'ridge',
  'river',
  'sparrow',
  'spire',
  'spring',
  'summit',
  'thicket',
  'tide',
  'timber',
  'trail',
  'valley',
  'vector',
  'willow',
  'window',
  'wing',
  'wren',
] as const;

/**
 * FNV-1a over the string's char codes. Chosen for being tiny, dependency-free,
 * and stable across engines — nothing here is security-sensitive, since the
 * name is a display convenience derived from an already-public key.
 * `Math.imul` keeps the multiply in 32-bit integer space rather than drifting
 * into float precision.
 */
const hash = (value: string): number => {
  let digest = 0x811c9dc5;

  for (let index = 0; index < value.length; index++) {
    digest ^= value.charCodeAt(index);
    digest = Math.imul(digest, 0x01000193);
  }

  return digest >>> 0;
};

/**
 * Capitalize each word of a generated name. The word lists are stored
 * lowercase so they read as data; the name reads as a name.
 */
const titleCase = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

/**
 * The generated name for an endpoint, like `Amber Falcon`. Each half is drawn
 * from its own salted hash so the two words vary independently — a single
 * hash split into two fields would tie the noun's low bits to the adjective's.
 */
export const generateLabel = (endpointId: string): string => {
  const adjective =
    ADJECTIVES[hash(`adjective/${endpointId}`) % ADJECTIVES.length];
  const noun = NOUNS[hash(`noun/${endpointId}`) % NOUNS.length];

  return `${titleCase(adjective)} ${titleCase(noun)}`;
};

/**
 * Characters of the endpoint key shown when a name isn't enough to tell two
 * contacts apart. Six hex characters is 24 bits — plenty to disambiguate an
 * address book, short enough to read off a screen.
 */
const FRAGMENT_LENGTH = 6;

/**
 * The leading characters of an endpoint's key, for disambiguating contacts
 * that render under the same name. A fragment is a hint, not an identity
 * check: it's a prefix of a public key, so it narrows the field rather than
 * proving who's on the other end.
 */
export const keyFragment = (endpointId: string): string =>
  endpointId.slice(0, FRAGMENT_LENGTH);
