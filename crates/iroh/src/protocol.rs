//! What an endpoint speaks on the wire.
//!
//! iroh multiplexes by ALPN: an endpoint advertises the protocols it
//! accepts when it binds, a dialer names the one it wants, and inbound
//! connections are dispatched on the one that was negotiated. So the set
//! has to be known before connecting, which is why the host declares it
//! when it builds an [`Endpoint`](crate::Endpoint) rather than when it dials.
//!
//! Each protocol also carries the ceiling on an inbound message. That's
//! ours, not iroh's — it's the bound handed to the stream reader, and thus
//! the limit on what an unauthenticated peer can make us buffer.
//!
//! Kept clear of [`iroh`] so the validation rules here are covered by the
//! native tests.

/// Longest an ALPN may be. TLS length-prefixes each protocol name with a
/// single byte, so 255 is the wire format's own ceiling rather than one we
/// picked.
pub const MAX_PROTOCOL_NAME_BYTES: usize = 255;

/// Largest `maxMessageSize` a protocol may declare: 64 MiB. A guard
/// against a host asking us to buffer something absurd, not a considered
/// budget — every real ALPN should sit orders of magnitude under it.
pub const MAX_MESSAGE_CEILING: usize = 64 * 1024 * 1024;

/// A protocol declaration the host got wrong. Each variant is something a
/// caller can fix by changing what it passed.
///
/// Not `Eq`: [`Self::BadMessageSize`] carries the value as given, which
/// may be a NaN.
#[derive(Debug, PartialEq)]
pub enum ProtocolError {
    /// The protocol table was empty. An endpoint with no ALPNs can neither
    /// accept nor dial anything, so it's a caller mistake rather than a
    /// degraded mode worth supporting.
    NoProtocols,

    /// A protocol name was empty or longer than [`MAX_PROTOCOL_NAME_BYTES`].
    BadName {
        /// The name as given, so the message can quote it back.
        name: String,
    },

    /// A `maxMessageSize` that wasn't a positive whole number of bytes
    /// within [`MAX_MESSAGE_CEILING`]. Covers negatives, zero, fractions,
    /// and the non-finite values a JS number can hold.
    BadMessageSize {
        /// Which protocol carried it.
        name: String,
        /// The value as given.
        given: f64,
    },
}

impl core::fmt::Display for ProtocolError {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            Self::NoProtocols => {
                write!(formatter, "an endpoint must declare at least one protocol")
            }

            Self::BadName { name } => write!(
                formatter,
                "protocol name `{name}` must be between 1 and {MAX_PROTOCOL_NAME_BYTES} bytes"
            ),

            Self::BadMessageSize { name, given } => write!(
                formatter,
                "`maxMessageSize` for protocol `{name}` must be a whole number of bytes \
                 between 1 and {MAX_MESSAGE_CEILING}, got {given}"
            ),
        }
    }
}

/// One protocol an endpoint speaks, and the terms it speaks it on.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Protocol {
    name: String,
    max_message_size: usize,
}

impl Protocol {
    /// Validate one protocol declaration as the host wrote it. `max_message_size`
    /// arrives as an `f64` because that's what a JS number is — the whole-number
    /// and range checks live here rather than at the boundary.
    pub fn new(name: String, max_message_size: f64) -> Result<Self, ProtocolError> {
        if name.is_empty() || name.len() > MAX_PROTOCOL_NAME_BYTES {
            return Err(ProtocolError::BadName { name });
        }

        // Ordered comparisons are false for NaN, so this rejects it along
        // with infinities and out-of-range values. `fract` catches the
        // fractional byte counts that would otherwise truncate silently.
        let valid = max_message_size >= 1.0
            && max_message_size <= MAX_MESSAGE_CEILING as f64
            && max_message_size.fract() == 0.0;

        if !valid {
            return Err(ProtocolError::BadMessageSize {
                name,
                given: max_message_size,
            });
        }

        Ok(Self {
            name,
            max_message_size: max_message_size as usize,
        })
    }

    /// The ALPN, as the host named it.
    pub fn name(&self) -> &str {
        &self.name
    }

    /// The ALPN as it goes on the wire.
    pub fn alpn(&self) -> Vec<u8> {
        self.name.as_bytes().to_vec()
    }

    /// Largest inbound message this protocol will read off a stream.
    pub fn max_message_size(&self) -> usize {
        self.max_message_size
    }
}

/// Every protocol an endpoint speaks. Built once when the endpoint is
/// defined and read from both directions after: the ALPNs go out at bind
/// time, and an inbound connection is matched back to its entry to find
/// the message ceiling to read it under.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProtocolTable {
    entries: Vec<Protocol>,
}

impl ProtocolTable {
    /// Build the table, rejecting one that declares nothing.
    ///
    /// Duplicate names aren't checked: the entries come from the keys of a
    /// JS object, which can't hold two of the same.
    pub fn new(entries: Vec<Protocol>) -> Result<Self, ProtocolError> {
        if entries.is_empty() {
            return Err(ProtocolError::NoProtocols);
        }

        Ok(Self { entries })
    }

    /// The ALPNs to advertise when binding.
    pub fn alpns(&self) -> Vec<Vec<u8>> {
        self.entries.iter().map(Protocol::alpn).collect()
    }

