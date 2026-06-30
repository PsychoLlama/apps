//! Wasm bindings over [`rxing`] (a pure-Rust ZXing port) for decoding
//! QR codes from raw image data in the browser.
//!
//! Typical flow from the host: take a canvas `ImageData` and hand its
//! RGBA bytes straight to [`decode`] — the RGBA → luma conversion the
//! readers need happens internally, so the host never shuttles an
//! intermediate luma buffer across the wasm boundary.

use rxing::client::result::{ParsedClientResult, parseRXingResult};
use rxing::helpers;
use serde::Serialize;
use wasm_bindgen::prelude::*;

/// Install the panic hook once at module load so a Rust panic surfaces
/// as a readable `console.error` instead of an opaque `unreachable`
/// trap. No-op unless the `console_error_panic_hook` feature is on.
#[wasm_bindgen(start)]
fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// One row of a decoded code's parsed details, serialized to a plain JS
/// object so it crosses the wasm boundary as structured-clone-safe data.
///
/// A tagged union on `type`. The tag is the *semantic kind of the value*,
/// taken straight from the field rxing's parser populated — so it's a
/// fact, not a guess the host has to re-derive by sniffing the string. It
/// drives how the host resolves the value to a link: `link` → the URL
/// itself, `email` → `mailto:`, `phone` → `tel:`, `sms` → `sms:`. `geo`
/// is a hint only (coordinates render as plain text; no `geo:` link, whose
/// support is patchy). `dateTime` crosses as a raw epoch so the host
/// formats it with `Intl` in the viewer's locale and timezone rather than
/// us baking a string here. `text` is the catch-all for opaque values.
#[derive(Serialize)]
#[cfg_attr(test, derive(Debug, PartialEq))]
#[serde(tag = "type", rename_all = "camelCase")]
enum Detail {
    /// A plain, unlinkable label/value row, e.g. a Wi-Fi password.
    Text { label: String, value: String },
    /// A web URL — the host links it (`http(s)` only, after its own safety
    /// check), e.g. `{ label: "URL", value: "https://example.com" }`.
    Link { label: String, value: String },
    /// An email address — the host links it as `mailto:`.
    Email { label: String, value: String },
    /// A phone number — the host links it as `tel:` (opens the dialer).
    Phone { label: String, value: String },
    /// An SMS-capable number — the host links it as `sms:` (opens messaging).
    Sms { label: String, value: String },
    /// A geographic coordinate. A semantic hint only; the host renders the
    /// value as plain text rather than a (poorly-supported) `geo:` link.
    Geo { label: String, value: String },
    /// A timestamp row carrying epoch millis (UTC) for the host to format.
    /// `allDay` marks date-only events, rendered without a clock time.
    #[serde(rename_all = "camelCase")]
    DateTime {
        label: String,
        epoch_millis: i64,
        all_day: bool,
    },
}

// Constructors for the labeled-value variants (everything but `DateTime`),
// so the `push*` helpers can take one as a `fn(&str, &str) -> Detail` and
// stamp each row with the type rxing's field already implies.
macro_rules! labeled_value_ctors {
    ($($ctor:ident => $variant:ident),+ $(,)?) => {
        impl Detail {
            $(
                fn $ctor(label: &str, value: &str) -> Self {
                    Detail::$variant {
                        label: label.to_owned(),
                        value: value.to_owned(),
                    }
                }
            )+
        }
    };
}

labeled_value_ctors! {
    text => Text,
    link => Link,
    email => Email,
    phone => Phone,
    sms => Sms,
    geo => Geo,
}

/// A successfully decoded barcode.
#[wasm_bindgen]
pub struct Scan {
    text: String,
    format: String,
    kind: &'static str,
    details: Vec<Detail>,
}

#[wasm_bindgen]
impl Scan {
    /// The decoded payload as text (UTF-8, charset-decoded by rxing).
    #[wasm_bindgen(getter)]
    pub fn text(&self) -> String {
        self.text.clone()
    }

    /// The symbology rxing matched, e.g. `"QR_CODE"`.
    #[wasm_bindgen(getter)]
    pub fn format(&self) -> String {
        self.format.clone()
    }

    /// The kind of payload rxing's result parser recognized, e.g.
    /// `"wifi"`, `"url"`, `"contact"`, falling back to `"text"`. See the
    /// `ScanKind` union in `index.d.ts` for the full set.
    #[wasm_bindgen(getter)]
    pub fn kind(&self) -> String {
        self.kind.to_owned()
    }

