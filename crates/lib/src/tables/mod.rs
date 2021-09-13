use super::primitives::crdt::ASCII_CRDT;
///
///
use super::primitives::uuid::UUID;
use std::collections::HashMap;

type note_local_id = u32;

type note_uuid = UUID;

type note_link_id = u32;

type note_link_meta = NoteMeta;

type note_internal_crdt = ASCII_CRDT;

type tag_hash = u128;

type tag_string = String;

type site_local_id = u32;

type site_uuid = UUID;

type site_name = String;

// Normally these objects would be replaced with a table
// mechanism, but that process will be deferred until a
// later point.
struct Store {
    tag_string_to_tag_hash: HashMap<tag_string, tag_hash>,
    tag_hash_to_note: HashMap<tag_hash, note_local_id>,
    note_uuid_to_local_id: HashMap<note_uuid, note_local_id>,
    note_data: HashMap<note_local_id, note_internal_crdt>,
    note_tag_meta: HashMap<note_local_id, NoteMeta>,
    site_uuid_to_local_site: HashMap<site_local_id, site_uuid>,
    site_uuid_to_name: HashMap<site_local_id, site_name>,
}

static mut global_store: Option<Store> = None;
struct NoteMeta {}
