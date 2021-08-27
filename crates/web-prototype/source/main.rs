use js_sys::{JsString, Number};
use lib_ruminate::primitives::crdt::{CRDTDelete, CRDTString, ASCII_CRDT};
use lib_ruminate::primitives::uuid::UUID;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::console::*;

// Normally these objects would be replaced with a table
// mechanism, but that process will be deferred until a
// later point.
struct Store {
    uuid_to_local_id: HashMap<UUID, u32>,
    local_id_to_uuid: HashMap<u32, UUID>,
    local_crdt_strings: HashMap<u32, ASCII_CRDT>,
}

static mut global_store: Option<Store> = None;

#[wasm_bindgen]
pub fn initialize() {
    unsafe {
        global_store = Some(Store {
            uuid_to_local_id: HashMap::new(),
            local_id_to_uuid: HashMap::new(),
            local_crdt_strings: HashMap::new(),
        })
    }
}

static mut nonce: u32 = 0;

#[wasm_bindgen]
pub fn create_note() -> u32 {
    // This will generate a new UUID that will be used to reference
    // This note from here on out. For local uses, this UUID is mapped
    // to a nonce.

    let site: u32 = 1;

    let note_local_id = unsafe {
        nonce += 1;
        nonce
    };

    dev_log("Creating note uuid");

    let note_uuid = UUID::new(site);

    dev_log("Registering note uuid into local cache");

    if let Some(store) = unsafe { global_store.as_mut() } {
        store.uuid_to_local_id.insert(note_uuid, note_local_id);
        store.local_id_to_uuid.insert(note_local_id, note_uuid);
    }

    dev_log(&format!(
        "{:?} created with local id {:?}",
        note_uuid, note_local_id
    ));

    dev_log("Creating ASCII CRDT string for note");

    if let Some(store) = unsafe { global_store.as_mut() } {
        store
            .local_crdt_strings
            .insert(note_local_id, ASCII_CRDT::new(site));
    }

    dev_log("Returning local note handle");

    return note_local_id;
}

pub fn get_tags() -> JsValue {
    JsValue::from(Number::from(0))
}

pub fn set_tag() {}

#[wasm_bindgen]
pub fn get_note_clock(note_local_id: u32) -> f64 {
    if let Some(store) = unsafe { global_store.as_mut() } {
        if let Some(data) = store.local_crdt_strings.get_mut(&note_local_id) {
            return data.get_local_clock().get_clock() as f64;
        }
    }
    return -1.0;
}

#[wasm_bindgen]
pub fn insert_text(note_local_id: u32, insert_index: u32, string: String) -> bool {
    let bytes = string.as_bytes();

    dev_log("Selecting note data from store");

    if let Some(store) = unsafe { global_store.as_mut() } {
        if let Some(data) = store.local_crdt_strings.get_mut(&note_local_id) {
            dev_log("Inserting text into note:");
            dev_log(&format!("String Length {:?}:", string.len()));
            dev_log(&format!("String Contents {:?}:", string));
            data.insert(insert_index as usize, bytes);

            return true;
        } else {
            dev_log("Unable to retrieve note data");
        }
    }

    false
}

#[wasm_bindgen]
pub fn delete_text() -> JsValue {
    JsValue::from(Number::from(0))
}

#[wasm_bindgen]
pub fn get_text(note_local_id: u32) -> String {
    if let Some(store) = unsafe { global_store.as_mut() } {
        if let Some(data) = store.local_crdt_strings.get(&note_local_id) {
            dev_log("Retrieving note contents");
            if let Ok(note_string) = String::from_utf8(data.vector()) {
                return note_string;
            }
        }
    }

    dev_log("Unable to retrieve note data");
    "test".into()
}

pub fn dev_log(message: &str) {
    unsafe {
        log_1(&JsString::from("Ruminate Dev Log: ".to_owned() + message));
    }
}

#[cfg(test)]
mod tests {

    #[test]
    fn test_something() {
        print!("hello world")
    }
}