    /// The parsed payload as an ordered list of `Detail` rows, ready to
    /// render as a description list. Empty for opaque text.
    #[wasm_bindgen(getter)]
    pub fn details(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.details).unwrap_or(JsValue::NULL)
    }
}

/// Decode the first barcode in a `width × height` canvas
/// `ImageData.data` RGBA buffer. Returns `None` when nothing decodes —
/// the common "no code in frame" case, not an error.
///
/// The RGBA → luma conversion the readers need runs internally, so the
/// host hands over the raw frame bytes and never materializes an
/// intermediate luma buffer of its own.
#[wasm_bindgen]
pub fn decode(rgba: &[u8], width: u32, height: u32) -> Option<Scan> {
    let result = helpers::detect_in_luma(rgba_to_luma(rgba), width, height, None).ok()?;
    let (kind, details) = parse_details(&parseRXingResult(&result));
    Some(Scan {
        text: result.getText().to_owned(),
        format: format!("{:?}", result.getBarcodeFormat()),
        kind,
        details,
    })
}

/// Run rxing's result parser over a decoded code and flatten the typed
/// record it returns into a `(kind, rows)` pair: a short discriminant and
/// an ordered list of human-readable label/value rows. Empty/absent
/// fields are dropped so the rows render cleanly as a description list.
fn parse_details(parsed: &ParsedClientResult) -> (&'static str, Vec<Detail>) {
    let mut rows = Vec::new();
    let kind = match parsed {
        ParsedClientResult::WiFiResult(w) => {
            push(&mut rows, "Network", w.getSsid());
            push(&mut rows, "Security", w.getNetworkEncryption());
            push(&mut rows, "Password", w.getPassword());
            if w.isHidden() {
                rows.push(Detail::text("Hidden", "Yes"));
            }
            push(&mut rows, "Identity", w.getIdentity());
            push(&mut rows, "Anonymous identity", w.getAnonymousIdentity());
            push(&mut rows, "EAP method", w.getEapMethod());
            push(&mut rows, "Phase 2 method", w.getPhase2Method());
            "wifi"
        }
        ParsedClientResult::URIResult(u) => {
            push_as(&mut rows, Detail::link, "URL", u.getURI());
            push(&mut rows, "Title", u.getTitle());
            "url"
        }
        ParsedClientResult::EmailResult(e) => {
            push_each_as(&mut rows, Detail::email, "To", e.getTos());
            push_each_as(&mut rows, Detail::email, "Cc", e.getCCs());
            push_each_as(&mut rows, Detail::email, "Bcc", e.getBCCs());
            push(&mut rows, "Subject", e.getSubject());
            push(&mut rows, "Body", e.getBody());
            "email"
        }
        ParsedClientResult::SMSResult(s) => {
            push_each_as(&mut rows, Detail::sms, "Number", s.getNumbers());
            push(&mut rows, "Subject", s.getSubject());
            push(&mut rows, "Message", s.getBody());
            "sms"
        }
        ParsedClientResult::GeoResult(g) => {
            rows.push(Detail::geo("Latitude", &g.getLatitude().to_string()));
            rows.push(Detail::geo("Longitude", &g.getLongitude().to_string()));
            if g.getAltitude() != 0.0 {
                rows.push(Detail::text("Altitude", &format!("{} m", g.getAltitude())));
            }
            push(&mut rows, "Query", g.getQuery());
            "geo"
        }
        ParsedClientResult::TelResult(t) => {
            push_as(&mut rows, Detail::phone, "Phone", t.getNumber());
            push(&mut rows, "Title", t.getTitle());
            "tel"
        }
        ParsedClientResult::CalendarEventResult(c) => {
            push(&mut rows, "Summary", c.getSummary());
            push_timestamp(
                &mut rows,
                "Starts",
                c.getStartTimestamp(),
                c.isStartAllDay(),
            );
            push_timestamp(&mut rows, "Ends", c.getEndTimestamp(), c.isEndAllDay());
            push(&mut rows, "Location", c.getLocation());
            // rxing strips the `mailto:` from `ORGANIZER`/`ATTENDEE`, so
            // these arrive as bare addresses — type them so they link.
            push_as(&mut rows, Detail::email, "Organizer", c.getOrganizer());
            push_each_as(&mut rows, Detail::email, "Attendee", c.getAttendees());
            push(&mut rows, "Description", c.getDescription());
            "calendar"
        }
        ParsedClientResult::AddressBookResult(a) => {
            push_each(&mut rows, "Name", a.getNames());
            push_each(&mut rows, "Nickname", a.getNicknames());
            push(&mut rows, "Title", a.getTitle());
            push(&mut rows, "Organization", a.getOrg());
            push_each_as(&mut rows, Detail::phone, "Phone", a.getPhoneNumbers());
            push_each_as(&mut rows, Detail::email, "Email", a.getEmails());
            push_each(&mut rows, "Address", a.getAddresses());
            push_each_as(&mut rows, Detail::link, "URL", a.getURLs());
            push(&mut rows, "Birthday", a.getBirthday());
            push(&mut rows, "Note", a.getNote());
            "contact"
        }
        ParsedClientResult::ISBNResult(i) => {
            push(&mut rows, "ISBN", i.getISBN());
            "isbn"
        }
        ParsedClientResult::VINResult(v) => {
            push(&mut rows, "VIN", v.getVIN());
            push(&mut rows, "Country", v.getCountryCode());
            if v.getModelYear() != 0 {
                rows.push(Detail::text("Model year", &v.getModelYear().to_string()));
            }
            "vin"
        }
        ParsedClientResult::ExpandedProductResult(p) => {
            push(&mut rows, "Product ID", p.getProductID());
            "product"
        }
        // Plain text and anything rxing couldn't classify carry no
        // structured rows — the raw payload is shown on its own.
        ParsedClientResult::TextResult(_) | ParsedClientResult::Other(_) => "text",
    };
    (kind, rows)
}

