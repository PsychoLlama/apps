//! Fan-out for inbound peer messages.
//!
//! [`PeerConnection::on_message`](crate::PeerConnection::on_message) hands
//! back a [`Subscription`] rather than replacing whatever was registered
//! before, so two parts of a host can read the same conversation without
//! knowing about each other. Dropping the handle is what stops delivery —
//! which makes it work under `using` the same way every other handle in
//! this crate does.
//!
//! A relay's own handlers deliberately don't come through here. They're
//! settled when the [`Relay`](crate::Relay) is defined, so they can be
//! neither missing when something arrives nor dropped by losing a handle;
//! the cost is one handler each, which is all either has ever wanted.
//!
//! Generic over the listener so the bookkeeping is exercised by the native
//! tests; on wasm the listener is always a `js_sys::Function`.

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

/// A registered listener, live until this is dropped.
///
/// Freeing it (`unsubscribe()`, `free()`, or leaving a `using` scope) stops
/// delivery. Letting it go out of scope unreferenced does too, but only
/// whenever the JS engine gets around to collecting it — so a host that
/// cares when delivery stops should say so.
#[wasm_bindgen]
pub struct Subscription {
    // `None` once cancelled, so the same subscription can't be removed
    // twice — the second removal could otherwise take a later listener
    // that happened to be issued the same id.
    cancel: Option<Box<dyn FnOnce()>>,
}

impl Subscription {
    /// Wrap the removal step. Private: a subscription is only ever minted
    /// by a [`Registry`].
    fn new(cancel: impl FnOnce() + 'static) -> Self {
        Self {
            cancel: Some(Box::new(cancel)),
        }
    }
}

impl Drop for Subscription {
    fn drop(&mut self) {
        if let Some(cancel) = self.cancel.take() {
            cancel();
        }
    }
}

#[wasm_bindgen]
impl Subscription {
    /// Stop delivering to this listener.
    ///
    /// Consumes the handle, which is the same thing dropping it does —
    /// spelled out for hosts that aren't reaching for `using`.
    pub fn unsubscribe(self) {
        // Dropping `self` on the way out runs the cancel step.
    }
}

/// The listeners registered against one event, each removable by the
/// [`Subscription`] that added it.
///
/// Cheap to clone — clones share one set — so a background task can hold
/// its own handle on the listeners it delivers to.
pub struct Registry<T> {
    slots: Rc<RefCell<Slots<T>>>,
}

struct Slots<T> {
    /// Ids are never reused, so a stale [`Subscription`] can't remove a
    /// listener that took its place.
    next_id: u64,
    entries: Vec<(u64, T)>,
}

impl<T> Clone for Registry<T> {
    fn clone(&self) -> Self {
        Self {
            slots: Rc::clone(&self.slots),
        }
    }
}

impl<T: Clone + 'static> Default for Registry<T> {
    fn default() -> Self {
        Self::new()
    }
}

impl<T: Clone + 'static> Registry<T> {
    pub fn new() -> Self {
        Self {
            slots: Rc::new(RefCell::new(Slots {
                next_id: 0,
                entries: Vec::new(),
            })),
        }
    }

    /// Register a listener, handing back the handle that removes it.
    pub fn subscribe(&self, listener: T) -> Subscription {
        let id = {
            let mut slots = self.slots.borrow_mut();
            let id = slots.next_id;
            slots.next_id += 1;
            slots.entries.push((id, listener));
            id
        };

        let slots = Rc::clone(&self.slots);
        Subscription::new(move || {
            slots.borrow_mut().entries.retain(|(entry, _)| *entry != id);
        })
    }

    /// Everything registered right now, as a snapshot in registration
    /// order.
    ///
    /// A copy rather than a borrow because delivering to a listener runs
    /// host code, and host code is free to subscribe or unsubscribe while
    /// it runs. Iterating the live set across those calls would either
    /// panic on the borrow or skip an entry as the vector shifted under
    /// it. A listener removed mid-delivery still hears this round; it's
    /// gone by the next one.
    pub fn listeners(&self) -> Vec<T> {
        self.slots
            .borrow()
            .entries
            .iter()
            .map(|(_, listener)| listener.clone())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn starts_out_empty() {
        let registry = Registry::<u32>::new();

        assert_eq!(registry.listeners(), Vec::<u32>::new());
    }

    #[test]
    fn delivers_to_every_listener_in_registration_order() {
        let registry = Registry::new();
        let _first = registry.subscribe(1u32);
        let _second = registry.subscribe(2u32);

        assert_eq!(registry.listeners(), vec![1, 2]);
    }

    #[test]
    fn removes_a_listener_when_its_subscription_is_dropped() {
        let registry = Registry::new();
        let first = registry.subscribe(1u32);
        let _second = registry.subscribe(2u32);

        drop(first);

        assert_eq!(registry.listeners(), vec![2]);
    }

    /// `unsubscribe()` is the explicit spelling of the drop, so it has to
    /// do exactly what dropping does and nothing more.
    #[test]
    fn unsubscribing_removes_the_same_listener_dropping_would() {
        let registry = Registry::new();
        let subscription = registry.subscribe(1u32);
        let _other = registry.subscribe(2u32);

        subscription.unsubscribe();

        assert_eq!(registry.listeners(), vec![2]);
    }

    /// Ids are handed out once and never reused, so a subscription
    /// cancelled after a later one was issued can't take the newcomer with
    /// it.
    #[test]
    fn a_cancelled_subscription_cannot_remove_its_successor() {
        let registry = Registry::new();
        let first = registry.subscribe(1u32);

        drop(first);

        let _second = registry.subscribe(2u32);

        assert_eq!(registry.listeners(), vec![2]);
    }

    /// The hazard the snapshot exists for: delivery runs host code, and
    /// that code may unsubscribe. Iterating the live set here would panic
    /// on the outstanding borrow.
    #[test]
    fn survives_unsubscribing_partway_through_delivery() {
        let registry = Registry::new();
        let mut subscription = Some(registry.subscribe(1u32));
        let _second = registry.subscribe(2u32);

        let mut delivered = Vec::new();
        for listener in registry.listeners() {
            delivered.push(listener);
            drop(subscription.take());
        }

        // The removed listener still heard this round...
        assert_eq!(delivered, vec![1, 2]);
        // ...and is gone from the next.
        assert_eq!(registry.listeners(), vec![2]);
    }

    /// Same hazard from the other direction: a listener that subscribes
    /// while being delivered to.
    #[test]
    fn survives_subscribing_partway_through_delivery() {
        let registry = Registry::new();
        let _first = registry.subscribe(1u32);

        let mut added = Vec::new();
        for _ in registry.listeners() {
            added.push(registry.subscribe(2u32));
        }

        assert_eq!(registry.listeners(), vec![1, 2]);
    }

    /// Clones share one set, which is what lets a background task deliver
    /// to listeners the host registered against the handle it kept.
    #[test]
    fn clones_share_one_set_of_listeners() {
        let registry = Registry::new();
        let elsewhere = registry.clone();
        let _subscription = registry.subscribe(1u32);

        assert_eq!(elsewhere.listeners(), vec![1]);
    }
}
