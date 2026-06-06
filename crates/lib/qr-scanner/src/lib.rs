//! Wasm bindings over [`rxing`] (a pure-Rust ZXing port) for decoding
//! QR codes from raw image data in the browser.
//!
//! Typical flow from the host: take a canvas `ImageData`, hand its RGBA
//! bytes to [`rgba_to_luma`], then pass the luma buffer to [`decode`].

use rxing::helpers;
use wasm_bindgen::prelude::*;

/// Install the panic hook once at module load so a Rust panic surfaces
/// as a readable `console.error` instead of an opaque `unreachable`
/// trap. No-op unless the `console_error_panic_hook` feature is on.
#[wasm_bindgen(start)]
fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// A successfully decoded barcode.
#[wasm_bindgen]
pub struct Scan {
    text: String,
    format: String,
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
}

/// Convert a canvas `ImageData.data` RGBA buffer into the 8-bit
/// luminance buffer rxing's readers expect.
///
/// Uses the same integer-approximated `0.299R + 0.587G + 0.114B`
/// weighting rxing uses internally, and treats fully transparent pixels
/// as white. The returned buffer is `width × height` bytes.
#[wasm_bindgen]
pub fn rgba_to_luma(rgba: &[u8]) -> Vec<u8> {
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

/// Decode the first barcode in a `width × height` 8-bit luminance buffer
/// (see [`rgba_to_luma`]). Returns `None` when nothing decodes — the
/// common "no code in frame" case, not an error.
#[wasm_bindgen]
pub fn decode(luma: &[u8], width: u32, height: u32) -> Option<Scan> {
    helpers::detect_in_luma(luma.to_vec(), width, height, None)
        .ok()
        .map(|r| Scan {
            text: r.getText().to_owned(),
            format: format!("{:?}", r.getBarcodeFormat()),
        })
}