/// Push a single row of a given variant, skipping empties so absent fields
/// don't render. `make` is the row constructor (`Detail::link`,
/// `Detail::email`, …), letting the caller stamp the value's semantic type.
fn push_as(rows: &mut Vec<Detail>, make: fn(&str, &str) -> Detail, label: &str, value: &str) {
    if !value.is_empty() {
        rows.push(make(label, value));
    }
}

/// Push one row per non-empty value, repeating the label (e.g. a contact
/// with several phone numbers becomes several "Phone" rows).
fn push_each_as(
    rows: &mut Vec<Detail>,
    make: fn(&str, &str) -> Detail,
    label: &str,
    values: &[String],
) {
    for value in values {
        if !value.is_empty() {
            rows.push(make(label, value));
        }
    }
}

/// Push a plain `text` row, skipping empties. Shorthand for the common
/// untyped case; see [`push_as`] for typed rows.
fn push(rows: &mut Vec<Detail>, label: &str, value: &str) {
    push_as(rows, Detail::text, label, value);
}

/// Push one plain `text` row per non-empty value; see [`push_each_as`].
fn push_each(rows: &mut Vec<Detail>, label: &str, values: &[String]) {
    push_each_as(rows, Detail::text, label, values);
}

/// Push a timestamp row, skipping unset times (`-1`) so absent dates
/// don't render. rxing reports calendar times in epoch *seconds*; we scale
/// to milliseconds here so the host gets the JS-native unit and can format
/// it with `Intl` in the viewer's locale and timezone.
fn push_timestamp(rows: &mut Vec<Detail>, label: &str, seconds: i64, all_day: bool) {
    if seconds >= 0 {
        rows.push(Detail::DateTime {
            label: label.to_owned(),
            epoch_millis: seconds * 1000,
            all_day,
        });
    }
}

/// Convert a canvas `ImageData.data` RGBA buffer into the 8-bit
/// luminance buffer rxing's readers expect (`width × height` bytes).
///
/// Uses the same integer-approximated `0.299R + 0.587G + 0.114B`
/// weighting rxing uses internally, and treats fully transparent pixels
/// as white. Kept internal — the wasm surface exposes only [`decode`],
/// which folds this conversion in.
fn rgba_to_luma(rgba: &[u8]) -> Vec<u8> {
    let mut luma = Vec::with_capacity(rgba.len() / 4);
    for px in rgba.chunks_exact(4) {
        let (r, g, b, a) = (px[0] as u32, px[1] as u32, px[2] as u32, px[3]);
        luma.push(if a == 0 {
            0xFF
        } else {
            // `0x200` rounds; `>> 10` divides by 1024 (≈ the weights).
            ((306 * r + 601 * g + 117 * b + 0x200) >> 10) as u8
        });
    }
    luma
}

#[cfg(test)]
mod tests {
    use super::*;
    use rxing::{BarcodeFormat, RXingResult};

