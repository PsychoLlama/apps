//! The encode (generate) surface: turn text into a QR code's raw module
//! grid and hand it to the host, which renders the SVG with its own
//! design tokens.
//!
//! This mirrors [`decode`](crate::decode) — structured data crosses the
//! wasm boundary, never pixels. rxing's [`QRCodeWriter`] yields a
//! `BitMatrix` of modules; we flatten it to a byte-per-module grid so an
//! SVG renderer can draw one `<rect>` (or path segment) per dark cell.

use rxing::qrcode::QRCodeWriter;
use rxing::{BarcodeFormat, Writer};
use wasm_bindgen::prelude::*;

/// A generated QR code as its raw module grid, ready for the host to
/// render. Carries no pixels — just which cells are dark.
#[wasm_bindgen]
pub struct QrCode {
    size: u32,
    modules: Vec<u8>,
}

#[wasm_bindgen]
impl QrCode {
    /// Modules per side, quiet zone included. The grid is `size × size`.
    #[wasm_bindgen(getter)]
    pub fn size(&self) -> u32 {
        self.size
    }

    /// Row-major grid, one byte per module: 1 = dark, 0 = light.
    #[wasm_bindgen(getter)]
    pub fn modules(&self) -> Vec<u8> {
        self.modules.clone()
    }
}

/// Encode `text` into a QR module grid. Errors (empty/too-long input)
/// throw on the JS side — unlike a decode miss, a failed encode is a real
/// error, not an expected "nothing here" outcome.
///
/// Passing `0, 0` for the writer's width/height asks for the native grid:
/// one cell per module plus the default 4-module quiet zone, with no pixel
/// scaling — exactly the shape an SVG renderer wants.
#[wasm_bindgen]
pub fn encode(text: &str) -> Result<QrCode, JsError> {
    // `JsError::new` traps off the wasm target, so the error mapping is
    // the only wasm-bound step — the grid work lives in `encode_grid`,
    // which the native unit tests can exercise directly.
    encode_grid(text).map_err(|e| JsError::new(&e))
}

/// Encode `text` into a [`QrCode`], returning a plain `String` on failure
/// so it stays callable off the wasm target (where a `JsError` would trap).
fn encode_grid(text: &str) -> Result<QrCode, String> {
    let matrix = QRCodeWriter
        .encode(text, &BarcodeFormat::QR_CODE, 0, 0)
        .map_err(|e| e.to_string())?;

    let size = matrix.getWidth();
    let mut modules = Vec::with_capacity((size * size) as usize);
    for y in 0..size {
        for x in 0..size {
            modules.push(matrix.get(x, y) as u8);
        }
    }

    Ok(QrCode { size, modules })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_a_short_payload_to_a_stable_grid() {
        let code = encode_grid("https://example.com").expect("should encode");
        // A version-2 symbol: 25 modules + the 4-module quiet zone on each
        // side = 33 per side, and the grid is exactly that squared.
        assert_eq!(code.size, 33);
        assert_eq!(code.modules.len(), (code.size * code.size) as usize);
        // Every cell is a strict 0/1 flag.
        assert!(code.modules.iter().all(|&m| m <= 1));
    }

    #[test]
    fn empty_input_errors() {
        assert!(encode_grid("").is_err());
    }
}
