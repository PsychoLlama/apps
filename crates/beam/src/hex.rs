//! Ids as the host sees them: lowercase hex.

use std::fmt::Write;

/// Bytes as lowercase hex.
pub(crate) fn encode(bytes: &[u8]) -> String {
    bytes.iter().fold(String::new(), |mut text, byte| {
        let _ = write!(text, "{byte:02x}");
        text
    })
}

/// Hex back to bytes, or `None` if it isn't hex.
pub(crate) fn decode(text: &str) -> Option<Vec<u8>> {
    if !text.len().is_multiple_of(2) || !text.is_ascii() {
        return None;
    }

    (0..text.len())
        .step_by(2)
        .map(|at| u8::from_str_radix(&text[at..at + 2], 16).ok())
        .collect()
}

/// Hex back to exactly `N` bytes.
pub(crate) fn decode_array<const N: usize>(text: &str) -> Option<[u8; N]> {
    decode(text)?.try_into().ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips() {
        let bytes = [0x00, 0x0f, 0xa0, 0xff];
        assert_eq!(encode(&bytes), "000fa0ff");
        assert_eq!(decode("000fa0ff"), Some(bytes.to_vec()));
        assert_eq!(decode_array::<4>("000fa0ff"), Some(bytes));
    }

    #[test]
    fn refuses_what_is_not_hex() {
        assert_eq!(decode("abc"), None);
        assert_eq!(decode("zz"), None);
        assert_eq!(decode("éé"), None);
        assert_eq!(decode_array::<2>("000fa0ff"), None);
    }
}