    /// Look a protocol up by the name the host declared it under — the path
    /// a dial takes, since the host names the protocol it wants.
    pub fn find(&self, name: &str) -> Option<&Protocol> {
        self.entries.iter().find(|entry| entry.name == name)
    }

    /// Look a protocol up by the ALPN that was negotiated — the path an
    /// inbound connection takes, since iroh reports raw bytes.
    pub fn find_alpn(&self, alpn: &[u8]) -> Option<&Protocol> {
        self.entries
            .iter()
            .find(|entry| entry.name.as_bytes() == alpn)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn protocol(name: &str) -> Protocol {
        Protocol::new(name.to_owned(), 1024.0).expect("valid protocol")
    }

    #[test]
    fn accepts_an_ordinary_declaration() {
        let entry = protocol("beam/0");

        assert_eq!(entry.name(), "beam/0");
        assert_eq!(entry.max_message_size(), 1024);
        assert_eq!(entry.alpn(), b"beam/0".to_vec());
    }

    #[test]
    fn rejects_an_empty_protocol_name() {
        let error = Protocol::new(String::new(), 1024.0).unwrap_err();

        assert_eq!(
            error,
            ProtocolError::BadName {
                name: String::new()
            }
        );
    }

    /// TLS length-prefixes an ALPN with one byte, so 255 is the last name
    /// that fits and 256 is the first that can't.
    #[test]
    fn accepts_the_longest_name_the_wire_format_allows() {
        let name = "a".repeat(MAX_PROTOCOL_NAME_BYTES);

        assert!(Protocol::new(name, 1024.0).is_ok());
    }

    #[test]
    fn rejects_a_name_one_byte_past_the_limit() {
        let name = "a".repeat(MAX_PROTOCOL_NAME_BYTES + 1);

        assert!(Protocol::new(name, 1024.0).is_err());
    }

    /// The limit is bytes, not characters — a name of multi-byte
    /// characters overruns sooner than its length suggests.
    #[test]
    fn measures_a_name_in_bytes_rather_than_characters() {
        let name = "é".repeat(MAX_PROTOCOL_NAME_BYTES);

        assert!(Protocol::new(name, 1024.0).is_err());
    }

    #[test]
    fn rejects_a_message_size_of_zero() {
        let error = Protocol::new("beam/0".to_owned(), 0.0).unwrap_err();

        assert!(matches!(error, ProtocolError::BadMessageSize { .. }));
    }

    /// The `-1` escape hatch a host might reach for. There is no unbounded
    /// mode: the ceiling is what stops an unauthenticated peer buffering
    /// arbitrary bytes into our heap.
    #[test]
    fn rejects_a_negative_message_size() {
        assert!(Protocol::new("beam/0".to_owned(), -1.0).is_err());
    }

    #[test]
    fn rejects_a_fractional_message_size() {
        assert!(Protocol::new("beam/0".to_owned(), 1024.5).is_err());
    }

    #[test]
    fn rejects_the_non_finite_values_a_js_number_can_hold() {
        assert!(Protocol::new("beam/0".to_owned(), f64::NAN).is_err());
        assert!(Protocol::new("beam/0".to_owned(), f64::INFINITY).is_err());
        assert!(Protocol::new("beam/0".to_owned(), f64::NEG_INFINITY).is_err());
    }

    #[test]
    fn accepts_a_message_size_at_the_ceiling() {
        let entry = Protocol::new("beam/0".to_owned(), MAX_MESSAGE_CEILING as f64)
            .expect("the ceiling itself is allowed");

        assert_eq!(entry.max_message_size(), MAX_MESSAGE_CEILING);
    }

    #[test]
    fn rejects_a_message_size_past_the_ceiling() {
        let size = (MAX_MESSAGE_CEILING + 1) as f64;

        assert!(Protocol::new("beam/0".to_owned(), size).is_err());
    }

    #[test]
    fn rejects_a_table_that_declares_nothing() {
        assert_eq!(
            ProtocolTable::new(Vec::new()),
            Err(ProtocolError::NoProtocols)
        );
    }

    #[test]
    fn advertises_every_declared_alpn() {
        let table = ProtocolTable::new(vec![protocol("beam/0"), protocol("blobs/1")])
            .expect("a populated table");

        assert_eq!(table.alpns(), vec![b"beam/0".to_vec(), b"blobs/1".to_vec()]);
    }

    #[test]
    fn finds_a_protocol_by_the_name_a_dial_asks_for() {
        let table = ProtocolTable::new(vec![protocol("beam/0")]).expect("a populated table");

        assert_eq!(table.find("beam/0"), Some(&protocol("beam/0")));
        assert_eq!(table.find("beam/1"), None);
    }

    /// An inbound connection reports the ALPN as raw bytes, so the lookup
    /// has to match on those rather than on a string the host typed.
    #[test]
    fn finds_a_protocol_by_the_alpn_that_was_negotiated() {
        let table = ProtocolTable::new(vec![protocol("beam/0")]).expect("a populated table");

        assert_eq!(table.find_alpn(b"beam/0"), Some(&protocol("beam/0")));
        assert_eq!(table.find_alpn(b"beam/0\0"), None);
        assert_eq!(table.find_alpn(b""), None);
    }
}
