//! The identity an endpoint runs under.
//!
//! An identity is just a validated secret key: no network, no lifecycle,
//! nothing to tear down. It exists separately from
//! [`Endpoint`](crate::Endpoint) so a host can mint or restore one, read
//! the address it implies, and persist it — all before deciding to join,
//! and without the module holding a secret key of its own.

use crate::secret_key::parse_secret_key;
use iroh::SecretKey;
use wasm_bindgen::prelude::*;

/// An endpoint's identity: its secret key, and the public address that key
/// implies.
///
/// Hand it to [`Endpoint.from`](crate::Endpoint) to run under it. Nothing
/// here touches the network — two endpoints can run under two identities at
/// once, and an identity outlives every endpoint opened with it.
#[wasm_bindgen]
pub struct Identity {
    secret: SecretKey,
}

impl Identity {
    /// The key itself, for the endpoint that binds under it. Private: the
    /// public half is the only part a host has business reading, apart
    /// from the raw bytes it persists.
    pub(crate) fn secret(&self) -> SecretKey {
        self.secret.clone()
    }
}

#[wasm_bindgen]
impl Identity {
    /// Mint a fresh identity. The host persists
    /// [`secretKey`](Self::secret_key) to keep the same address across
    /// reloads; an identity that isn't saved is gone when the page is.
    pub fn create() -> Identity {
        Identity {
            secret: SecretKey::generate(),
        }
    }

    /// Restore a previously persisted identity from the raw 32 bytes of
    /// [`secretKey`](Self::secret_key). Throws if that isn't what it got.
    #[wasm_bindgen(js_name = from)]
    pub fn from_secret_key(bytes: Vec<u8>) -> Result<Identity, JsError> {
        let bytes = parse_secret_key(&bytes).map_err(|err| JsError::new(&err.to_string()))?;

        Ok(Identity {
            secret: SecretKey::from_bytes(&bytes),
        })
    }

    /// The public address peers dial to reach an endpoint running under
    /// this identity, as a base32 string. Derived from the key, so it's
    /// readable straight away — a host can render its share link before, or
    /// without, ever joining.
    #[wasm_bindgen(getter, js_name = endpointId)]
    pub fn endpoint_id(&self) -> String {
        self.secret.public().to_string()
    }

    /// The raw 32 bytes of the secret key, for persisting. Treat it as a
    /// secret: anyone holding it can be this endpoint.
    #[wasm_bindgen(getter, js_name = secretKey)]
    pub fn secret_key(&self) -> Vec<u8> {
        self.secret.to_bytes().to_vec()
    }
}
