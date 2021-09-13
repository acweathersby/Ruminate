// #[allow(non_camel_case_types)]
use super::primitives::crdt::ASCII_CRDT;
///
use super::primitives::uuid::UUID;
use std::collections::HashMap;

pub type NoteLocalID = u32;

pub type NoteUUID = UUID;

pub type NoteLinkID = u32;

pub type NoteLinkMeta = NoteMeta;

pub type NoteInternalCRDT = ASCII_CRDT;

pub type TagHash = u128;

pub type TagString = String;

pub type SiteLocalID = u32;

pub type SiteUUID = UUID;

pub type SiteName = String;

// Normally these objects would be replaced with a table
// mechanism, but that process will be deferred until a
// later point.
pub struct Store {
    pub tag_string_to_tag_hash: HashMap<TagString, TagHash>,
    pub tag_hash_to_note: HashMap<TagHash, NoteLocalID>,
    pub note_uuid_to_local_id: HashMap<NoteUUID, NoteLocalID>,
    pub note_data: HashMap<NoteLocalID, NoteInternalCRDT>,
    pub note_tag_meta: HashMap<NoteLocalID, NoteMeta>,
    pub site_uuid_to_local_site: HashMap<SiteLocalID, SiteUUID>,
    pub site_uuid_to_name: HashMap<SiteLocalID, SiteName>,
}

impl Store {
    pub fn new() -> Self {
        Store {
            tag_string_to_tag_hash: HashMap::new(),
            tag_hash_to_note: HashMap::new(),
            note_uuid_to_local_id: HashMap::new(),
            note_data: HashMap::new(),
            note_tag_meta: HashMap::new(),
            site_uuid_to_local_site: HashMap::new(),
            site_uuid_to_name: HashMap::new(),
        }
    }
}

static mut global_store: Option<Store> = None;
struct NoteMeta {}
