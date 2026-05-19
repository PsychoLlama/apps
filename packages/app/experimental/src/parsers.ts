/**
 * Parse a barcode's raw payload into a typed structure.
 *
 * Recognizes the QR conventions in the wild: WIFI:, MATMSG:, SMSTO:,
 * BEGIN:VCARD, GEO:, plus the standard URL schemes (`https`, `mailto`,
 * `sms`, `tel`, `geo`). Anything that doesn't match falls back to
 * `{ kind: 'text' }`.
 */

/** Typed discriminated union of supported barcode payloads. */
export type ParsedPayload =
  | UrlPayload
  | EmailPayload
  | SmsPayload
  | TelPayload
  | WifiPayload
  | GeoPayload
  | VcardPayload
  | TextPayload;

/** Generic URL — anything `new URL()` accepts that isn't a specialized scheme. */
export interface UrlPayload {
  kind: 'url';
  href: string;
  protocol: string;
}

/** Email composition target — from `mailto:` or QR `MATMSG:`. */
export interface EmailPayload {
  kind: 'email';
  to: string;
  subject: string | undefined;
  body: string | undefined;
}

/** SMS / text-message composition target — from `sms:` / `SMSTO:`. */
export interface SmsPayload {
  kind: 'sms';
  phone: string;
  body: string | undefined;
}

/** Telephone number — from `tel:` / `TEL:`. */
export interface TelPayload {
  kind: 'tel';
  phone: string;
}

/** Wi-Fi credentials — from QR `WIFI:` join string. */
export interface WifiPayload {
  kind: 'wifi';
  ssid: string | undefined;
  security: string | undefined;
  password: string | undefined;
  hidden: boolean | undefined;
}

/** Geolocation pin — from `geo:` / `GEO:`. */
export interface GeoPayload {
  kind: 'geo';
  latitude: number;
  longitude: number;
}

/** A single vCard field — preserved key/value pair. */
export interface VcardField {
  key: string;
  value: string;
}

/** vCard contact card — from a `BEGIN:VCARD` / `END:VCARD` block. */
export interface VcardPayload {
  kind: 'vcard';
  fields: ReadonlyArray<VcardField>;
}

/** Unstructured fallback — anything we couldn't classify. */
export interface TextPayload {
  kind: 'text';
  text: string;
}

/** Classify a raw barcode payload into the most specific variant we recognize. */
export const parsePayload = (raw: string): ParsedPayload => {
  if (raw.startsWith('WIFI:')) return parseWifi(raw);
  if (raw.startsWith('MATMSG:')) return parseMatMsg(raw);
  if (raw.startsWith('SMSTO:')) return parseSmsto(raw);
  if (raw.startsWith('BEGIN:VCARD')) return parseVcard(raw);
  if (raw.startsWith('GEO:')) return parseGeo(raw);
  if (raw.startsWith('TEL:')) return { kind: 'tel', phone: raw.slice(4) };

  try {
    const url = new URL(raw);
    return classifyUrl(url, raw);
  } catch {
    return { kind: 'text', text: raw };
  }
};

const classifyUrl = (url: URL, raw: string): ParsedPayload => {
  switch (url.protocol) {
    case 'mailto:': {
      const params = url.searchParams;
      return {
        kind: 'email',
        to: decodeURIComponent(url.pathname),
        subject: params.get('subject') ?? undefined,
        body: params.get('body') ?? undefined,
      };
    }
    case 'sms:':
    case 'smsto:': {
      const params = url.searchParams;
      return {
        kind: 'sms',
        phone: url.pathname,
        body: params.get('body') ?? undefined,
      };
    }
    case 'tel:':
      return { kind: 'tel', phone: url.pathname };
    case 'geo:': {
      const [latStr, lonStr] = url.pathname.split(',', 2);
      const latitude = Number(latStr);
      const longitude = Number(lonStr);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return { kind: 'text', text: raw };
      }
      return { kind: 'geo', latitude, longitude };
    }
    default:
      return { kind: 'url', href: url.toString(), protocol: url.protocol };
  }
};

// Split on `delim` while honoring `\`-escapes. Consuming `\x` yields `x` so
// the returned tokens are already unescaped.
const splitEscaped = (input: string, delim: string): Array<string> => {
  const out: Array<string> = [];
  let current = '';
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (char === '\\' && index + 1 < input.length) {
      current += input[index + 1];
      index += 2;
      continue;
    }
    if (char === delim) {
      out.push(current);
      current = '';
      index += 1;
      continue;
    }
    current += char;
    index += 1;
  }
  out.push(current);
  return out;
};

const parseWifi = (raw: string): WifiPayload => {
  const inner = raw.slice(5).replace(/;;\s*$/, '');
  const payload: WifiPayload = {
    kind: 'wifi',
    ssid: undefined,
    security: undefined,
    password: undefined,
    hidden: undefined,
  };
  for (const part of splitEscaped(inner, ';')) {
    if (!part) continue;
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    const key = part.slice(0, colon);
    const value = part.slice(colon + 1);
    switch (key) {
      case 'S':
        payload.ssid = value;
        break;
      case 'T':
        payload.security = value;
        break;
      case 'P':
        payload.password = value;
        break;
      case 'H':
        payload.hidden = value.toLowerCase() === 'true';
        break;
    }
  }
  return payload;
};

const parseMatMsg = (raw: string): EmailPayload => {
  const inner = raw.slice(7).replace(/;;\s*$/, '');
  const payload: EmailPayload = {
    kind: 'email',
    to: '',
    subject: undefined,
    body: undefined,
  };
  for (const part of splitEscaped(inner, ';')) {
    if (!part) continue;
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    const key = part.slice(0, colon);
    const value = part.slice(colon + 1);
    switch (key) {
      case 'TO':
        payload.to = value;
        break;
      case 'SUB':
        payload.subject = value;
        break;
      case 'BODY':
        payload.body = value;
        break;
    }
  }
  return payload;
};

const parseSmsto = (raw: string): SmsPayload => {
  const rest = raw.slice(6);
  const sep = rest.indexOf(':');
  if (sep === -1) return { kind: 'sms', phone: rest, body: undefined };
  return {
    kind: 'sms',
    phone: rest.slice(0, sep),
    body: rest.slice(sep + 1),
  };
};

const parseGeo = (raw: string): GeoPayload | TextPayload => {
  const [latStr, lonStr] = raw.slice(4).split(',', 2);
  const latitude = Number(latStr);
  const longitude = Number(lonStr);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { kind: 'text', text: raw };
  }
  return { kind: 'geo', latitude, longitude };
};

const parseVcard = (raw: string): VcardPayload => {
  const fields: Array<VcardField> = [];
  for (const line of raw.split(/\r?\n/)) {
    if (
      line.startsWith('BEGIN:') ||
      line.startsWith('END:') ||
      line.startsWith('VERSION:')
    ) {
      continue;
    }
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const keyPart = line.slice(0, colon);
    const value = line.slice(colon + 1).trim();
    if (!value) continue;
    // Strip vCard property parameters like `TEL;TYPE=CELL`.
    const semi = keyPart.indexOf(';');
    const key = semi === -1 ? keyPart : keyPart.slice(0, semi);
    fields.push({ key, value });
  }
  return { kind: 'vcard', fields };
};
