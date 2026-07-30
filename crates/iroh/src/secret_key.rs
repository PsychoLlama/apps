//! Endpoint secret keys as the host hands them over.
//!
//! The bytes arrive from JS as a plain array with no length guarantee, so
//! this is where that gets checked. Deliberately clear of [`iroh`] — which
//! only builds on wasm — so the check is exercised by the native tests
//! rather than only in a browser.

/// Bytes in an endpoint secret key: an ed25519 private scalar.
pub const SECRET_KEY_BYTES: usize = 32;

/// A host-supplied secret key that wasn't the right size.
#[derive(Debug, PartialEq, Eq)]
pub struct WrongKeyLength {
    /// How many bytes actually arrived.
    pub received: usize,
}

impl core::fmt::Display for WrongKeyLength {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(
            formatter,
            "a secret key must be exactly {SECRET_KEY_BYTES} bytes, got {}",
            self.received
        )
    }
}

/// Check a host-supplied secret key and hand back the fixed-size array
/// [`iroh::SecretKey`] wants.
///
/// Length is the only thing checked: every 32-byte string is a valid
/// ed25519 scalar, so there's no such thing as malformed-but-right-sized
/// key material to reject.
pub fn parse_secret_key(bytes: &[u8]) -> Result<[u8; SECRET_KEY_BYTES], WrongKeyLength> {
    bytes.try_into().map_err(|_| WrongKeyLength {
        received: bytes.len(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_a_key_of_exactly_the_right_size() {
        let bytes = [7u8; SECRET_KEY_BYTES];

        assert_eq!(parse_secret_key(&bytes), Ok(bytes));
    }

    #[test]
    fn rejects_a_key_that_is_too_short() {
        let error = parse_secret_key(&[0u8; SECRET_KEY_BYTES - 1]).unwrap_err();

        assert_eq!(error.received, SECRET_KEY_BYTES - 1);
    }

    #[test]
    fn rejects_a_key_that_is_too_long() {
        let error = parse_secret_key(&[0u8; SECRET_KEY_BYTES + 1]).unwrap_err();

        assert_eq!(error.received, SECRET_KEY_BYTES + 1);
    }

    #[test]
    fn rejects_an_empty_key() {
        let error = parse_secret_key(&[]).unwrap_err();

        assert_eq!(error.received, 0);
    }

    /// The message is what the host sees in the thrown error, so it names
    /// both the expected size and what actually turned up.
    #[test]
    fn names_both_sizes_when_it_rejects() {
        let error = parse_secret_key(&[0u8; 16]).unwrap_err();

        assert_eq!(
            error.to_string(),
            "a secret key must be exactly 32 bytes, got 16"
        );
    }
}
