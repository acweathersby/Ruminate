use std::iter::FromIterator;

use js_sys::WebAssembly::Table;
use js_sys::{JsString, Number};
use lib_ruminate::primitives::uuid::UUID;
use lib_ruminate::store::*;
use lib_ruminate::*;
use log::{LevelFilter, Metadata, Record};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::console::*;

// Normally these objects would be replaced with a table
// mechanism, but that process will be deferred until a
// later point.

static mut GLOBAL_STORE: Option<Store> = None;

struct JSLogger;

impl log::Log for JSLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        true
    }

    fn log(&self, record: &Record) {
        unsafe {
            let string = format!("{} - {}", record.level(), record.args());
            log_1(&JsString::from(string.to_owned()));
        };
    }

    fn flush(&self) {}
}

static LOGGER: JSLogger = JSLogger;

#[wasm_bindgen]
pub fn initialize() {
    if let Ok(_) = log::set_logger(&LOGGER) {
        log::set_max_level(LevelFilter::Debug);
    }

    unsafe { GLOBAL_STORE = Some(store_create()) }
}

#[wasm_bindgen]
pub fn create_note() -> u32 {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        return note_create(store);
    }
    return 0;
}

#[wasm_bindgen]
pub fn get_local_id_from_uuid(uuid_string: String) -> JsValue {
    if let Ok(uuid) = UUID::from(&uuid_string) {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Some(local_id) = note_get_local_id_from_uuid(store, uuid) {
                return JsValue::from(local_id);
            }
        }
    }
    JsValue::UNDEFINED
}

#[wasm_bindgen]
pub fn get_note_uuid_string(note_local_id: u32) -> JsValue {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Some(uuid) = note_get_uuid_from_local_id(store, note_local_id) {
            return JsValue::from(uuid.to_string());
        }
    }
    JsValue::UNDEFINED
}

#[wasm_bindgen]
pub fn get_tags() -> Result<Box<[JsValue]>, JsValue> {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        let tags = tag_get_tags(store);
        let out = Vec::from_iter(
            tags.iter()
                .flat_map(|v| (vec![JsValue::from(&v.1), JsValue::from(v.0)])),
        );
        return Ok(out.into_boxed_slice());
    }
    return Err(JsValue::UNDEFINED);
}

#[wasm_bindgen]
pub fn get_notes_from_tag(tag_string: String) -> Result<Box<[JsValue]>, JsValue> {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Some(note_ids) = tag_get_notes(store, &tag_string) {
            let out = Vec::from_iter(note_ids.iter().map(|&v| JsValue::from(v.clone())));
            return Ok(out.into_boxed_slice());
        }
    }
    return Err(JsValue::UNDEFINED);
}

#[wasm_bindgen]
pub fn add_tag(note_local_id: u32, tag_string: String) -> u32 {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Ok(id) = tag_add(store, note_local_id, &tag_string) {
            return id;
        }
    }
    return 0;
}

#[wasm_bindgen]
pub fn remove_tag(note_local_id: u32, tag_string: String) -> bool {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Ok(_) = tag_remove(store, note_local_id, &tag_string) {
            return true;
        }
    }
    return false;
}

#[wasm_bindgen]
pub fn get_tag_string(tag_local_id: u32) -> Result<String, JsValue> {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Some(string) = tag_get_string_from_tag(store, tag_local_id) {
            return Ok(string);
        }
    }
    Err("Could not get tag string".into())
}

#[wasm_bindgen]
pub fn get_tag_ids(note_local_id: u32) -> Vec<u32> {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Some(a) = tag_get_tags_from_note(store, note_local_id) {
            return Vec::from_iter(a.iter().map(|tag| *tag));
        }
    }
    return vec![];
}

#[wasm_bindgen]
pub fn insert_text(note_local_id: u32, insert_index: u32, string: String) -> bool {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Ok(_) = note_insert_text(store, note_local_id, insert_index as usize, &string) {
            return true;
        }
    }

    false
}

#[wasm_bindgen]
pub fn delete_text(note_local_id: u32, insert_index: u32, count: u32) -> bool {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Ok(_) = note_delete_text(store, note_local_id, insert_index as usize, count) {
            return true;
        }
    }
    false
}
#[wasm_bindgen]
pub fn get_text(note_local_id: u32) -> Result<String, JsValue> {
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        if let Some(string) = note_get_text(store, note_local_id) {
            return Ok(string);
        }
    }
    Err("Could not get note text".into())
}
#[cfg(test)]
mod tests {

    #[test]
    fn test_something() {
        print!("hello world")
    }
}