    /// Run a raw payload through rxing's result parser and our flattening,
    /// exactly as [`decode`] does — minus the image-decode step. Lets us
    /// assert the `(kind, rows)` mapping against real parser output.
    fn parse(text: &str) -> (&'static str, Vec<Detail>) {
        let result = RXingResult::new(text, Vec::new(), Vec::new(), BarcodeFormat::QR_CODE);
        parse_details(&parseRXingResult(&result))
    }

    #[test]
    fn luma_treats_transparent_pixels_as_white() {
        // Alpha 0 short-circuits to 0xFF regardless of the color channels.
        assert_eq!(rgba_to_luma(&[10, 20, 30, 0]), vec![0xFF]);
    }

    #[test]
    fn luma_maps_opaque_black_and_white_to_the_extremes() {
        assert_eq!(rgba_to_luma(&[0, 0, 0, 255]), vec![0x00]);
        assert_eq!(rgba_to_luma(&[255, 255, 255, 255]), vec![0xFF]);
    }

    #[test]
    fn luma_weights_green_above_red_above_blue() {
        // The channel weighting means equal-intensity primaries don't
        // produce equal luma: green is brightest, blue darkest.
        let red = rgba_to_luma(&[255, 0, 0, 255])[0];
        let green = rgba_to_luma(&[0, 255, 0, 255])[0];
        let blue = rgba_to_luma(&[0, 0, 255, 255])[0];
        assert!(green > red && red > blue, "{green} > {red} > {blue}");
    }

    #[test]
    fn luma_emits_one_byte_per_rgba_pixel() {
        let two_pixels = [0, 0, 0, 255, 255, 255, 255, 255];
        assert_eq!(rgba_to_luma(&two_pixels), vec![0x00, 0xFF]);
    }

    #[test]
    fn parses_wifi_skipping_absent_fields() {
        let (kind, rows) = parse("WIFI:T:WPA;S:mynet;P:secret;H:true;;");
        assert_eq!(kind, "wifi");
        // SSID/security/password/hidden are present; the EAP fields aren't,
        // so they're dropped rather than rendered as empty rows.
        assert_eq!(
            rows,
            vec![
                Detail::text("Network", "mynet"),
                Detail::text("Security", "WPA"),
                Detail::text("Password", "secret"),
                Detail::text("Hidden", "Yes"),
            ]
        );
    }

    #[test]
    fn parses_url_as_a_typed_link() {
        let (kind, rows) = parse("https://example.com");
        assert_eq!(kind, "url");
        assert_eq!(rows, vec![Detail::link("URL", "https://example.com")]);
    }

    #[test]
    fn parses_mailto_as_a_typed_email() {
        let (kind, rows) = parse("mailto:hi@example.com");
        assert_eq!(kind, "email");
        assert_eq!(rows[0], Detail::email("To", "hi@example.com"));
    }

    #[test]
    fn parses_tel_as_a_typed_phone() {
        let (kind, rows) = parse("tel:+15551234567");
        assert_eq!(kind, "tel");
        assert_eq!(rows[0], Detail::phone("Phone", "+15551234567"));
    }

    #[test]
    fn parses_sms_as_a_typed_sms_row() {
        let (kind, rows) = parse("smsto:+15551234567:");
        assert_eq!(kind, "sms");
        assert_eq!(rows[0], Detail::sms("Number", "+15551234567"));
    }

    #[test]
    fn parses_geo_coordinates() {
        let (kind, rows) = parse("geo:36.1,-115.2");
        assert_eq!(kind, "geo");
        assert_eq!(rows[0], Detail::geo("Latitude", "36.1"));
        assert_eq!(rows[1], Detail::geo("Longitude", "-115.2"));
    }

    #[test]
    fn opaque_text_carries_no_structured_rows() {
        let (kind, rows) = parse("just some opaque text");
        assert_eq!(kind, "text");
        assert!(rows.is_empty());
    }

    #[test]
    fn timestamp_rows_scale_seconds_to_millis() {
        let mut rows = Vec::new();
        push_timestamp(&mut rows, "Starts", 1_700_000_000, false);
        assert_eq!(
            rows,
            vec![Detail::DateTime {
                label: "Starts".to_owned(),
                epoch_millis: 1_700_000_000_000,
                all_day: false,
            }]
        );
    }

    #[test]
    fn timestamp_rows_skip_unset_times() {
        // rxing reports an absent calendar time as -1; it must not render.
        let mut rows = Vec::new();
        push_timestamp(&mut rows, "Ends", -1, false);
        assert!(rows.is_empty());
    }
}
