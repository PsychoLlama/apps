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
/// A tagged union: most rows are `text`, but date/time fields cross as a
/// raw epoch (`dateTime`) so the host formats them with `Intl` in the
/// viewer's locale and timezone rather than us baking a string here.
#[derive(Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum Detail {
    /// A plain label/value row, e.g. `{ label: "Network", value: "home" }`.
    Text { label: String, value: String },
    /// A timestamp row carrying epoch millis (UTC) for the host to format.
    /// `allDay` marks date-only events, rendered without a clock time.
    #[serde(rename_all = "camelCase")]
    DateTime {
        label: String,
        epoch_millis: i64,
        all_day: bool,
    },
}

impl Detail {
    fn text(label: &str, value: &str) -> Self {
        Detail::Text {
            label: label.to_owned(),
            value: value.to_owned(),
        }
    }
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
            push(&mut rows, "URL", u.getURI());
            push(&mut rows, "Title", u.getTitle());
            "url"
        }
        ParsedClientResult::EmailResult(e) => {
            push_each(&mut rows, "To", e.getTos());
            push_each(&mut rows, "Cc", e.getCCs());
            push_each(&mut rows, "Bcc", e.getBCCs());
            push(&mut rows, "Subject", e.getSubject());
            push(&mut rows, "Body", e.getBody());
            "email"
        }
        ParsedClientResult::SMSResult(s) => {
            push_each(&mut rows, "Number", s.getNumbers());
            push(&mut rows, "Subject", s.getSubject());
            push(&mut rows, "Message", s.getBody());
            "sms"
        }
        ParsedClientResult::GeoResult(g) => {
            rows.push(Detail::text("Latitude", &g.getLatitude().to_string()));
            rows.push(Detail::text("Longitude", &g.getLongitude().to_string()));
            if g.getAltitude() != 0.0 {
                rows.push(Detail::text("Altitude", &format!("{} m", g.getAltitude())));
            }
            push(&mut rows, "Query", g.getQuery());
            "geo"
        }
        ParsedClientResult::TelResult(t) => {
            push(&mut rows, "Phone", t.getNumber());
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
            push(&mut rows, "Organizer", c.getOrganizer());
            push_each(&mut rows, "Attendee", c.getAttendees());
            push(&mut rows, "Description", c.getDescription());
            "calendar"
        }
        ParsedClientResult::AddressBookResult(a) => {
            push_each(&mut rows, "Name", a.getNames());
            push_each(&mut rows, "Nickname", a.getNicknames());
            push(&mut rows, "Title", a.getTitle());
            push(&mut rows, "Organization", a.getOrg());
            push_each(&mut rows, "Phone", a.getPhoneNumbers());
            push_each(&mut rows, "Email", a.getEmails());
            push_each(&mut rows, "Address", a.getAddresses());
            push_each(&mut rows, "URL", a.getURLs());
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

/// Push a single row, skipping empties so absent fields don't render.
fn push(rows: &mut Vec<Detail>, label: &str, value: &str) {
    if !value.is_empty() {
        rows.push(Detail::text(label, value));
    }
}

/// Push one row per non-empty value, repeating the label (e.g. a contact
/// with several phone numbers becomes several "Phone" rows).
fn push_each(rows: &mut Vec<Detail>, label: &str, values: &[String]) {
    for value in values {
        if !value.is_empty() {
            rows.push(Detail::text(label, value));
        }
    }
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
